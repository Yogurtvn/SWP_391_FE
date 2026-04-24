import { apiGet, apiPost, apiRequest } from "@/services/apiClient";

const PAYMENTS_BASE_PATH = "/api/payments";

export async function createPayment(token, payload) {
  return apiPost(PAYMENTS_BASE_PATH, payload, { token });
}

export async function getPayments(token, filters = {}) {
  const query = new URLSearchParams();
  if (filters.page) query.set("page", filters.page);
  if (filters.pageSize) query.set("pageSize", filters.pageSize);
  if (filters.paymentMethod) query.set("paymentMethod", filters.paymentMethod);
  if (filters.paymentStatus) query.set("paymentStatus", filters.paymentStatus);
  if (filters.orderId) query.set("orderId", filters.orderId);
  if (filters.fromDate) query.set("fromDate", filters.fromDate);
  if (filters.toDate) query.set("toDate", filters.toDate);
  if (filters.sortBy) query.set("sortBy", filters.sortBy);
  if (filters.sortOrder) query.set("sortOrder", filters.sortOrder);

  const queryString = query.toString();
  return apiGet(`${PAYMENTS_BASE_PATH}${queryString ? `?${queryString}` : ""}`, { token });
}

export async function getPaymentById(token, paymentId) {
  return apiGet(`${PAYMENTS_BASE_PATH}/${paymentId}`, { token });
}

export async function getPaymentByPayOsOrderCode(token, orderCode) {
  return apiGet(`${PAYMENTS_BASE_PATH}/payos/order-codes/${orderCode}`, { token });
}

export async function reconcilePayOsPaymentByOrderCode(token, orderCode) {
  return apiPost(`${PAYMENTS_BASE_PATH}/payos/order-codes/${orderCode}/reconcile`, null, { token });
}

export async function updatePaymentStatus(token, paymentId, payload) {
  return apiRequest(`${PAYMENTS_BASE_PATH}/${paymentId}/statuses`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export async function getPaymentHistories(token, paymentId) {
  return apiGet(`${PAYMENTS_BASE_PATH}/${paymentId}/histories`, { token });
}
