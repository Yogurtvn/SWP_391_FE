import { apiGet, ApiError } from "@/services/apiClient";

const LENS_TYPES_BASE_PATH = "/api/lens-types";

export async function getLensTypes({ page = 1, pageSize = 50, sortBy = "lensName", sortOrder = "asc" } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  params.set("sortBy", String(sortBy));
  params.set("sortOrder", String(sortOrder));

  const response = await apiGet(`${LENS_TYPES_BASE_PATH}?${params.toString()}`);

  return Array.isArray(response?.items) ? response.items.map(normalizeLensType) : [];
}

export function getLensTypeErrorMessage(error, fallbackMessage) {
  if (error instanceof ApiError && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function normalizeLensType(item) {
  return {
    lensTypeId: Number(item?.lensTypeId ?? 0),
    lensCode: item?.lensCode?.trim() || "",
    lensName: item?.lensName?.trim() || "Tròng kính",
    price: Number(item?.price ?? 0),
    isActive: Boolean(item?.isActive),
  };
}

