import { getCatalogProductById } from "@/services/catalogService";
import { ApiError, apiGet, apiPost } from "@/services/apiClient";

const ORDERS_BASE_PATH = "/api/orders";
const DEFAULT_ORDER_PAGE_SIZE = 50;
const ORDER_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=400&auto=format&fit=crop";

export async function checkoutCartOrder(token, payload) {
  return apiPost(`${ORDERS_BASE_PATH}/checkout`, payload, { token });
}

export async function getMyOrders(token, filters = {}) {
  const queryString = createOrderQueryString(filters);
  const response = await apiGet(queryString ? `${ORDERS_BASE_PATH}?${queryString}` : ORDERS_BASE_PATH, { token });
  return normalizeOrdersPage(response, token);
}

export async function getOrderById(token, orderId) {
  return apiGet(`${ORDERS_BASE_PATH}/${orderId}`, { token });
}

export function createCheckoutPayload({ cartItems, shippingInfo, paymentMethod }) {
  return {
    cartItemIds: (Array.isArray(cartItems) ? cartItems : [])
      .map((item) => Number(item?.cartItemId))
      .filter((cartItemId) => Number.isFinite(cartItemId) && cartItemId > 0),
    receiverName: normalizeText(shippingInfo?.fullName) ?? "",
    receiverPhone: normalizeText(shippingInfo?.phone) ?? "",
    shippingAddress: composeShippingAddress(shippingInfo),
    paymentMethod: normalizePaymentMethod(paymentMethod),
  };
}

export function buildOrderSummary({ checkoutResult, cartItems, shippingInfo, paymentMethod }) {
  const resolvedPaymentMethod = normalizePaymentMethod(paymentMethod);
  const itemCount = (Array.isArray(cartItems) ? cartItems : []).reduce(
    (count, item) => count + Number(item?.quantity ?? 0),
    0,
  );
  const fallbackTotal = (Array.isArray(cartItems) ? cartItems : []).reduce(
    (total, item) => total + Number(item?.totalPrice ?? 0),
    0,
  );
  const createdAt = new Date();

  return {
    orderId: Number(checkoutResult?.orderId ?? 0),
    orderCreated: Boolean(checkoutResult?.orderId),
    orderStatus: checkoutResult?.orderStatus ?? "pending",
    orderStatusLabel: getOrderStatusLabel(checkoutResult?.orderStatus ?? "pending"),
    paymentMethod: resolvedPaymentMethod,
    paymentMethodLabel: getPaymentMethodLabel(resolvedPaymentMethod),
    paymentStatus: checkoutResult?.payment?.paymentStatus ?? "pending",
    paymentStatusLabel: getPaymentStatusLabel(checkoutResult?.payment?.paymentStatus ?? "pending"),
    itemCount,
    total: Number(checkoutResult?.totalAmount ?? fallbackTotal),
    customerName: normalizeText(shippingInfo?.fullName) ?? "Khach hang Vision Direct",
    phone: normalizeText(shippingInfo?.phone) ?? "Chua cap nhat",
    email: normalizeText(shippingInfo?.email) ?? "Chua cap nhat",
    shippingAddress: composeShippingAddress(shippingInfo) || "Dia chi giao hang se duoc cap nhat sau.",
    createdAtLabel: formatDateTime(createdAt),
  };
}

export function normalizeOrderDetail(order) {
  const items = Array.isArray(order?.items)
    ? order.items.map((item) => ({
        orderItemId: Number(item?.orderItemId ?? 0),
        variantId: Number(item?.variantId ?? 0),
        productId: Number(item?.productId ?? 0),
        productName: item?.productName?.trim() || "San pham",
        sku: item?.sku?.trim() || "",
        selectedColor: normalizeText(item?.selectedColor) ?? normalizeText(item?.variantColor) ?? "Mac dinh",
        quantity: Number(item?.quantity ?? 0),
        unitPrice: Number(item?.unitPrice ?? 0),
        lineTotal: Number(item?.lineTotal ?? 0),
      }))
    : [];

  const payment = order?.payment
    ? {
        paymentId: Number(order.payment.paymentId ?? 0),
        amount: Number(order.payment.amount ?? 0),
        paymentMethod: order.payment.paymentMethod ?? "",
        paymentMethodLabel: getPaymentMethodLabel(order.payment.paymentMethod),
        paymentStatus: order.payment.paymentStatus ?? "",
        paymentStatusLabel: getPaymentStatusLabel(order.payment.paymentStatus),
        paidAt: order.payment.paidAt ?? null,
        paidAtLabel: order.payment.paidAt ? formatDateTime(order.payment.paidAt) : "Chua thanh toan",
      }
    : null;

  const statusHistory = Array.isArray(order?.statusHistory)
    ? order.statusHistory.map((history) => ({
        historyId: Number(history?.historyId ?? 0),
        orderStatus: history?.orderStatus ?? "",
        orderStatusLabel: getOrderStatusLabel(history?.orderStatus),
        updatedByUserId: Number(history?.updatedByUserId ?? 0),
        updatedByName: history?.updatedByName?.trim() || "He thong",
        note: history?.note?.trim() || "",
        updatedAt: history?.updatedAt ?? null,
        updatedAtLabel: formatDateTime(history?.updatedAt),
      }))
    : [];

  return {
    orderId: Number(order?.orderId ?? 0),
    orderType: order?.orderType ?? "",
    orderTypeLabel: getOrderTypeLabel(order?.orderType),
    orderStatus: order?.orderStatus ?? "",
    orderStatusLabel: getOrderStatusLabel(order?.orderStatus),
    totalAmount: Number(order?.totalAmount ?? 0),
    receiverName: order?.receiverName?.trim() || "Khach hang Vision Direct",
    receiverPhone: order?.receiverPhone?.trim() || "Chua cap nhat",
    shippingAddress: order?.shippingAddress?.trim() || "Chua cap nhat",
    shippingCode: order?.shippingCode?.trim() || "",
    shippingStatus: order?.shippingStatus ?? null,
    shippingStatusLabel: getShippingStatusLabel(order?.shippingStatus),
    createdAt: order?.createdAt ?? null,
    createdAtLabel: formatDateTime(order?.createdAt),
    updatedAt: order?.updatedAt ?? null,
    updatedAtLabel: formatDateTime(order?.updatedAt),
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    items,
    payment,
    statusHistory,
  };
}

