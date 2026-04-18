import { apiGet, apiPost } from "@/services/apiClient";

const PAYMENTS_BASE_PATH = "/api/payments";

export async function getPaymentByPayOsOrderCode(token, orderCode) {
  return apiGet(`${PAYMENTS_BASE_PATH}/payos/order-codes/${orderCode}`, { token });
}

export async function reconcilePayOsPaymentByOrderCode(token, orderCode) {
  return apiPost(`${PAYMENTS_BASE_PATH}/payos/order-codes/${orderCode}/reconcile`, null, { token });
}
