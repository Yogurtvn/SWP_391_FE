import { API_BASE_URL, apiGet } from "@/services/apiClient";

const PRODUCTS_BASE_PATH = "/api/products";
const CATEGORIES_BASE_PATH = "/api/categories";
const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=800&auto=format&fit=crop";

export async function getCatalogProducts(filters = {}) {
  const queryString = createQueryString(filters);
  const response = await apiGet(queryString ? `${PRODUCTS_BASE_PATH}?${queryString}` : PRODUCTS_BASE_PATH);

  return {
    items: Array.isArray(response?.items) ? response.items.map(normalizeCatalogListItem) : [],
    page: response?.page ?? 1,
    pageSize: response?.pageSize ?? 12,
    totalItems: response?.totalItems ?? 0,
    totalPages: response?.totalPages ?? 0,
    hasPreviousPage: Boolean(response?.hasPreviousPage),
    hasNextPage: Boolean(response?.hasNextPage),
  };
}

export async function getCatalogCategories() {
  const response = await apiGet(
    `${CATEGORIES_BASE_PATH}?page=1&pageSize=100&sortBy=categoryName&sortOrder=asc`,
  );

  return Array.isArray(response?.items) ? response.items.map(normalizeCategory) : [];
}

export async function getCatalogProductById(productId) {
  const response = await apiGet(`${PRODUCTS_BASE_PATH}/${productId}`);
  return normalizeCatalogDetail(response);
}

export async function getRecommendedCatalogProducts({ productType, excludeProductId, pageSize = 4 }) {
  const response = await getCatalogProducts({
    page: 1,
    pageSize: pageSize + 1,
    productType,
    sortBy: "newest",
    sortOrder: "desc",
  });

  return response.items
    .filter((item) => item.productId !== excludeProductId)
    .slice(0, pageSize);
}

export function getCatalogErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

export function getCatalogRouteConfig(categorySlug) {
  const normalizedSlug = String(categorySlug ?? "").trim().toLowerCase();

  switch (normalizedSlug) {
    case "":
      return {
        title: "Tat Ca San Pham",
      };
    case "eyeglasses":
      return {
        title: "Kinh Can",
        productType: "frame",
        prescriptionCompatible: true,
      };
    case "sunglasses":
      return {
        title: "Kinh Ram",
        productType: "sunglasses",
      };
    case "ai-glasses":
      return {
        title: "Gong Kinh",
        productType: "frame",
      };
    case "lenses":
      return {
        title: "Trong Kinh",
        productType: "lens",
      };
    case "premium":
      return {
        title: "Thuong Hieu Cao Cap",
        notice: "API hiện tại chưa có filter premium, đang hiển thị toàn bộ sản phẩm.",
      };
    default:
      return {
        title: toTitleCase(normalizedSlug.replace(/-/g, " ")),
        notice: "Danh mục này chưa có map filter riêng, đang hiển thị toàn bộ sản phẩm.",
      };
  }
}

export function getCatalogSortOptions() {
  return [
    { value: "newest", label: "Moi nhat" },
    { value: "price-asc", label: "Gia thap den cao" },
    { value: "price-desc", label: "Gia cao den thap" },
  ];
}

function normalizeCatalogListItem(item) {
  const productType = normalizeProductType(item?.productType);
  const price = normalizePrice(item?.basePrice);
  const image = resolveAssetUrl(item?.thumbnailUrl) ?? DEFAULT_IMAGE_URL;
  const variants = Array.isArray(item?.variants) ? item.variants.map(normalizeVariant) : [];
  const isReadyAvailable = variants.length > 0
    ? variants.some((variant) => variant.isReadyAvailable)
    : Boolean(item?.isReadyAvailable ?? item?.isAvailable);
  const canPreOrder = variants.length > 0
    ? variants.some((variant) => variant.isPreOrderAllowed)
    : Boolean(item?.isPreOrderAllowed);
  const availabilityStatus = resolveAvailabilityStatus(isReadyAvailable, canPreOrder);

  return {
    id: String(item?.productId ?? ""),
    productId: item?.productId ?? 0,
    name: item?.productName?.trim() || "Sản phẩm",
    price,
    image,
    subtitle: getProductTypeLabel(productType),
    colors: [],
    inStock: availabilityStatus === "available",
    isReadyAvailable,
    isPreOrderAllowed: canPreOrder,
    canPreOrder,
    availabilityStatus,
    variants,
    productType,
    productTypeLabel: getProductTypeLabel(productType),
    product: createCartProduct({
      id: item?.productId,
      name: item?.productName,
      price,
      image,
      productType,
      inStock: availabilityStatus === "available",
      allowPreOrder: canPreOrder,
      variants,
    }),
  };
}