export async function normalizeOrdersPage(response, token = null) {
  const rawItems = Array.isArray(response?.items) ? response.items : [];

  if (!token || rawItems.length === 0) {
    return {
      items: rawItems.map((item) => normalizeOrderSummary(item, null, null)),
      page: Number(response?.page ?? 1),
      pageSize: Number(response?.pageSize ?? DEFAULT_ORDER_PAGE_SIZE),
      totalItems: Number(response?.totalItems ?? 0),
      totalPages: Number(response?.totalPages ?? 0),
      hasPreviousPage: Boolean(response?.hasPreviousPage),
      hasNextPage: Boolean(response?.hasNextPage),
    };
  }

  const detailEntries = await Promise.all(
    rawItems.map(async (item) => {
      try {
        const detail = await getOrderById(token, item.orderId);
        return [item.orderId, normalizeOrderDetail(detail)];
      } catch {
        return [item.orderId, null];
      }
    }),
  );

  const detailMap = new Map(detailEntries);
  const productPreviewCache = new Map();

  const normalizedItems = await Promise.all(
    rawItems.map(async (item) => {
      const detail = detailMap.get(item.orderId) ?? null;
      const preview = await resolveOrderPreview(detail?.items?.[0] ?? null, productPreviewCache);
      return normalizeOrderSummary(item, detail, preview);
    }),
  );

  return {
    items: normalizedItems,
    page: Number(response?.page ?? 1),
    pageSize: Number(response?.pageSize ?? DEFAULT_ORDER_PAGE_SIZE),
    totalItems: Number(response?.totalItems ?? 0),
    totalPages: Number(response?.totalPages ?? 0),
    hasPreviousPage: Boolean(response?.hasPreviousPage),
    hasNextPage: Boolean(response?.hasNextPage),
  };
}

