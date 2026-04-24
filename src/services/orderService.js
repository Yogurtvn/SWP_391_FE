import { getCatalogProductById } from "@/services/catalogService";
import { ApiError, apiGet, apiPost } from "@/services/apiClient";
import { getPrescriptionStatusLabel } from "@/services/prescriptionService";

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

export function createCheckoutPayload({
  cartItems,
  orderType,
  shippingInfo,
  paymentMethod,
  shippingFee = 0,
  voucherCode = "",
}) {
  return {
    cartItemIds: (Array.isArray(cartItems) ? cartItems : [])
      .map((item) => Number(item?.cartItemId))
      .filter((cartItemId) => Number.isFinite(cartItemId) && cartItemId > 0),
    orderType: toApiOrderType(orderType),
    receiverName: normalizeText(shippingInfo?.fullName) ?? "",
    receiverPhone: normalizeText(shippingInfo?.phone) ?? "",
    shippingAddress: composeShippingAddress(shippingInfo),
    shippingFee: normalizeMoney(shippingFee),
    paymentMethod: normalizePaymentMethod(paymentMethod),
    voucherCode: normalizeText(voucherCode),
  };
}

export function buildOrderSummary({
  checkoutResult,
  cartItems,
  orderType,
  shippingInfo,
  paymentMethod,
  shippingFee = 0,
  voucherCode = "",
}) {
  const resolvedPaymentMethod = normalizePaymentMethod(paymentMethod);
  const resolvedOrderType = checkoutResult?.orderType ?? toApiOrderType(orderType);
  const itemCount = (Array.isArray(cartItems) ? cartItems : []).reduce(
    (count, item) => count + Number(item?.quantity ?? 0),
    0,
  );
  const fallbackSubtotal = (Array.isArray(cartItems) ? cartItems : []).reduce(
    (total, item) => total + Number(item?.totalPrice ?? 0),
    0,
  );
  const fallbackTotal = fallbackSubtotal + normalizeMoney(shippingFee);
  const createdAt = new Date();

  return {
    orderId: Number(checkoutResult?.orderId ?? 0),
    orderCreated: Boolean(checkoutResult?.orderId),
    orderType: resolvedOrderType,
    orderTypeLabel: getOrderTypeLabel(resolvedOrderType),
    orderStatus: checkoutResult?.orderStatus ?? "pending",
    orderStatusLabel: getOrderStatusLabel(checkoutResult?.orderStatus ?? "pending"),
    paymentMethod: resolvedPaymentMethod,
    paymentMethodLabel: getPaymentMethodLabel(resolvedPaymentMethod),
    paymentStatus: checkoutResult?.payment?.paymentStatus ?? "pending",
    paymentStatusLabel: getPaymentStatusLabel(checkoutResult?.payment?.paymentStatus ?? "pending"),
    itemCount,
    total: Number(checkoutResult?.totalAmount ?? fallbackTotal),
    voucherCode: normalizeText(voucherCode),
    customerName: normalizeText(shippingInfo?.fullName) ?? "Khách hàng Vision Direct",
    phone: normalizeText(shippingInfo?.phone) ?? "Chưa cập nhật",
    email: normalizeText(shippingInfo?.email) ?? "Chưa cập nhật",
    shippingAddress: composeShippingAddress(shippingInfo) || "Địa chỉ giao hàng sẽ được cập nhật sau.",
    createdAtLabel: formatDateTime(createdAt),
  };
}