function normalizeCatalogDetail(item) {
  const productType = normalizeProductType(item?.productType);
  const images = Array.isArray(item?.images)
    ? item.images
        .map((image) => resolveAssetUrl(image?.imageUrl))
        .filter(Boolean)
    : [];
  const variants = Array.isArray(item?.variants) ? item.variants.map(normalizeVariant) : [];
  const firstAvailableVariant = variants.find((variant) => variant.isReadyAvailable);
  const firstPreOrderVariant = variants.find((variant) => !variant.isReadyAvailable && variant.isPreOrderAllowed);
  const activeVariant = firstAvailableVariant ?? firstPreOrderVariant ?? variants[0] ?? null;
  const availabilityStatus = resolveDetailAvailabilityStatus(variants);
  const canPreOrder = variants.some((variant) => variant.isPreOrderAllowed);
  const baseImage = images[0] ?? DEFAULT_IMAGE_URL;
  const displayPrice = activeVariant?.price ?? normalizePrice(item?.basePrice);

  return {
    id: String(item?.productId ?? ""),
    productId: item?.productId ?? 0,
    name: item?.productName?.trim() || "Sản phẩm",
    description: item?.description?.trim() || "Sản phẩm hien chua co mo ta.",
    price: displayPrice,
    basePrice: normalizePrice(item?.basePrice),
    images: images.length > 0 ? images : [DEFAULT_IMAGE_URL],
    image: baseImage,
    productType,
    productTypeLabel: getProductTypeLabel(productType),
    prescriptionCompatible: Boolean(item?.prescriptionCompatible),
    variants,
    sizes: getDistinctValues(variants.map((variant) => variant.size)),
    colors: getDistinctValues(variants.map((variant) => variant.color)),
    frameTypes: getDistinctValues(variants.map((variant) => variant.frameType)),
    selectedVariant: activeVariant,
    availabilityStatus,
    inStock: availabilityStatus === "available",
    isReadyAvailable: Boolean(activeVariant?.isReadyAvailable),
    isPreOrderAllowed: Boolean(activeVariant?.isPreOrderAllowed),
    canPreOrder,
    product: createCartProduct({
      id: item?.productId,
      name: item?.productName,
      price: displayPrice,
      image: baseImage,
      productType,
      inStock: availabilityStatus === "available",
      allowPreOrder: canPreOrder,
      prescriptionCompatible: Boolean(item?.prescriptionCompatible),
      images: images.length > 0 ? images : [DEFAULT_IMAGE_URL],
      variants,
    }),
  };
}

function normalizeVariant(variant) {
  return {
    variantId: variant?.variantId ?? 0,
    sku: variant?.sku?.trim() || "",
    color: normalizeText(variant?.color),
    size: normalizeText(variant?.size),
    frameType: normalizeText(variant?.frameType),
    price: normalizePrice(variant?.price),
    quantity: Number(variant?.quantity ?? 0),
    isReadyAvailable: Boolean(variant?.isReadyAvailable ?? Number(variant?.quantity ?? 0) > 0),
    isPreOrderAllowed: Boolean(variant?.isPreOrderAllowed),
    expectedRestockDate: variant?.expectedRestockDate ?? null,
    preOrderNote: normalizeText(variant?.preOrderNote),
  };
}

function normalizeCategory(category) {
  return {
    id: category?.categoryId ?? 0,
    name: category?.categoryName?.trim() || "Danh muc",
  };
}

function createCartProduct({
  id,
  name,
  price,
  image,
  productType,
  inStock,
  allowPreOrder,
  prescriptionCompatible = false,
  images,
  variants,
}) {
  return {
    id: String(id ?? ""),
    productId: id ?? 0,
    name: name?.trim() || "Sản phẩm",
    price: normalizePrice(price),
    image: image ?? DEFAULT_IMAGE_URL,
    images: Array.isArray(images) && images.length > 0 ? images : [image ?? DEFAULT_IMAGE_URL],
    type: productType,
    inStock: Boolean(inStock),
    allowPreOrder: Boolean(allowPreOrder),
    prescriptionCompatible,
    variants: Array.isArray(variants) ? variants : [],
  };
}

function createQueryString(filters) {
  const params = new URLSearchParams();

  appendQueryValue(params, "page", filters.page);
  appendQueryValue(params, "pageSize", filters.pageSize);
  appendQueryValue(params, "search", filters.search);
  appendQueryValue(params, "categoryId", filters.categoryId);
  appendQueryValue(params, "productType", filters.productType);
  appendQueryValue(params, "minPrice", filters.minPrice);
  appendQueryValue(params, "maxPrice", filters.maxPrice);
  appendQueryValue(params, "color", filters.color);
  appendQueryValue(params, "size", filters.size);
  appendQueryValue(params, "frameType", filters.frameType);
  appendQueryValue(params, "prescriptionCompatible", filters.prescriptionCompatible);
  appendQueryValue(params, "sortBy", filters.sortBy);
  appendQueryValue(params, "sortOrder", filters.sortOrder);

  return params.toString();
}

function appendQueryValue(params, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  params.set(key, String(value));
}

function resolveAssetUrl(url) {
  if (typeof url !== "string" || url.trim().length === 0) {
    return null;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

function resolveAvailabilityStatus(isAvailable, isPreOrderAllowed) {
  if (isAvailable) {
    return "available";
  }

  if (isPreOrderAllowed) {
    return "preorder";
  }

  return "unavailable";
}

function resolveDetailAvailabilityStatus(variants) {
  if (variants.some((variant) => variant.isReadyAvailable)) {
    return "available";
  }

  if (variants.some((variant) => !variant.isReadyAvailable && variant.isPreOrderAllowed)) {
    return "preorder";
  }

  return "unavailable";
}

function normalizeProductType(productType) {
  return normalizeText(productType)?.toLowerCase() || "frame";
}

function getProductTypeLabel(productType) {
  switch (productType) {
    case "sunglasses":
      return "Kinh Ram";
    case "lens":
      return "Trong Kinh";
    default:
      return "Gong Kinh";
  }
}

function getDistinctValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizePrice(value) {
  const price = Number(value ?? 0);
  return Number.isFinite(price) ? price : 0;
}

function toTitleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

