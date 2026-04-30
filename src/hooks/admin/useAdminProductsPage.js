import { useEffect, useMemo, useState } from "react";
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

const PRODUCT_TYPES = ["Frame", "Lens", "Sunglasses"];

const DEFAULT_PRODUCT_FORM = {
  productName: "",
  sku: "",
  categoryId: "",
  productType: PRODUCT_TYPES[0],
  basePrice: "",
  prescriptionCompatible: false,
  description: "",
};

const DEFAULT_CREATE_VARIANT_PICKER_FORM = {
  selectedVariantId: "",
};

const DEFAULT_CREATE_IMAGE_FORM = {
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
  weightGram: "200",
  packageLengthCm: "10",
  packageWidthCm: "10",
  packageHeightCm: "10",
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

const SKU_COLOR_LABELS = {
  den: "Đen",
  black: "Đen",
  trang: "Trắng",
  white: "Trắng",
  xam: "Xám",
  gray: "Xám",
  grey: "Xám",
  bac: "Bạc",
  silver: "Bạc",
  vang: "Vàng gold",
  gold: "Vàng gold",
  nau: "Nâu",
  brown: "Nâu",
  do: "Đỏ",
  red: "Đỏ",
  xanh: "Xanh dương",
  blue: "Xanh dương",
  xanhduong: "Xanh dương",
  xanhla: "Xanh lá",
  green: "Xanh lá",
  hong: "Hồng",
  pink: "Hồng",
  tim: "Tím",
  purple: "Tím",
  be: "Be",
  beige: "Be",
  trongsuot: "Trong suốt",
  clear: "Trong suốt",
  transparent: "Trong suốt",
  khongmau: "Trong suốt",
  doimau: "Đổi màu",
  photochromic: "Đổi màu",
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
    weightGram: "200",
    packageLengthCm: "10",
    packageWidthCm: "10",
    packageHeightCm: "10",
    isPreOrderAllowed: false,
    expectedRestockDate: "",
    preOrderNote: "",
  };
}

function parsePositiveInteger(value, fallbackValue) {
  const parsedValue = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return parsedValue;
}

