import { apiGet, apiPost, ApiError } from "@/services/apiClient";

export async function getPrescriptionEligibility(productId) {
  return apiGet(`/api/products/${productId}/prescription-eligibility`);
}

export async function calculatePrescriptionPricing(payload) {
  return apiPost("/api/prescription-pricings/calculate", payload);
}

export function getPrescriptionApiErrorMessage(error, fallbackMessage) {
  if (error instanceof ApiError && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}
