const CART_VIEW_CACHE_KEY = "cart_view_cache";

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

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