function normalizeSkuSegment(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeLookup(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function isMeaningfulColor(value) {
  const normalized = normalizeLookup(value);

  if (!normalized) {
    return false;
  }

  return !["-", "na", "n/a", "default", "macdinh", "khac", "none", "null", "undefined"].includes(normalized);
}

function inferColorFromSku(sku) {
  const normalizedSku = String(sku || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!normalizedSku) {
    return "";
  }

  const token = normalizedSku
    .split(/[^a-z0-9]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .find((segment) => SKU_COLOR_LABELS[segment]);

  return token ? SKU_COLOR_LABELS[token] : "";
}

function resolveVariantColorLabel(variant) {
  const rawColor = String(variant?.color ?? "").trim();

  if (isMeaningfulColor(rawColor)) {
    return rawColor;
  }

  return inferColorFromSku(variant?.sku);
}

function revokeDraftPreviews(drafts) {
  drafts.forEach((draft) => {
    draft.imagePreviews?.forEach((preview) => URL.revokeObjectURL(preview));
  });
}

function buildGeneratedVariantSku(baseSku, productId, sourceVariantId, usedSkus) {
  const normalizedBase = normalizeSkuSegment(baseSku) || "SKU";
  const normalizedProductId = Number(productId);
  const normalizedSourceVariantId = Number(sourceVariantId);
  const productSegment = Number.isFinite(normalizedProductId) && normalizedProductId > 0 ? normalizedProductId : "P";
  const variantSegment = Number.isFinite(normalizedSourceVariantId) && normalizedSourceVariantId > 0 ? normalizedSourceVariantId : "V";
  let candidate = `${normalizedBase}-${productSegment}-${variantSegment}`;
  let suffix = 2;

  while (usedSkus.has(candidate)) {
    candidate = `${normalizedBase}-${productSegment}-${variantSegment}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function buildUniqueSku(candidateSku, usedSkus) {
  const normalizedBase = normalizeSkuSegment(candidateSku) || "SKU";
  let candidate = normalizedBase;
  let suffix = 2;

  while (usedSkus.has(candidate)) {
    candidate = `${normalizedBase}-${suffix}`;
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
    weightGram: String(variant?.weightGram ?? 200),
    packageLengthCm: String(variant?.packageLengthCm ?? 10),
    packageWidthCm: String(variant?.packageWidthCm ?? 10),
    packageHeightCm: String(variant?.packageHeightCm ?? 10),
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
  const { popupAlert, popupConfirm, popupForm, popupElement } = usePopupDialog();

  const [form, setForm] = useState(DEFAULT_PRODUCT_FORM);
  const [currentVariantPickerForm, setCurrentVariantPickerForm] = useState(DEFAULT_CREATE_VARIANT_PICKER_FORM);
  const [createImageForm, setCreateImageForm] = useState(DEFAULT_CREATE_IMAGE_FORM);
  const [draftVariants, setDraftVariants] = useState([]);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productSummaries, setProductSummaries] = useState({});
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);
  const [isDetailMởdalOpen, setIsDetailMởdalOpen] = useState(false);
  const [isVariantMởdalOpen, setIsVariantMởdalOpen] = useState(false);
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);
  const [variantForm, setVariantForm] = useState(DEFAULT_VARIANT_FORM);
  const [isEditMởdalOpen, setIsEditMởdalOpen] = useState(false);
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

    let isMởunted = true;
    setIsLoadingSummaries(true);

    void Promise.all(
      admin.products.items.map(async (product) => {
        try {
          const detail = await getProductById(product.productId, auth.accessToken);
          const variants = detail?.variants ?? [];
          const colorEntries = variants
            .map((variant) => resolveVariantColorLabel(variant))
            .filter(Boolean);
          const colors = Array.from(new Set(colorEntries));
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
      if (!isMởunted) {
        return;
      }

      setProductSummaries(Object.fromEntries(entries));
      setIsLoadingSummaries(false);
    });

    return () => {
      isMởunted = false;
    };
  }, [admin.products.items, auth.accessToken]);

  const availableDbVariants = useMemo(() => {
    const seenVariantIds = new Set();

    return admin.products.items
      .flatMap((product) => {
        const productId = Number(product?.productId ?? 0);
        const productName = String(product?.productName ?? "").trim() || `Sản phẩm #${productId || "-"}`;
        const variants = Array.isArray(product?.variants) ? product.variants : [];

        return variants
          .map((variant) => {
            const variantId = Number(variant?.variantId ?? 0);

            if (!Number.isFinite(variantId) || variantId <= 0 || seenVariantIds.has(variantId)) {
              return null;
            }

            seenVariantIds.add(variantId);

            return {
              variantId,
              sourceProductId: productId,
              sourceProductName: productName,
              sourceSku: String(variant?.sku ?? "").trim() || "-",
              colorName: resolveVariantColorLabel(variant),
              quantity: Number(variant?.quantity ?? 0),
              size: String(variant?.size ?? "").trim(),
              frameType: String(variant?.frameType ?? "").trim(),
              price: Number(variant?.price ?? 0),
              weightGram: Number(variant?.weightGram ?? 200),
              packageLengthCm: Number(variant?.packageLengthCm ?? 10),
              packageWidthCm: Number(variant?.packageWidthCm ?? 10),
              packageHeightCm: Number(variant?.packageHeightCm ?? 10),
            };
          })
          .filter(Boolean);
      })
      .sort((left, right) => {
        if (left.sourceProductName !== right.sourceProductName) {
          return left.sourceProductName.localeCompare(right.sourceProductName, "vi");
        }

        return left.variantId - right.variantId;
      });
  }, [admin.products.items]);

  function resetCreateProductBuilder() {
    revokeDraftPreviews([createImageForm]);
    setForm(DEFAULT_PRODUCT_FORM);
    setCurrentVariantPickerForm(DEFAULT_CREATE_VARIANT_PICKER_FORM);
    setCreateImageForm(DEFAULT_CREATE_IMAGE_FORM);
    setDraftVariants([]);
  }

  function resetEditMởdalState() {
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

  function setCurrentVariantPickerField(field, value) {
    setCurrentVariantPickerForm((current) => ({ ...current, [field]: value }));
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

  function attachCreateProductImages(fileList) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) {
      return;
    }

    const previews = files.map((file) => URL.createObjectURL(file));

    setCreateImageForm((current) => ({
      ...current,
      imageFiles: [...current.imageFiles, ...files],
      imagePreviews: [...current.imagePreviews, ...previews],
    }));
  }

  function removeCreateProductImage(index) {
    setCreateImageForm((current) => {
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
    if (!form.sku.trim()) {
      await popupAlert("Vui lòng nhập SKU gốc trong phần thông tin cơ bản.");
      return;
    }

    const selectedVariantId = Number(currentVariantPickerForm.selectedVariantId);
    if (!Number.isFinite(selectedVariantId) || selectedVariantId <= 0) {
      await popupAlert("Vui lòng chọn variant có sẵn trong DB.");
      return;
    }

    const selectedVariant = availableDbVariants.find((variant) => variant.variantId === selectedVariantId);
    if (!selectedVariant) {
      await popupAlert("Variant đã chọn không tồn tại hoặc chưa tải xong.");
      return;
    }

    if (draftVariants.some((variant) => variant.sourceVariantId === selectedVariant.variantId)) {
      await popupAlert("Variant này đã được thêm.");
      return;
    }

    setDraftVariants((current) => [
      ...current,
      {
        sourceVariantId: selectedVariant.variantId,
        sourceProductId: selectedVariant.sourceProductId,
        sourceProductName: selectedVariant.sourceProductName,
        sourceSku: selectedVariant.sourceSku,
        colorName: selectedVariant.colorName,
        quantity: selectedVariant.quantity,
        size: selectedVariant.size,
        frameType: selectedVariant.frameType,
        price: selectedVariant.price,
        weightGram: selectedVariant.weightGram,
        packageLengthCm: selectedVariant.packageLengthCm,
        packageWidthCm: selectedVariant.packageWidthCm,
        packageHeightCm: selectedVariant.packageHeightCm,
      },
    ]);

    setCurrentVariantPickerForm(DEFAULT_CREATE_VARIANT_PICKER_FORM);
  }

  async function addManualDraftVariant() {
    const formValues = await popupForm({
      title: "Tạo variant mới",
      message: "Nhập thông tin variant để thêm vào danh sách tạo sản phẩm.",
      okText: "Thêm variant",
      fields: [
        {
          name: "sku",
          label: "SKU",
          type: "text",
          required: true,
          placeholder: "VD: GK-MOI-DEN-53",
        },
        {
          name: "price",
          label: "Giá",
          type: "number",
          min: 0,
          required: true,
          validate: (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed) || parsed < 0) {
              return "Giá phải từ 0 trở lên.";
            }
            return "";
          },
        },
        {
          name: "quantity",
          label: "Số lượng tồn kho ban đầu",
          type: "number",
          min: 0,
          required: true,
          validate: (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed) || parsed < 0) {
              return "Số lượng tồn kho phải từ 0 trở lên.";
            }
            return "";
          },
        },
        {
          name: "color",
          label: "Màu sắc",
          type: "text",
          required: false,
          placeholder: "VD: Đen",
        },
        {
          name: "size",
          label: "Kích thước",
          type: "text",
          required: false,
          placeholder: "VD: 52-18-145",
        },
        {
          name: "frameType",
          label: "Kiểu gọng",
          type: "text",
          required: false,
          placeholder: "VD: Vuông",
        },
        {
          name: "weightGram",
          label: "Khối lượng (gram)",
          type: "number",
          min: 1,
          required: true,
          validate: (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed) || parsed <= 0) {
              return "Khối lượng phải lớn hơn 0.";
            }
            return "";
          },
        },
        {
          name: "packageLengthCm",
          label: "Dài gói hàng (cm)",
          type: "number",
          min: 1,
          required: true,
          validate: (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed) || parsed <= 0) {
              return "Chiều dài gói hàng phải lớn hơn 0.";
            }
            return "";
          },
        },
        {
          name: "packageWidthCm",
          label: "Rộng gói hàng (cm)",
          type: "number",
          min: 1,
          required: true,
          validate: (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed) || parsed <= 0) {
              return "Chiều rộng gói hàng phải lớn hơn 0.";
            }
            return "";
          },
        },
        {
          name: "packageHeightCm",
          label: "Cao gói hàng (cm)",
          type: "number",
          min: 1,
          required: true,
          validate: (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed) || parsed <= 0) {
              return "Chiều cao gói hàng phải lớn hơn 0.";
            }
            return "";
          },
        },
      ],
      initialValues: {
        sku: "",
        price: String(form.basePrice || 0),
        quantity: "1",
        color: "",
        size: "",
        frameType: "",
        weightGram: "200",
        packageLengthCm: "10",
        packageWidthCm: "10",
        packageHeightCm: "10",
      },
    });

    if (!formValues) {
      return;
    }

    const manualSku = String(formValues.sku || "").trim();
    if (!manualSku) {
      await popupAlert("SKU variant không được để trống.");
      return;
    }

    const normalizedManualSku = normalizeSkuSegment(manualSku);
    if (!normalizedManualSku) {
      await popupAlert("SKU variant không hợp lệ.");
      return;
    }

    if (draftVariants.some((item) => normalizeSkuSegment(item.sourceSku) === normalizedManualSku)) {
      await popupAlert("SKU variant này đã tồn tại trong danh sách tạo sản phẩm.");
      return;
    }

    setDraftVariants((current) => {
      return [
        ...current,
        {
          sourceVariantId: -Date.now(),
          sourceProductId: null,
          sourceProductName: "Variant mới",
          sourceSku: manualSku,
          colorName: String(formValues.color || "").trim(),
          quantity: Number(formValues.quantity || 0),
          size: String(formValues.size || "").trim(),
          frameType: String(formValues.frameType || "").trim(),
          price: Number(formValues.price || 0),
          weightGram: parsePositiveInteger(formValues.weightGram, 200),
          packageLengthCm: parsePositiveInteger(formValues.packageLengthCm, 10),
          packageWidthCm: parsePositiveInteger(formValues.packageWidthCm, 10),
          packageHeightCm: parsePositiveInteger(formValues.packageHeightCm, 10),
          isCustom: true,
        },
      ];
    });
  }

  function removeDraftVariant(index) {
    setDraftVariants((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function createProduct(event) {
    event.preventDefault();

    if (!form.categoryId) {
      await popupAlert("Vui lòng chọn danh mục.");
      return null;
    }

    if (!form.sku.trim()) {
      await popupAlert("Vui lòng nhập SKU gốc.");
      return null;
    }

    if (draftVariants.length === 0) {
      await popupAlert("Vui lòng thêm ít nhất 1 variant có sẵn trong DB.");
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
        throw new Error("Không nhận được productId sau khi tạo sản phẩm.");
      }

      const usedSkus = new Set();

      for (const draft of draftVariants) {
        const generatedSku = draft.isCustom
          ? buildUniqueSku(draft.sourceSku, usedSkus)
          : buildGeneratedVariantSku(form.sku, productId, draft.sourceVariantId, usedSkus);
        usedSkus.add(generatedSku);

        await dispatch(
          createAdminVariant({
            productId,
            payload: {
              sku: generatedSku,
              price: Number(draft.price || form.basePrice || 0),
              quantity: draft.quantity,
              color: draft.colorName || null,
              size: draft.size || null,
              frameType: draft.frameType || null,
              weightGram: parsePositiveInteger(draft.weightGram, 200),
              packageLengthCm: parsePositiveInteger(draft.packageLengthCm, 10),
              packageWidthCm: parsePositiveInteger(draft.packageWidthCm, 10),
              packageHeightCm: parsePositiveInteger(draft.packageHeightCm, 10),
              isPreOrderAllowed: false,
              expectedRestockDate: null,
              preOrderNote: null,
            },
          }),
        ).unwrap();
      }

      const imageFiles = createImageForm.imageFiles;
      if (imageFiles.length > 0) {
        await dispatch(uploadAdminProductImages({ productId, files: imageFiles })).unwrap();
      }

      await dispatch(fetchAdminProducts()).unwrap();
      resetCreateProductBuilder();
      await popupAlert("Tạo sản phẩm thành công.");
      return { productId };
    } catch (error) {
      await popupAlert(error || "Không tạo được sản phẩm.");
      return null;
    } finally {
      setIsCreatingProduct(false);
    }
  }

  function openVariantMởdal(product) {
    setVariantForm({
      productId: product.productId,
      productName: product.productName,
      sku: `SKU-${product.productId}-${Date.now()}`,
      price: String(product.basePrice ?? ""),
      quantity: "1",
      color: "",
      size: "",
      frameType: "",
      weightGram: "200",
      packageLengthCm: "10",
      packageWidthCm: "10",
      packageHeightCm: "10",
    });
    setIsVariantMởdalOpen(true);
  }

  function closeVariantMởdal() {
    if (isCreatingVariant) {
      return;
    }

    setIsVariantMởdalOpen(false);
    setVariantForm(DEFAULT_VARIANT_FORM);
  }

  async function openEditMởdal(product) {
    setIsLoadingEditProduct(true);

    try {
      const detail = await loadProductForEditing(product.productId, true);
      setIsDetailMởdalOpen(false);
      setEditForm(buildEditProductForm(detail));
      setIsEditMởdalOpen(true);
    } catch (error) {
      await popupAlert(error || "Không tải được thông tin sản phẩm để chỉnh sửa.");
    } finally {
      setIsLoadingEditProduct(false);
    }
  }

  function closeEditMởdal() {
    if (isUpdatingProduct) {
      return;
    }

    const nextDetailOpen = isDetailMởdalOpen;
    setIsEditMởdalOpen(false);
    resetEditMởdalState();
    clearCurrentProductIfUnused(nextDetailOpen, false);
  }

  async function submitEditProduct(event) {
    event.preventDefault();

    if (!editForm.productId) {
      await popupAlert("Không xác định được sản phẩm cần cập nhật.");
      return false;
    }

    if (!editForm.categoryId) {
      await popupAlert("Vui lòng chọn danh mục.");
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
      await popupAlert("Cập nhật sản phẩm thành công.");
      const nextDetailOpen = isDetailMởdalOpen;
      setIsEditMởdalOpen(false);
      resetEditMởdalState();
      clearCurrentProductIfUnused(nextDetailOpen, false);
      return true;
    } catch (error) {
      await popupAlert(error || "Không cập nhật được sản phẩm.");
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
    const weightGram = parsePositiveInteger(variant.weightGram, 0);
    const packageLengthCm = parsePositiveInteger(variant.packageLengthCm, 0);
    const packageWidthCm = parsePositiveInteger(variant.packageWidthCm, 0);
    const packageHeightCm = parsePositiveInteger(variant.packageHeightCm, 0);

    if (!normalizedSku) {
      await popupAlert("SKU variant không được để trống.");
      return;
    }

    if (Number.isNaN(price) || price < 0 || Number.isNaN(quantity) || quantity < 0) {
      await popupAlert("Giá hoặc số lượng variant không hợp lệ.");
      return;
    }

    if (weightGram <= 0 || packageLengthCm <= 0 || packageWidthCm <= 0 || packageHeightCm <= 0) {
      await popupAlert("Khối lượng và kích thước đóng gói phải lớn hơn 0.");
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
            weightGram,
            packageLengthCm,
            packageWidthCm,
            packageHeightCm,
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

      await popupAlert("Cập nhật variant thành công.");
    } catch (error) {
      await popupAlert(error || "Không cập nhật được variant.");
    } finally {
      setSavingVariantIds((current) => current.filter((item) => item !== variantId));
    }
  }

  async function deleteEditVariant(variantId) {
    const isConfirmed = await popupConfirm("Bạn có chắc muốn xóa variant này?", {
      title: "Xóa variant",
      okText: "Xóa",
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

      await popupAlert("Đã xóa variant.");
    } catch (error) {
      await popupAlert(error || "Không xóa được variant.");
    } finally {
      setDeletingVariantIds((current) => current.filter((item) => item !== variantId));
    }
  }

  async function submitVariant(event) {
    event.preventDefault();

    const normalizedSku = variantForm.sku.trim();
    const price = Number(variantForm.price);
    const quantity = Number(variantForm.quantity);
    const weightGram = parsePositiveInteger(variantForm.weightGram, 0);
    const packageLengthCm = parsePositiveInteger(variantForm.packageLengthCm, 0);
    const packageWidthCm = parsePositiveInteger(variantForm.packageWidthCm, 0);
    const packageHeightCm = parsePositiveInteger(variantForm.packageHeightCm, 0);

    if (!variantForm.productId) {
      await popupAlert("Không xác định được sản phẩm để tạo variant.");
      return;
    }

    if (!normalizedSku) {
      await popupAlert("SKU không được để trống.");
      return;
    }

    if (Number.isNaN(price) || price < 0 || Number.isNaN(quantity) || quantity < 0) {
      await popupAlert("Giá hoặc số lượng không hợp lệ.");
      return;
    }

    if (weightGram <= 0 || packageLengthCm <= 0 || packageWidthCm <= 0 || packageHeightCm <= 0) {
      await popupAlert("Khối lượng và kích thước đóng gói phải lớn hơn 0.");
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
            weightGram,
            packageLengthCm,
            packageWidthCm,
            packageHeightCm,
            isPreOrderAllowed: false,
            expectedRestockDate: null,
            preOrderNote: null,
          },
        }),
      ).unwrap();

      await popupAlert("Tạo variant thành công.");
      setIsVariantMởdalOpen(false);
      setVariantForm(DEFAULT_VARIANT_FORM);
      await dispatch(fetchAdminProducts()).unwrap();

      if (admin.currentProduct.data?.productId === variantForm.productId || editForm.productId === variantForm.productId) {
        await loadProductForEditing(variantForm.productId, isEditMởdalOpen);
      }
    } catch (error) {
      await popupAlert(error || "Không tạo được variant.");
    } finally {
      setIsCreatingVariant(false);
    }
  }

  async function viewDetail(product) {
    try {
      await dispatch(fetchAdminProductDetail(product.productId)).unwrap();
      setIsDetailMởdalOpen(true);
    } catch (error) {
      await popupAlert(error || "Không tải được chi tiết sản phẩm.");
    }
  }

  function closeDetail() {
    const nextEditOpen = isEditMởdalOpen;
    setIsDetailMởdalOpen(false);
    clearCurrentProductIfUnused(false, nextEditOpen);
  }

  async function toggleProductStatus(product) {
    if (!product.isActive && !product.isAvailable) {
      await popupAlert("Sản phẩm chưa có tồn kho. Vào Quản Lý Kho để nhập số lượng trước khi mở bán.");
      navigate("/admin/inventory");
      return;
    }

    try {
      await dispatch(toggleAdminProductStatus(product)).unwrap();
      await popupAlert(
        product.isActive
          ? "Đã ngừng bán sản phẩm và đưa tồn kho về 0."
          : "Đã mở bán lại sản phẩm.",
      );
      await dispatch(fetchAdminProducts()).unwrap();

      if (admin.currentProduct.data?.productId === product.productId || editForm.productId === product.productId) {
        await loadProductForEditing(product.productId, isEditMởdalOpen);
      }
    } catch (error) {
      const errorMessage = String(error || "");

      if (errorMessage.includes("variant trong kho")) {
        await popupAlert("Sản phẩm chưa có variant trong kho.");
        navigate("/admin/inventory");
        return;
      }

      if (errorMessage.includes("tồn kho")) {
        await popupAlert("Sản phẩm chưa có tồn kho. Vào Quản Lý Kho để nhập số lượng trước khi mở bán.");
        navigate("/admin/inventory");
        return;
      }

      await popupAlert(error || "Không đổi được trạng thái sản phẩm.");
    }
  }

  async function deleteProduct(product) {
    const isConfirmed = await popupConfirm(`Bạn có chắc muốn xóa sản phẩm ${product.productName}?`, {
      title: "Xóa sản phẩm",
      okText: "Xóa",
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await dispatch(removeAdminProduct(product.productId)).unwrap();

      if (admin.currentProduct.data?.productId === product.productId || editForm.productId === product.productId) {
        setIsEditMởdalOpen(false);
        setIsDetailMởdalOpen(false);
        resetEditMởdalState();
        dispatch(clearAdminCurrentProduct());
      }

      await dispatch(fetchAdminProducts()).unwrap();
    } catch (error) {
      await popupAlert(error || "Không xóa được sản phẩm.");
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
      await loadProductForEditing(productId, isEditMởdalOpen);
    } catch (error) {
      await popupAlert(error || "Không upload được ảnh sản phẩm.");
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
      await loadProductForEditing(productId, isEditMởdalOpen);
    } catch (error) {
      await popupAlert(error || "Không cập nhật được ảnh chính.");
    }
  }

  async function deleteImage(image) {
    const productId = admin.currentProduct.data?.productId ?? editForm.productId;

    if (!productId) {
      return;
    }

    try {
      await dispatch(removeAdminProductImage({ productId, imageId: image.imageId })).unwrap();
      await loadProductForEditing(productId, isEditMởdalOpen);
    } catch (error) {
      await popupAlert(error || "Không xóa được ảnh.");
    }
  }

  return {
    products: admin.products.items,
    categories: admin.products.categories,
    productDetail: admin.currentProduct.data,
    form,
    editForm,
    editVariants,
    currentVariantPickerForm,
    createImageForm,
    draftVariants,
    availableDbVariants,
    productSummaries,
    variantForm,
    ui: {
      error: admin.products.error ?? (!auth.accessToken && auth.isReady ? "Không có access token." : null),
      isLoading: admin.products.status === "loading",
      isLoadingSummaries,
      detailLoading: admin.currentProduct.status === "loading",
      isDetailMởdalOpen,
      isCreatingProduct,
      isEditMởdalOpen,
      isLoadingEditProduct,
      isUpdatingProduct,
      isVariantMởdalOpen,
      isCreatingVariant,
      savingVariantIds,
      deletingVariantIds,
    },
    actions: {
      setFormField: (field, value) => setForm((current) => ({ ...current, [field]: value })),
      setEditFormField: (field, value) => setEditForm((current) => ({ ...current, [field]: value })),
      setEditVariantField,
      setCurrentVariantPickerField,
      attachCreateProductImages,
      removeCreateProductImage,
      addDraftVariant,
      addManualDraftVariant,
      removeDraftVariant,
      resetCreateProductBuilder,
      setVariantField: (field, value) => setVariantForm((current) => ({ ...current, [field]: value })),
      retry: () => dispatch(fetchAdminProducts()),
      createProduct,
      openEditMởdal,
      closeEditMởdal,
      submitEditProduct,
      saveEditVariant,
      deleteEditVariant,
      openVariantMởdal,
      closeVariantMởdal,
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
