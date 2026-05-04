const CART_VIEW_CACHE_KEY = "cart_view_cache";
const PENDING_PAYOS_CART_KEY = "pending_payos_cart";
const PENDING_PAYOS_CART_MAX_AGE_MS = 60 * 60 * 1000;

export function loadStoredCartViewCache() {
  if (!canUseLocalStorage()) {
    return {};
  }

  try {
    const rawValue = localStorage.getItem(CART_VIEW_CACHE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return isPlainObject(parsedValue) ? parsedValue : {};
  } catch {
    return {};
  }
}

export function persistStoredCartViewCache(viewCache) {
  if (!canUseLocalStorage()) {
    return;
  }

  if (!isPlainObject(viewCache) || Object.keys(viewCache).length === 0) {
    localStorage.removeItem(CART_VIEW_CACHE_KEY);
    return;
  }

  localStorage.setItem(CART_VIEW_CACHE_KEY, JSON.stringify(viewCache));
}

export function persistPendingPayOsCart(items) {
  if (!canUseLocalStorage()) {
    return;
  }

  const normalizedItems = (Array.isArray(items) ? items : [])
    .map(createRecoverableCartItem)
    .filter(Boolean);

  if (normalizedItems.length === 0) {
    localStorage.removeItem(PENDING_PAYOS_CART_KEY);
    return;
  }

  localStorage.setItem(
    PENDING_PAYOS_CART_KEY,
    JSON.stringify({
      createdAt: Date.now(),
      items: normalizedItems,
    }),
  );
}

export function loadPendingPayOsCart() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawValue = localStorage.getItem(PENDING_PAYOS_CART_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!isPlainObject(parsedValue) || !Array.isArray(parsedValue.items)) {
      return null;
    }

    if (Date.now() - Number(parsedValue.createdAt ?? 0) > PENDING_PAYOS_CART_MAX_AGE_MS) {
      localStorage.removeItem(PENDING_PAYOS_CART_KEY);
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

export function clearPendingPayOsCart() {
  if (!canUseLocalStorage()) {
    return;
  }

  localStorage.removeItem(PENDING_PAYOS_CART_KEY);
}

function createRecoverableCartItem(item) {
  const variantId = Number(item?.variantId ?? 0);
  const quantity = Math.max(1, Number(item?.quantity ?? 1));

  if (!Number.isFinite(variantId) || variantId <= 0) {
    return null;
  }

  const view = {
    variantId,
    productId: Number(item?.product?.productId ?? item?.product?.id ?? 0) || null,
    name: item?.name ?? item?.product?.name ?? "Sản phẩm",
    image: item?.image ?? item?.product?.image ?? item?.product?.images?.[0] ?? null,
    selectedColor: item?.selectedColor ?? item?.color ?? null,
    size: item?.size ?? null,
    sku: item?.sku ?? null,
  };

  if (item?.hasPrescription || item?.itemType === "prescriptionConfigured") {
    return {
      itemType: "prescriptionConfigured",
      variantId,
      quantity,
      lensTypeId: Number(item?.prescriptionDetails?.lensTypeId ?? 0),
      rightEye: item?.prescriptionDetails?.rightEye ?? null,
      leftEye: item?.prescriptionDetails?.leftEye ?? null,
      pd: item?.prescriptionDetails?.pd ?? null,
      notes: item?.prescriptionDetails?.notes ?? "",
      prescriptionImageUrl: item?.prescriptionDetails?.prescriptionImageUrl ?? "",
      view,
    };
  }

  return {
    itemType: "standard",
    variantId,
    quantity,
    orderType: item?.orderType ?? "ready",
    view,
  };
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