export function getOrderErrorMessage(error, fallbackMessage) {
  if (error instanceof ApiError && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

export function getOrderTypeLabel(orderType) {
  switch (String(orderType ?? "").trim().toLowerCase()) {
    case "ready":
      return "Don hang co san";
    case "preorder":
      return "Don dat truoc";
    case "prescription":
      return "Don kinh theo toa";
    default:
      return "Don hang";
  }
}

export function getOrderStatusLabel(orderStatus) {
  switch (String(orderStatus ?? "").trim().toLowerCase()) {
    case "pending":
      return "Cho xac nhan";
    case "confirmed":
      return "Da xac nhan";
    case "awaitingstock":
      return "Cho bo sung hang";
    case "processing":
      return "Dang xu ly";
    case "shipped":
      return "Dang giao hang";
    case "completed":
      return "Hoan tat";
    case "cancelled":
      return "Da huy";
    default:
      return "Dang cap nhat";
  }
}

export function getShippingStatusLabel(shippingStatus) {
  switch (String(shippingStatus ?? "").trim().toLowerCase()) {
    case "pending":
      return "Chuan bi giao";
    case "picking":
      return "Dang lay hang";
    case "delivering":
      return "Dang giao";
    case "delivered":
      return "Da giao";
    case "failed":
      return "Giao that bai";
    default:
      return "Chua giao hang";
  }
}

export function getDisplayOrderStatus(orderStatus, shippingStatus) {
  const normalizedOrderStatus = String(orderStatus ?? "").trim().toLowerCase();
  const normalizedShippingStatus = String(shippingStatus ?? "").trim().toLowerCase();

  if (normalizedOrderStatus === "cancelled") {
    return {
      key: "cancelled",
      label: "Da huy",
    };
  }

  if (normalizedShippingStatus === "delivered") {
    return {
      key: "delivered",
      label: "Da giao hang",
    };
  }

  if (
    normalizedShippingStatus === "picking" ||
    normalizedShippingStatus === "delivering" ||
    normalizedOrderStatus === "shipped"
  ) {
    return {
      key: "shipping",
      label: "Dang giao hang",
    };
  }

  return {
    key: "processing",
    label: getOrderStatusLabel(orderStatus),
  };
}

export function getPaymentMethodLabel(paymentMethod) {
  switch (normalizePaymentMethod(paymentMethod)) {
    case "momo":
      return "Thanh toan MoMo";
    default:
      return "Thanh toan khi nhan hang";
  }
}

export function getPaymentStatusLabel(paymentStatus) {
  switch (String(paymentStatus ?? "").trim().toLowerCase()) {
    case "completed":
      return "Da thanh toan";
    case "failed":
      return "Thanh toan that bai";
    default:
      return "Cho thanh toan";
  }
}

export function formatDateTime(value) {
  if (!value) {
    return "Chua cap nhat";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chua cap nhat";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function composeShippingAddress(shippingInfo) {
  return [
    normalizeText(shippingInfo?.address),
    normalizeText(shippingInfo?.ward),
    normalizeText(shippingInfo?.district),
    normalizeText(shippingInfo?.city),
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeOrderSummary(summary, detail, preview) {
  const displayStatus = getDisplayOrderStatus(summary?.orderStatus, summary?.shippingStatus);
  const firstItem = detail?.items?.[0] ?? null;
  const itemCount = Number(summary?.itemCount ?? detail?.itemCount ?? 0);

  return {
    orderId: Number(summary?.orderId ?? 0),
    orderType: summary?.orderType ?? "",
    orderTypeLabel: getOrderTypeLabel(summary?.orderType),
    orderStatus: summary?.orderStatus ?? "",
    orderStatusLabel: getOrderStatusLabel(summary?.orderStatus),
    shippingStatus: summary?.shippingStatus ?? null,
    shippingStatusLabel: getShippingStatusLabel(summary?.shippingStatus),
    statusKey: displayStatus.key,
    statusLabel: displayStatus.label,
    totalAmount: Number(summary?.totalAmount ?? 0),
    itemCount,
    receiverName: summary?.receiverName?.trim() || detail?.receiverName || "Khach hang Vision Direct",
    paymentMethod: summary?.paymentMethod ?? detail?.payment?.paymentMethod ?? null,
    paymentMethodLabel: getPaymentMethodLabel(summary?.paymentMethod ?? detail?.payment?.paymentMethod),
    paymentStatus: summary?.paymentStatus ?? detail?.payment?.paymentStatus ?? null,
    paymentStatusLabel: getPaymentStatusLabel(summary?.paymentStatus ?? detail?.payment?.paymentStatus),
    createdAt: summary?.createdAt ?? detail?.createdAt ?? null,
    createdAtLabel: formatDateTime(summary?.createdAt ?? detail?.createdAt),
    updatedAt: summary?.updatedAt ?? detail?.updatedAt ?? null,
    updatedAtLabel: formatDateTime(summary?.updatedAt ?? detail?.updatedAt),
    firstItemName: firstItem?.productName || `${itemCount} san pham`,
    firstItemQuantity: Number(firstItem?.quantity ?? itemCount),
    firstItemImage: preview?.image || ORDER_PLACEHOLDER_IMAGE,
    firstItemSubtitle:
      firstItem?.selectedColor || firstItem?.sku || preview?.productTypeLabel || getOrderTypeLabel(summary?.orderType),
    detail,
  };
}

async function resolveOrderPreview(firstItem, productPreviewCache) {
  const productId = Number(firstItem?.productId ?? 0);

  if (!Number.isFinite(productId) || productId <= 0) {
    return {
      image: ORDER_PLACEHOLDER_IMAGE,
      productTypeLabel: null,
    };
  }

  if (!productPreviewCache.has(productId)) {
    productPreviewCache.set(
      productId,
      getCatalogProductById(productId)
        .then((product) => ({
          image: product?.image || product?.images?.[0] || ORDER_PLACEHOLDER_IMAGE,
          productTypeLabel: product?.productTypeLabel || null,
        }))
        .catch(() => ({
          image: ORDER_PLACEHOLDER_IMAGE,
          productTypeLabel: null,
        })),
    );
  }

  return productPreviewCache.get(productId);
}

function createOrderQueryString(filters) {
  const params = new URLSearchParams();

  appendQueryValue(params, "page", filters.page ?? 1);
  appendQueryValue(params, "pageSize", filters.pageSize ?? DEFAULT_ORDER_PAGE_SIZE);
  appendQueryValue(params, "orderType", filters.orderType);
  appendQueryValue(params, "orderStatus", filters.orderStatus);
  appendQueryValue(params, "shippingStatus", filters.shippingStatus);
  appendQueryValue(params, "paymentStatus", filters.paymentStatus);
  appendQueryValue(params, "sortBy", filters.sortBy ?? "createdAt");
  appendQueryValue(params, "sortOrder", filters.sortOrder ?? "desc");

  return params.toString();
}

function appendQueryValue(params, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  params.set(key, String(value));
}

function normalizePaymentMethod(paymentMethod) {
  return String(paymentMethod ?? "").trim().toLowerCase() === "momo" ? "momo" : "cod";
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}
