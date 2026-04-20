import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { getProductById, getVariantById } from "@/services/adminService";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  clearAdminCurrentProduct,
  createAdminProduct,
  createAdminVariant,
  fetchAdminProductDetail,
  fetchAdminProducts,
  removeAdminProduct,
  removeAdminProductImage,
  removeAdminVariant,
  selectAdminState,
  setAdminPrimaryProductImage,
  toggleAdminProductStatus,
  updateAdminProduct,
  updateAdminVariant,
  uploadAdminProductImages,
} from "@/store/admin/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const PRODUCT_TYPES = ["Frame", "Sunglasses", "Lens"];

const DEFAULT_PRODUCT_FORM = {
  productName: "",
  sku: "",
  categoryId: "",
  productType: PRODUCT_TYPES[0],
  basePrice: "",
  prescriptionCompatible: false,
  description: "",
};

const DEFAULT_CREATE_COLOR_FORM = {
  colorName: "",
  colorCode: "#000000",
  quantity: "",
  size: "",
  frameType: "",
  imageFiles: [],
  imagePreviews: [],
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

const DEFAULT_EDIT_PRODUCT_FORM = {
  productId: null,
  productName: "",
  categoryId: "",
  productType: PRODUCT_TYPES[0],
  basePrice: "",
  prescriptionCompatible: false,
  description: "",
};

function createEmptyEditVariant(variantId = null) {
  return {
    variantId,
    sku: "",
    price: "",
    quantity: "0",
    color: "",
    size: "",
    frameType: "",
    isPreOrderAllowed: false,
    expectedRestockDate: "",
    preOrderNote: "",
  };
}

function normalizeSkuSegment(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function revokeDraftPreviews(drafts) {
  drafts.forEach((draft) => {
    draft.imagePreviews?.forEach((preview) => URL.revokeObjectURL(preview));
  });
}

function buildUniqueVariantSku(baseSku, colorName, existingDrafts) {
  const normalizedBase = normalizeSkuSegment(baseSku) || "SKU";
  const normalizedColor = normalizeSkuSegment(colorName) || "COLOR";
  let candidate = `${normalizedBase}-${normalizedColor}`;
  let suffix = 2;

  while (existingDrafts.some((draft) => draft.sku === candidate)) {
    candidate = `${normalizedBase}-${normalizedColor}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function buildEditProductForm(detail) {
  return {
    productId: detail?.productId ?? null,
    productName: detail?.productName ?? "",
    categoryId: detail?.categoryId != null ? String(detail.categoryId) : "",
    productType: detail?.productType || PRODUCT_TYPES[0],
    basePrice: detail?.basePrice != null ? String(detail.basePrice) : "",
    prescriptionCompatible: Boolean(detail?.prescriptionCompatible),
    description: detail?.description ?? "",
  };
}

function buildEditVariantForm(variant, fallbackPrice = 0) {
  const form = createEmptyEditVariant(variant?.variantId ?? null);

  return {
    ...form,
    sku: variant?.sku ?? "",
    price: String(variant?.price ?? fallbackPrice ?? ""),
    quantity: String(variant?.quantity ?? 0),
    color: variant?.color ?? "",
    size: variant?.size ?? "",
    frameType: variant?.frameType ?? "",
    isPreOrderAllowed: Boolean(variant?.isPreOrderAllowed),
    expectedRestockDate: variant?.expectedRestockDate ? String(variant.expectedRestockDate).slice(0, 10) : "",
    preOrderNote: variant?.preOrderNote ?? "",
  };
}

export function useAdminProductsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector(selectAuthState);
  const admin = useAppSelector(selectAdminState);
  const { popupAlert, popupConfirm, popupElement } = usePopupDialog();

  const [form, setForm] = useState(DEFAULT_PRODUCT_FORM);
  const [currentColorForm, setCurrentColorForm] = useState(DEFAULT_CREATE_COLOR_FORM);
  const [draftVariants, setDraftVariants] = useState([]);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productSummaries, setProductSummaries] = useState({});
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);
  const [variantForm, setVariantForm] = useState(DEFAULT_VARIANT_FORM);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingEditProduct, setIsLoadingEditProduct] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [editForm, setEditForm] = useState(DEFAULT_EDIT_PRODUCT_FORM);
  const [editVariants, setEditVariants] = useState([]);
  const [savingVariantIds, setSavingVariantIds] = useState([]);
  const [deletingVariantIds, setDeletingVariantIds] = useState([]);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void dispatch(fetchAdminProducts());
  }, [auth.accessToken, auth.isReady, dispatch]);

  useEffect(() => {
    if (!auth.accessToken || admin.products.items.length === 0) {
      setProductSummaries({});
      setIsLoadingSummaries(false);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingSummaries(true);

    void Promise.all(
      admin.products.items.map(async (product) => {
        try {
          const detail = await getProductById(product.productId, auth.accessToken);
          const variants = detail?.variants ?? [];
          const colors = Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean)));
          const totalStock = variants.reduce((sum, variant) => sum + Number(variant.quantity || 0), 0);

          return [
            String(product.productId),
            {
              primarySku: variants[0]?.sku || "-",
              colors,
              totalStock,
              variantCount: variants.length,
            },
          ];
        } catch {
          return [
            String(product.productId),
            {
              primarySku: "-",
              colors: [],
              totalStock: 0,
              variantCount: 0,
            },
          ];
        }
      }),
    ).then((entries) => {
      if (!isMounted) {
        return;
      }

      setProductSummaries(Object.fromEntries(entries));
      setIsLoadingSummaries(false);
    });

    return () => {
      isMounted = false;
    };
  }, [admin.products.items, auth.accessToken]);

  function resetCreateProductBuilder() {
    revokeDraftPreviews([currentColorForm, ...draftVariants]);
    setForm(DEFAULT_PRODUCT_FORM);
    setCurrentColorForm(DEFAULT_CREATE_COLOR_FORM);
    setDraftVariants([]);
  }

  function resetEditModalState() {
    setEditForm(DEFAULT_EDIT_PRODUCT_FORM);
    setEditVariants([]);
    setSavingVariantIds([]);
    setDeletingVariantIds([]);
  }

  function clearCurrentProductIfUnused(nextDetailOpen, nextEditOpen) {
    if (!nextDetailOpen && !nextEditOpen) {
      dispatch(clearAdminCurrentProduct());
    }
  }

  async function loadProductForEditing(productId, syncVariants = true) {
    const detail = await dispatch(fetchAdminProductDetail(productId)).unwrap();

    if (!syncVariants || !auth.accessToken) {
      return detail;
    }

    const variants = await Promise.all(
      (detail?.variants ?? []).map(async (variant) => {
        try {
          return await getVariantById(variant.variantId, auth.accessToken);
        } catch {
          return variant;
        }
      }),
    );

    setEditVariants(variants.map((variant) => buildEditVariantForm(variant, detail?.basePrice ?? 0)));
    return detail;
  }

  function setCurrentColorField(field, value) {
    setCurrentColorForm((current) => ({ ...current, [field]: value }));
  }

  function setEditVariantField(variantId, field, value) {
    setEditVariants((current) =>
      current.map((variant) =>
        variant.variantId === variantId
          ? {
              ...variant,
              [field]: value,
            }
          : variant,
      ),
    );
  }

  function attachColorImages(fileList) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) {
      return;
    }

    const previews = files.map((file) => URL.createObjectURL(file));

    setCurrentColorForm((current) => ({
      ...current,
      imageFiles: [...current.imageFiles, ...files],
      imagePreviews: [...current.imagePreviews, ...previews],
    }));
  }

  function removeColorImage(index) {
    setCurrentColorForm((current) => {
      const previewToRemove = current.imagePreviews[index];
      if (previewToRemove) {
        URL.revokeObjectURL(previewToRemove);
      }

      return {
        ...current,
        imageFiles: current.imageFiles.filter((_, fileIndex) => fileIndex !== index),
        imagePreviews: current.imagePreviews.filter((_, previewIndex) => previewIndex !== index),
      };
    });
  }

  async function addDraftVariant() {
    const quantity = Number(currentColorForm.quantity);

    if (!form.sku.trim()) {
      await popupAlert("Vui long nhap SKU goc trong phan thong tin co ban.");
      return;
    }

    if (!currentColorForm.colorName.trim()) {
      await popupAlert("Vui long chon mau sac.");
      return;
    }

    if (Number.isNaN(quantity) || quantity < 0) {
      await popupAlert("Ton kho khong hop le.");
      return;
    }

    if (currentColorForm.imageFiles.length === 0) {
      await popupAlert("Vui long tai len it nhat 1 hinh anh cho mau nay.");
      return;
    }

    const sku = buildUniqueVariantSku(form.sku, currentColorForm.colorName, draftVariants);

    setDraftVariants((current) => [
      ...current,
      {
        sku,
        colorName: currentColorForm.colorName.trim(),
        colorCode: currentColorForm.colorCode,
        quantity,
        size: currentColorForm.size.trim(),
        frameType: currentColorForm.frameType.trim(),
        imageFiles: currentColorForm.imageFiles,
        imagePreviews: currentColorForm.imagePreviews,
      },
    ]);

    setCurrentColorForm(DEFAULT_CREATE_COLOR_FORM);
  }

  function removeDraftVariant(index) {
    setDraftVariants((current) => {
      const removed = current[index];
      removed?.imagePreviews?.forEach((preview) => URL.revokeObjectURL(preview));
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function createProduct(event) {
    event.preventDefault();

    if (!form.categoryId) {
      await popupAlert("Vui long chon danh muc.");
      return null;
    }

    if (!form.sku.trim()) {
      await popupAlert("Vui long nhap SKU goc.");
      return null;
    }

    if (draftVariants.length === 0) {
      await popupAlert("Vui long them it nhat 1 mau sac va ton kho.");
      return null;
    }

    setIsCreatingProduct(true);

    try {
      const created = await dispatch(
        createAdminProduct({
          productName: form.productName.trim(),
          categoryId: Number(form.categoryId),
          productType: form.productType,
          basePrice: Number(form.basePrice || 0),
          prescriptionCompatible: form.prescriptionCompatible,
          description: form.description.trim() || null,
        }),
      ).unwrap();

      const productId = created?.productId;

      if (!productId) {
        throw new Error("Khong nhan duoc productId sau khi tao san pham.");
      }

      for (const draft of draftVariants) {
        await dispatch(
          createAdminVariant({
            productId,
            payload: {
              sku: draft.sku,
              price: Number(form.basePrice || 0),
              quantity: draft.quantity,
              color: draft.colorName || null,
              size: draft.size || null,
              frameType: draft.frameType || null,
              isPreOrderAllowed: false,
              expectedRestockDate: null,
              preOrderNote: null,
            },
          }),
        ).unwrap();
      }

      const imageFiles = draftVariants.flatMap((draft) => draft.imageFiles);
      if (imageFiles.length > 0) {
        await dispatch(uploadAdminProductImages({ productId, files: imageFiles })).unwrap();
      }

      await dispatch(fetchAdminProducts()).unwrap();
      resetCreateProductBuilder();
      await popupAlert("Tao san pham thanh cong.");
      return { productId };
    } catch (error) {
      await popupAlert(error || "Khong tao duoc san pham.");
      return null;
    } finally {
      setIsCreatingProduct(false);
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

  async function openEditModal(product) {
    setIsLoadingEditProduct(true);

    try {
      const detail = await loadProductForEditing(product.productId, true);
      setIsDetailModalOpen(false);
      setEditForm(buildEditProductForm(detail));
      setIsEditModalOpen(true);
    } catch (error) {
      await popupAlert(error || "Khong tai duoc thong tin san pham de chinh sua.");
    } finally {
      setIsLoadingEditProduct(false);
    }
  }

  function closeEditModal() {
    if (isUpdatingProduct) {
      return;
    }

    const nextDetailOpen = isDetailModalOpen;
    setIsEditModalOpen(false);
    resetEditModalState();
    clearCurrentProductIfUnused(nextDetailOpen, false);
  }

  async function submitEditProduct(event) {
    event.preventDefault();

    if (!editForm.productId) {
      await popupAlert("Khong xac dinh duoc san pham can cap nhat.");
      return false;
    }

    if (!editForm.categoryId) {
      await popupAlert("Vui long chon danh muc.");
      return false;
    }

    setIsUpdatingProduct(true);

    try {
      await dispatch(
        updateAdminProduct({
          productId: editForm.productId,
          payload: {
            productName: editForm.productName.trim(),
            categoryId: Number(editForm.categoryId),
            productType: editForm.productType,
            basePrice: Number(editForm.basePrice || 0),
            prescriptionCompatible: editForm.prescriptionCompatible,
            description: editForm.description.trim() || null,
          },
        }),
      ).unwrap();

      await dispatch(fetchAdminProducts()).unwrap();
      const refreshedDetail = await loadProductForEditing(editForm.productId, true);
      setEditForm(buildEditProductForm(refreshedDetail));
      await popupAlert("Cap nhat san pham thanh cong.");
      return true;
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc san pham.");
      return false;
    } finally {
      setIsUpdatingProduct(false);
    }
  }

  async function saveEditVariant(variantId) {
    const variant = editVariants.find((item) => item.variantId === variantId);

    if (!variant) {
      return;
    }

    const normalizedSku = variant.sku.trim();
    const price = Number(variant.price);
    const quantity = Number(variant.quantity);

    if (!normalizedSku) {
      await popupAlert("SKU variant khong duoc de trong.");
      return;
    }

    if (Number.isNaN(price) || price < 0 || Number.isNaN(quantity) || quantity < 0) {
      await popupAlert("Gia hoac so luong variant khong hop le.");
      return;
    }

    setSavingVariantIds((current) => [...current, variantId]);

    try {
      await dispatch(
        updateAdminVariant({
          variantId,
          payload: {
            sku: normalizedSku,
            price,
            quantity,
            color: variant.color.trim() || null,
            size: variant.size.trim() || null,
            frameType: variant.frameType.trim() || null,
            isPreOrderAllowed: variant.isPreOrderAllowed,
            expectedRestockDate: variant.isPreOrderAllowed && variant.expectedRestockDate ? variant.expectedRestockDate : null,
            preOrderNote: variant.isPreOrderAllowed ? variant.preOrderNote.trim() || null : null,
          },
        }),
      ).unwrap();

      if (editForm.productId) {
        await dispatch(fetchAdminProducts()).unwrap();
        await loadProductForEditing(editForm.productId, true);
      }

      await popupAlert("Cap nhat variant thanh cong.");
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc variant.");
    } finally {
      setSavingVariantIds((current) => current.filter((item) => item !== variantId));
    }
  }

  async function deleteEditVariant(variantId) {
    const isConfirmed = await popupConfirm("Ban co chac muon xoa variant nay?", {
      title: "Xoa variant",
      okText: "Xoa",
    });

    if (!isConfirmed) {
      return;
    }

    setDeletingVariantIds((current) => [...current, variantId]);

    try {
      await dispatch(removeAdminVariant(variantId)).unwrap();

      if (editForm.productId) {
        await dispatch(fetchAdminProducts()).unwrap();
        await loadProductForEditing(editForm.productId, true);
      }

      await popupAlert("Da xoa variant.");
    } catch (error) {
      await popupAlert(error || "Khong xoa duoc variant.");
    } finally {
      setDeletingVariantIds((current) => current.filter((item) => item !== variantId));
    }
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

      if (admin.currentProduct.data?.productId === variantForm.productId || editForm.productId === variantForm.productId) {
        await loadProductForEditing(variantForm.productId, isEditModalOpen);
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
      setIsDetailModalOpen(true);
    } catch (error) {
      await popupAlert(error || "Khong tai duoc chi tiet san pham.");
    }
  }

  function closeDetail() {
    const nextEditOpen = isEditModalOpen;
    setIsDetailModalOpen(false);
    clearCurrentProductIfUnused(false, nextEditOpen);
  }

  async function toggleProductStatus(product) {
    if (!product.isActive && !product.isAvailable) {
      await popupAlert("San pham chua co ton kho. Vao Quan Ly Kho de nhap so luong truoc khi mo ban.");
      navigate("/admin/inventory");
      return;
    }

    try {
      await dispatch(toggleAdminProductStatus(product)).unwrap();
      await popupAlert(
        product.isActive
          ? "Da ngung ban san pham va dua ton kho ve 0."
          : "Da mo ban lai san pham.",
      );
      await dispatch(fetchAdminProducts()).unwrap();

      if (admin.currentProduct.data?.productId === product.productId || editForm.productId === product.productId) {
        await loadProductForEditing(product.productId, isEditModalOpen);
      }
    } catch (error) {
      const errorMessage = String(error || "");

      if (errorMessage.includes("variant trong kho")) {
        await popupAlert("San pham chua co variant trong kho.");
        navigate("/admin/inventory");
        return;
      }

      if (errorMessage.includes("ton kho")) {
        await popupAlert("San pham chua co ton kho. Vao Quan Ly Kho de nhap so luong truoc khi mo ban.");
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

      if (admin.currentProduct.data?.productId === product.productId || editForm.productId === product.productId) {
        setIsEditModalOpen(false);
        setIsDetailModalOpen(false);
        resetEditModalState();
        dispatch(clearAdminCurrentProduct());
      }

      await dispatch(fetchAdminProducts()).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong xoa duoc san pham.");
    }
  }

  async function uploadImages(event) {
    const files = event.target.files;
    const productId = admin.currentProduct.data?.productId ?? editForm.productId;

    if (!files?.length || !productId) {
      return;
    }

    try {
      await dispatch(uploadAdminProductImages({ productId, files })).unwrap();
      await loadProductForEditing(productId, isEditModalOpen);
    } catch (error) {
      await popupAlert(error || "Khong upload duoc anh san pham.");
    } finally {
      event.target.value = "";
    }
  }

  async function setPrimaryImage(image) {
    const productId = admin.currentProduct.data?.productId ?? editForm.productId;

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
      await loadProductForEditing(productId, isEditModalOpen);
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc anh chinh.");
    }
  }

  async function deleteImage(image) {
    const productId = admin.currentProduct.data?.productId ?? editForm.productId;

    if (!productId) {
      return;
    }

    try {
      await dispatch(removeAdminProductImage({ productId, imageId: image.imageId })).unwrap();
      await loadProductForEditing(productId, isEditModalOpen);
    } catch (error) {
      await popupAlert(error || "Khong xoa duoc anh.");
    }
  }

  return {
    products: admin.products.items,
    categories: admin.products.categories,
    productDetail: admin.currentProduct.data,
    form,
    editForm,
    editVariants,
    currentColorForm,
    draftVariants,
    productSummaries,
    variantForm,
    ui: {
      error: admin.products.error ?? (!auth.accessToken && auth.isReady ? "Khong co access token." : null),
      isLoading: admin.products.status === "loading",
      isLoadingSummaries,
      detailLoading: admin.currentProduct.status === "loading",
      isDetailModalOpen,
      isCreatingProduct,
      isEditModalOpen,
      isLoadingEditProduct,
      isUpdatingProduct,
      isVariantModalOpen,
      isCreatingVariant,
      savingVariantIds,
      deletingVariantIds,
    },
    actions: {
      setFormField: (field, value) => setForm((current) => ({ ...current, [field]: value })),
      setEditFormField: (field, value) => setEditForm((current) => ({ ...current, [field]: value })),
      setEditVariantField,
      setCurrentColorField,
      attachColorImages,
      removeColorImage,
      addDraftVariant,
      removeDraftVariant,
      resetCreateProductBuilder,
      setVariantField: (field, value) => setVariantForm((current) => ({ ...current, [field]: value })),
      retry: () => dispatch(fetchAdminProducts()),
      createProduct,
      openEditModal,
      closeEditModal,
      submitEditProduct,
      saveEditVariant,
      deleteEditVariant,
      openVariantModal,
      closeVariantModal,
      submitVariant,
      viewDetail,
      closeDetail,
      toggleProductStatus,
      deleteProduct,
      uploadImages,
      setPrimaryImage,
      deleteImage,
      clearDetail: closeDetail,
    },
    popupElement,
  };
}