export function normalizeOrderDetail(order) {
  const items = Array.isArray(order?.items)
    ? order.items.map((item) => ({
        orderItemId: Number(item?.orderItemId ?? 0),
        variantId: Number(item?.variantId ?? 0),
        productId: Number(item?.productId ?? 0),
        productName: item?.productName?.trim() || "Sản phẩm",
        sku: item?.sku?.trim() || "",
        selectedColor: normalizeText(item?.selectedColor) ?? normalizeText(item?.variantColor) ?? "Mặc định",
        quantity: Number(item?.quantity ?? 0),
        stockQuantity: Number(item?.stockQuantity ?? 0),
        isReadyAvailable: Boolean(item?.isReadyAvailable),
        isPreOrderAllowed: Boolean(item?.isPreOrderAllowed),
        expectedRestockDate: item?.expectedRestockDate ?? null,
        preOrderNote: normalizeText(item?.preOrderNote) ?? "",
        unitPrice: Number(item?.unitPrice ?? 0),
        lineTotal: Number(item?.lineTotal ?? 0),
        lensTypeId: Number(item?.lensTypeId ?? 0),
        lensPrice: Number(item?.lensPrice ?? 0),
        prescriptionId: Number(item?.prescriptionId ?? item?.prescription?.prescriptionId ?? 0),
        prescription: normalizeOrderPrescription(item?.prescription),
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
        paidAtLabel: order.payment.paidAt ? formatDateTime(order.payment.paidAt) : "Chưa thanh toán",
      }
    : null;

  const statusHistory = Array.isArray(order?.statusHistory)
    ? order.statusHistory.map((history) => ({
        historyId: Number(history?.historyId ?? 0),
        orderStatus: history?.orderStatus ?? "",
        orderStatusLabel: getOrderStatusLabel(history?.orderStatus),
        updatedByUserId: Number(history?.updatedByUserId ?? 0),
        updatedByName: history?.updatedByName?.trim() || "Hệ thống",
        note: translateOrderHistoryNote(history?.note),
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
    receiverName: order?.receiverName?.trim() || "Khách hàng Vision Direct",
    receiverPhone: order?.receiverPhone?.trim() || "Chưa cập nhật",
    shippingAddress: order?.shippingAddress?.trim() || "Chưa cập nhật",
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
      return "Đơn hàng có sẵn";
    case "preorder":
      return "Đơn đặt trước";
    case "prescription":
      return "Đơn kính theo toa";
    default:
      return "Đơn hàng";
  }
}

export function getOrderStatusLabel(orderStatus) {
  switch (String(orderStatus ?? "").trim().toLowerCase()) {
    case "pending":
      return "Chờ xác nhận";
    case "confirmed":
      return "Đã xác nhận";
    case "awaitingstock":
      return "Chờ bổ sung hàng";
    case "processing":
      return "Đang xử lý";
    case "shipped":
      return "Đang giao hàng";
    case "completed":
      return "Hoàn tất";
    case "cancelled":
      return "Đã hủy";
    default:
      return "Đang cập nhật";
  }
}

export function getShippingStatusLabel(shippingStatus) {
  switch (String(shippingStatus ?? "").trim().toLowerCase()) {
    case "pending":
      return "Chuẩn bị giao";
    case "picking":
      return "Đang lấy hàng";
    case "delivering":
      return "Đang giao";
    case "delivered":
      return "Đã giao";
    case "failed":
      return "Giao thất bại";
    default:
      return "Chưa giao hàng";
  }
}

export function getDisplayOrderStatus(orderStatus, shippingStatus) {
  const normalizedOrderStatus = String(orderStatus ?? "").trim().toLowerCase();
  const normalizedShippingStatus = String(shippingStatus ?? "").trim().toLowerCase();

  if (normalizedOrderStatus === "cancelled") {
    return {
      key: "cancelled",
      label: "Đã hủy",
    };
  }

  if (normalizedShippingStatus === "delivered") {
    return {
      key: "delivered",
      label: "Đã giao hàng",
    };
  }

  if (
    normalizedShippingStatus === "picking" ||
    normalizedShippingStatus === "delivering" ||
    normalizedOrderStatus === "shipped"
  ) {
    return {
      key: "shipping",
      label: "Đang giao hàng",
    };
  }

  return {
    key: "processing",
    label: getOrderStatusLabel(orderStatus),
  };
}

export function getPaymentMethodLabel(paymentMethod) {
  switch (normalizePaymentMethod(paymentMethod)) {
    case "payos":
      return "Thanh toán PayOS";
    default:
      return "Thanh toán khi nhận hàng";
  }
}

export function getPaymentStatusLabel(paymentStatus) {
  switch (String(paymentStatus ?? "").trim().toLowerCase()) {
    case "completed":
      return "Đã thanh toán";
    case "failed":
      return "Thanh toán thất bại";
    default:
      return "Chờ thanh toán";
  }
}

function translateOrderHistoryNote(note) {
  const normalizedNote = normalizeText(note);

  if (!normalizedNote) {
    return "";
  }

  switch (normalizedNote.toLowerCase()) {
    case "order created.":
    case "order created":
      return "Đơn hàng đã được tạo.";
    default:
      return normalizedNote;
  }
}

export function formatDateTime(value) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeOrderPrescription(prescription) {
  if (!prescription) {
    return null;
  }

  return {
    prescriptionId: Number(prescription?.prescriptionId ?? 0),
    lensTypeId: Number(prescription?.lensTypeId ?? 0),
    lensTypeCode: normalizeText(prescription?.lensTypeCode) ?? "",
    lensMaterial: normalizeText(prescription?.lensMaterial) ?? "",
    coatings: Array.isArray(prescription?.coatings) ? prescription.coatings.filter(Boolean) : [],
    lensBasePrice: Number(prescription?.lensBasePrice ?? 0),
    materialPrice: Number(prescription?.materialPrice ?? 0),
    coatingPrice: Number(prescription?.coatingPrice ?? 0),
    totalLensPrice: Number(prescription?.totalLensPrice ?? 0),
    rightEye: normalizePrescriptionEye(prescription?.rightEye),
    leftEye: normalizePrescriptionEye(prescription?.leftEye),
    pd: Number(prescription?.pd ?? 0),
    prescriptionImageUrl: normalizeText(prescription?.prescriptionImageUrl) ?? "",
    prescriptionStatus: prescription?.prescriptionStatus ?? "",
    prescriptionStatusLabel: getPrescriptionStatusLabel(prescription?.prescriptionStatus),
    notes: normalizeText(prescription?.notes) ?? "",
    staffId: Number(prescription?.staffId ?? 0),
    verifiedAt: prescription?.verifiedAt ?? null,
    createdAt: prescription?.createdAt ?? null,
  };
}

function normalizePrescriptionEye(eye) {
  return {
    sph: Number(eye?.sph ?? 0),
    cyl: Number(eye?.cyl ?? 0),
    axis: Number(eye?.axis ?? 0),
  };
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
    receiverName: summary?.receiverName?.trim() || detail?.receiverName || "Khách hàng Vision Direct",
    paymentMethod: summary?.paymentMethod ?? detail?.payment?.paymentMethod ?? null,
    paymentMethodLabel: getPaymentMethodLabel(summary?.paymentMethod ?? detail?.payment?.paymentMethod),
    paymentStatus: summary?.paymentStatus ?? detail?.payment?.paymentStatus ?? null,
    paymentStatusLabel: getPaymentStatusLabel(summary?.paymentStatus ?? detail?.payment?.paymentStatus),
    createdAt: summary?.createdAt ?? detail?.createdAt ?? null,
    createdAtLabel: formatDateTime(summary?.createdAt ?? detail?.createdAt),
    updatedAt: summary?.updatedAt ?? detail?.updatedAt ?? null,
    updatedAtLabel: formatDateTime(summary?.updatedAt ?? detail?.updatedAt),
    firstItemName: firstItem?.productName || `${itemCount} sản phẩm`,
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
  const normalizedPaymentMethod = String(paymentMethod ?? "").trim().toLowerCase();

  if (normalizedPaymentMethod === "payos" || normalizedPaymentMethod === "momo") {
    return "payos";
  }

  return "cod";
}

function toApiOrderType(orderType) {
  const normalizedOrderType = String(orderType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  switch (normalizedOrderType) {
    case "preorder":
      return "preOrder";
    case "prescription":
      return "prescription";
    default:
      return "ready";
  }
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeMoney(value) {
  const normalizedValue = Number(value ?? 0);

  return Number.isFinite(normalizedValue) && normalizedValue > 0
    ? Math.round(normalizedValue * 100) / 100
    : 0;
}


