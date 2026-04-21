import { apiGet, apiPost, apiRequest, ApiError } from "@/services/apiClient";

const CARTS_BASE_PATH = "/api/carts";
const VARIANTS_BASE_PATH = "/api/variants";
const PLACEHOLDER_IMAGE_URL =
  "https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=400&auto=format&fit=crop";

export async function getMyCart(token) {
  return apiGet(`${CARTS_BASE_PATH}/me`, { token });
}

export async function createStandardCartItem(token, payload) {
  return apiPost(`${CARTS_BASE_PATH}/me/items`, payload, { token });
}

export async function createPrescriptionCartItem(token, payload) {
  return apiPost(`${CARTS_BASE_PATH}/me/prescription-items`, payload, { token });
}

export async function updatePrescriptionCartItem(token, cartItemId, payload) {
  return apiRequest(`${CARTS_BASE_PATH}/me/prescription-items/${cartItemId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function updateStandardCartItem(token, cartItemId, payload) {
  return apiRequest(`${CARTS_BASE_PATH}/me/items/${cartItemId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function deleteCartItem(token, cartItemId, itemType = "standard") {
  const itemPath = itemType === "prescriptionConfigured" ? "prescription-items" : "items";

  return apiRequest(`${CARTS_BASE_PATH}/me/${itemPath}/${cartItemId}`, {
    method: "DELETE",
    token,
  });
}

export async function clearMyCart(token) {
  return apiRequest(`${CARTS_BASE_PATH}/me/items`, {
    method: "DELETE",
    token,
  });
}

export async function getVariantById(variantId) {
  return apiGet(`${VARIANTS_BASE_PATH}/${variantId}`);
}

export async function getVariantDetailsByIds(variantIds) {
  const uniqueVariantIds = Array.from(
    new Set(
      (Array.isArray(variantIds) ? variantIds : [])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

  const entries = await Promise.all(
    uniqueVariantIds.map(async (variantId) => {
      try {
        const variant = await getVariantById(variantId);
        return [variantId, normalizeVariantDetail(variant)];
      } catch {
        return [variantId, null];
      }
    }),
  );

  return Object.fromEntries(entries);
}

export function normalizeServerCart(cart, viewCache = {}, variantDetails = {}) {
  const rawItems = Array.isArray(cart?.items) ? cart.items : [];

  return {
    cartId: cart?.cartId ?? null,
    items: rawItems.map((item) =>
      normalizeCartItem(item, {
        cachedView: viewCache[String(item?.variantId ?? "")],
        variantDetail: variantDetails[item?.variantId] ?? null,
      }),
    ),
    subTotal: normalizePrice(cart?.subTotal),
  };
}

export function createCartItemView(product, variant) {
  return {
    variantId: variant?.variantId ?? 0,
    productId: product?.productId ?? parseNumericId(product?.id),
    name: product?.name?.trim() || "Sản phẩm",
    image: product?.image || product?.images?.[0] || PLACEHOLDER_IMAGE_URL,
    selectedColor: variant?.color || product?.selectedVariant?.color || null,
    size: variant?.size || product?.selectedVariant?.size || null,
    sku: variant?.sku || product?.selectedVariant?.sku || null,
    productTypeLabel: product?.productTypeLabel || null,
  };
}

export function mergeCartViewCache(currentCache, nextViews) {
  const mergedCache = isPlainObject(currentCache) ? { ...currentCache } : {};

  (Array.isArray(nextViews) ? nextViews : [nextViews]).forEach((view) => {
    if (!view || !view.variantId) {
      return;
    }

    mergedCache[String(view.variantId)] = {
      ...(mergedCache[String(view.variantId)] ?? {}),
      ...view,
    };
  });

  return mergedCache;
}

export function resolvePreferredVariant(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  return (
    variants.find((variant) => Number(variant?.quantity ?? 0) > 0) ||
    variants.find((variant) => Boolean(variant?.isPreOrderAllowed)) ||
    variants[0] ||
    null
  );
}

export function resolveCartAvailabilityStatus(variant) {
  if (Number(variant?.quantity ?? 0) > 0) {
    return "available";
  }

  if (variant?.isPreOrderAllowed) {
    return "preorder";
  }

  return "unavailable";
}

export function getCartErrorMessage(error, fallbackMessage) {
  if (error instanceof ApiError && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function normalizeCartItem(item, { cachedView, variantDetail }) {
  const normalizedView = cachedView ?? {};
  const image = normalizedView.image || PLACEHOLDER_IMAGE_URL;
  const name = normalizeText(item?.productName) ?? normalizedView.name ?? `Sản phẩm #${item?.variantId ?? "N/A"}`;
  const color =
    normalizeText(item?.selectedColor) ??
    normalizeText(item?.variantColor) ??
    normalizedView.selectedColor ??
    variantDetail?.color ??
    "Mặc định";
  const size = normalizeText(item?.variantSize) ?? normalizedView.size ?? variantDetail?.size ?? "";
  const sku = normalizeText(item?.sku) ?? normalizedView.sku ?? variantDetail?.sku ?? "";
  const quantity = Number(item?.quantity ?? 0);
  const stockQuantity = Number(item?.stockQuantity ?? variantDetail?.quantity ?? 0);
  const isReadyAvailable = Boolean(item?.isReadyAvailable ?? stockQuantity >= quantity);
  const isPreOrderAllowed = Boolean(item?.isPreOrderAllowed ?? variantDetail?.isPreOrderAllowed);
  const unitPrice = normalizePrice(item?.unitPrice);
  const totalPrice = normalizePrice(item?.totalPrice);
  const lensPriceTotal = normalizePrice(item?.prescription?.lensPrice);
  const lensPricePerUnit = quantity > 0 ? lensPriceTotal / quantity : lensPriceTotal;
  const orderType = resolveCartItemOrderType({
    rawOrderType: item?.orderType,
    hasPrescription: Boolean(item?.prescription),
    isReadyAvailable,
    isPreOrderAllowed,
  });

  return {
    id: `cart-${item?.cartItemId ?? item?.variantId ?? Date.now()}`,
    cartItemId: item?.cartItemId ?? 0,
    variantId: item?.variantId ?? 0,
    itemType: item?.itemType || "standard",
    orderType,
    quantity,
    stockQuantity,
    isReadyAvailable,
    isPreOrderAllowed,
    expectedRestockDate: item?.expectedRestockDate ?? variantDetail?.expectedRestockDate ?? null,
    preOrderNote: normalizeText(item?.preOrderNote) ?? variantDetail?.preOrderNote ?? null,
    availabilityStatus: resolveCartItemAvailabilityStatus({
      orderType,
      isReadyAvailable,
      isPreOrderAllowed,
    }),
    unitPrice,
    totalPrice,
    framePrice: unitPrice,
    lensPrice: lensPricePerUnit,
    name,
    image,
    color,
    selectedColor: color,
    size,
    sku,
    hasPrescription: Boolean(item?.prescription),
    prescriptionDetails: item?.prescription
      ? {
          lensTypeId: Number(item.prescription.lensTypeId ?? 0),
          lensType: item.prescription.lensName || item.prescription.lensCode || "Theo toa",
          lensCode: item.prescription.lensCode || "",
          lensName: item.prescription.lensName || "",
          lensMaterial: item.prescription.lensMaterial || "",
          coatings: Array.isArray(item.prescription.coatings) ? item.prescription.coatings : [],
          rightEye: item.prescription.rightEye ?? null,
          leftEye: item.prescription.leftEye ?? null,
          pd: item.prescription.pd ?? null,
          notes: item.prescription.notes || "",
          prescriptionImageUrl: item.prescription.prescriptionImageUrl || "",
        }
      : null,
    product: {
      id: String(item?.productId ?? normalizedView.productId ?? item?.variantId ?? ""),
      productId: item?.productId ?? normalizedView.productId ?? null,
      name,
      image,
      images: [image],
    },
  };
}

function normalizeVariantDetail(variant) {
  return {
    variantId: variant?.variantId ?? 0,
    sku: variant?.sku?.trim() || "",
    color: normalizeText(variant?.color),
    size: normalizeText(variant?.size),
    frameType: normalizeText(variant?.frameType),
    price: normalizePrice(variant?.price),
    quantity: Number(variant?.quantity ?? 0),
    isPreOrderAllowed: Boolean(variant?.isPreOrderAllowed),
    isReadyAvailable: Boolean(variant?.isReadyAvailable ?? Number(variant?.quantity ?? 0) > 0),
    expectedRestockDate: variant?.expectedRestockDate ?? null,
    preOrderNote: normalizeText(variant?.preOrderNote),
  };
}

function resolveCartItemOrderType({ rawOrderType, hasPrescription, isReadyAvailable, isPreOrderAllowed }) {
  if (hasPrescription) {
    return "prescription";
  }

  const normalizedOrderType = String(rawOrderType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (normalizedOrderType === "preorder") {
    return "preOrder";
  }

  if (normalizedOrderType === "prescription") {
    return "prescription";
  }

  if (!isReadyAvailable && isPreOrderAllowed) {
    return "preOrder";
  }

  return "ready";
}

function resolveCartItemAvailabilityStatus({ orderType, isReadyAvailable, isPreOrderAllowed }) {
  if (orderType === "preOrder" || (!isReadyAvailable && isPreOrderAllowed)) {
    return "preorder";
  }

  return isReadyAvailable ? "available" : "unavailable";
}

function normalizePrice(value) {
  const normalizedValue = Number(value ?? 0);
  return Number.isFinite(normalizedValue) ? normalizedValue : 0;
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function parseNumericId(value) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

