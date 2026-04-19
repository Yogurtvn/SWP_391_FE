import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  clearAdminCurrentProduct,
  createAdminCategory,
  createAdminProduct,
  createAdminVariant,
  fetchAdminProductDetail,
  fetchAdminProducts,
  removeAdminProduct,
  removeAdminProductImage,
  selectAdminState,
  setAdminPrimaryProductImage,
  toggleAdminProductStatus,
  uploadAdminProductImages,
} from "@/store/admin/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const PRODUCT_TYPES = ["Frame", "Sunglasses", "Lens"];

const DEFAULT_PRODUCT_FORM = {
  productName: "",
  categoryId: "",
  productType: PRODUCT_TYPES[0],
  basePrice: "",
  prescriptionCompatible: false,
  description: "",
};

const DEFAULT_VARIANT_FORM = {
  productId: null,
  productName: "",
  sku: "",
  price: "",
  quantity: "1",
  color: "",
  size: "",
  frameType: "",
};

export function useAdminProductsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector(selectAuthState);
  const admin = useAppSelector(selectAdminState);
  const { popupAlert, popupConfirm, popupElement } = usePopupDialog();

  const [form, setForm] = useState(DEFAULT_PRODUCT_FORM);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);
  const [variantForm, setVariantForm] = useState(DEFAULT_VARIANT_FORM);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void dispatch(fetchAdminProducts());
  }, [auth.accessToken, auth.isReady, dispatch]);

  async function createCategory(event) {
    event.preventDefault();

    const categoryName = newCategoryName.trim();
    if (!categoryName) {
      await popupAlert("Vui long nhap ten danh muc.");
      return;
    }

    try {
      const created = await dispatch(createAdminCategory({ categoryName })).unwrap();
      setNewCategoryName("");
      await dispatch(fetchAdminProducts()).unwrap();

      if (created?.categoryId) {
        setForm((current) => ({ ...current, categoryId: String(created.categoryId) }));
      }
    } catch (error) {
      await popupAlert(error || "Khong tao duoc danh muc.");
    }
  }

  async function createProduct(event) {
    event.preventDefault();

    if (!form.categoryId) {
      await popupAlert("Vui long chon danh muc.");
      return;
    }

    try {
      await dispatch(
        createAdminProduct({
          productName: form.productName.trim(),
          categoryId: Number(form.categoryId),
          productType: form.productType,
          basePrice: Number(form.basePrice || 0),
          prescriptionCompatible: form.prescriptionCompatible,
          description: form.description.trim() || null,
        }),
      ).unwrap();

      setForm(DEFAULT_PRODUCT_FORM);
      await dispatch(fetchAdminProducts()).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong tao duoc san pham.");
    }
  }

  function openVariantModal(product) {
    setVariantForm({
      productId: product.productId,
      productName: product.productName,
      sku: `SKU-${product.productId}-${Date.now()}`,
      price: String(product.basePrice ?? ""),
      quantity: "1",
      color: "",
      size: "",
      frameType: "",
    });
    setIsVariantModalOpen(true);
  }

  function closeVariantModal() {
    if (isCreatingVariant) {
      return;
    }

    setIsVariantModalOpen(false);
    setVariantForm(DEFAULT_VARIANT_FORM);
  }

  async function submitVariant(event) {
    event.preventDefault();

    const normalizedSku = variantForm.sku.trim();
    const price = Number(variantForm.price);
    const quantity = Number(variantForm.quantity);

    if (!variantForm.productId) {
      await popupAlert("Khong xac dinh duoc san pham de tao variant.");
      return;
    }

    if (!normalizedSku) {
      await popupAlert("SKU khong duoc de trong.");
      return;
    }

    if (Number.isNaN(price) || price < 0 || Number.isNaN(quantity) || quantity < 0) {
      await popupAlert("Gia hoac so luong khong hop le.");
      return;
    }

    setIsCreatingVariant(true);

    try {
      await dispatch(
        createAdminVariant({
          productId: variantForm.productId,
          payload: {
            sku: normalizedSku,
            price,
            quantity,
            color: variantForm.color.trim() || null,
            size: variantForm.size.trim() || null,
            frameType: variantForm.frameType.trim() || null,
            isPreOrderAllowed: false,
            expectedRestockDate: null,
            preOrderNote: null,
          },
        }),
      ).unwrap();

      await popupAlert("Tao variant thanh cong.");
      setIsVariantModalOpen(false);
      setVariantForm(DEFAULT_VARIANT_FORM);
      await dispatch(fetchAdminProducts()).unwrap();

      if (admin.currentProduct.data?.productId === variantForm.productId) {
        await dispatch(fetchAdminProductDetail(variantForm.productId)).unwrap();
      }
    } catch (error) {
      await popupAlert(error || "Khong tao duoc variant.");
    } finally {
      setIsCreatingVariant(false);
    }
  }

  async function viewDetail(product) {
    try {
      await dispatch(fetchAdminProductDetail(product.productId)).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong tai duoc chi tiet san pham.");
    }
  }

  async function toggleProductStatus(product) {
    if (!product.isAvailable) {
      await popupAlert("San pham chua co ton kho. Vao Quan Ly Kho de nhap so luong truoc khi mo ban.");
      navigate("/admin/inventory");
      return;
    }

    try {
      await dispatch(toggleAdminProductStatus(product)).unwrap();
      await popupAlert("Da ngung ban san pham va dua ton kho ve 0.");
      await dispatch(fetchAdminProducts()).unwrap();

      if (admin.currentProduct.data?.productId === product.productId) {
        await dispatch(fetchAdminProductDetail(product.productId)).unwrap();
      }
    } catch (error) {
      if (String(error).includes("variant trong kho")) {
        await popupAlert("San pham chua co variant trong kho.");
        navigate("/admin/inventory");
        return;
      }

      await popupAlert(error || "Khong doi duoc trang thai san pham.");
    }
  }

  async function deleteProduct(product) {
    const isConfirmed = await popupConfirm(`Ban co chac muon xoa san pham ${product.productName}?`, {
      title: "Xoa san pham",
      okText: "Xoa",
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await dispatch(removeAdminProduct(product.productId)).unwrap();
      if (admin.currentProduct.data?.productId === product.productId) {
        dispatch(clearAdminCurrentProduct());
      }
      await dispatch(fetchAdminProducts()).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong xoa duoc san pham.");
    }
  }

  async function uploadImages(event) {
    const files = event.target.files;
    const productId = admin.currentProduct.data?.productId;

    if (!files?.length || !productId) {
      return;
    }

    try {
      await dispatch(uploadAdminProductImages({ productId, files })).unwrap();
      await dispatch(fetchAdminProductDetail(productId)).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong upload duoc anh san pham.");
    } finally {
      event.target.value = "";
    }
  }

  async function setPrimaryImage(image) {
    const productId = admin.currentProduct.data?.productId;

    if (!productId) {
      return;
    }

    try {
      await dispatch(
        setAdminPrimaryProductImage({
          productId,
          imageId: image.imageId,
          payload: {
            isPrimary: true,
            displayOrder: image.displayOrder || 1,
          },
        }),
      ).unwrap();
      await dispatch(fetchAdminProductDetail(productId)).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc anh chinh.");
    }
  }

  async function deleteImage(image) {
    const productId = admin.currentProduct.data?.productId;

    if (!productId) {
      return;
    }

    try {
      await dispatch(removeAdminProductImage({ productId, imageId: image.imageId })).unwrap();
      await dispatch(fetchAdminProductDetail(productId)).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong xoa duoc anh.");
    }
  }

  return {
    products: admin.products.items,
    categories: admin.products.categories,
    productDetail: admin.currentProduct.data,
    form,
    newCategoryName,
    variantForm,
    ui: {
      error: admin.products.error ?? (!auth.accessToken && auth.isReady ? "Khong co access token." : null),
      isLoading: admin.products.status === "loading",
      detailLoading: admin.currentProduct.status === "loading",
      isVariantModalOpen,
      isCreatingVariant,
    },
    actions: {
      setFormField: (field, value) => setForm((current) => ({ ...current, [field]: value })),
      setNewCategoryName,
      setVariantField: (field, value) => setVariantForm((current) => ({ ...current, [field]: value })),
      retry: () => dispatch(fetchAdminProducts()),
      createCategory,
      createProduct,
      openVariantModal,
      closeVariantModal,
      submitVariant,
      viewDetail,
      toggleProductStatus,
      deleteProduct,
      uploadImages,
      setPrimaryImage,
      deleteImage,
      clearDetail: () => dispatch(clearAdminCurrentProduct()),
    },
    popupElement,
  };
}
