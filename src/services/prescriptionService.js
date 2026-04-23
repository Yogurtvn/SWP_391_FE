import { apiGet, apiPost, apiRequest, ApiError } from "@/services/apiClient";

const PRESCRIPTIONS_BASE_PATH = "/api/prescriptions";

export async function getPrescriptionEligibility(productId) {
  return apiGet(`/api/products/${productId}/prescription-eligibility`);
}

export async function getPrescriptionOptions() {
  const response = await apiGet("/api/prescription-options");

  return {
    lensMaterials: normalizePricingOptions(response?.lensMaterials),
    coatings: normalizePricingOptions(response?.coatings),
  };
}

export async function calculatePrescriptionPricing(payload) {
  return apiPost("/api/prescription-pricings/calculate", payload);
}

export async function uploadPrescriptionImage(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  return apiPost("/api/prescription-images", formData, { token });
}

export async function getPrescriptions(filters = {}, token) {
  const queryString = createPrescriptionQueryString(filters);
  const response = await apiGet(
    queryString ? `${PRESCRIPTIONS_BASE_PATH}?${queryString}` : PRESCRIPTIONS_BASE_PATH,
    { token },
  );

  return {
    items: Array.isArray(response?.items) ? response.items.map(normalizePrescriptionListItem) : [],
    page: Number(response?.page ?? 1),
    pageSize: Number(response?.pageSize ?? 20),
    totalItems: Number(response?.totalItems ?? response?.totalCount ?? 0),
    totalPages: Number(response?.totalPages ?? 0),
    hasPreviousPage: Boolean(response?.hasPreviousPage),
    hasNextPage: Boolean(response?.hasNextPage),
  };
}

export async function getPrescriptionById(prescriptionId, token) {
  const response = await apiGet(`${PRESCRIPTIONS_BASE_PATH}/${prescriptionId}`, { token });
  return normalizePrescriptionDetail(response);
}

export async function reviewPrescription(prescriptionId, payload, token) {
  return apiRequest(`${PRESCRIPTIONS_BASE_PATH}/${prescriptionId}/review`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export async function requestPrescriptionMoreInfo(prescriptionId, payload, token) {
  return apiRequest(`${PRESCRIPTIONS_BASE_PATH}/${prescriptionId}/request-more-info`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export async function resubmitPrescription(prescriptionId, payload, token) {
  return apiRequest(`${PRESCRIPTIONS_BASE_PATH}/${prescriptionId}/resubmit`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function getPrescriptionApiErrorMessage(error, fallbackMessage) {
  if (error instanceof ApiError && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}

export function getPrescriptionStatusLabel(status) {
  switch (String(status ?? "").trim().toLowerCase()) {
    case "submitted":
      return "Chờ kiểm tra";
    case "reviewing":
      return "Đang kiểm tra";
    case "needmoreinfo":
      return "Cần bổ sung";
    case "approved":
      return "Đã duyệt";
    case "rejected":
      return "Từ chối";
    case "inproduction":
      return "Đang sản xuất";
    default:
      return "Đang cập nhật";
  }
}

export function normalizePrescriptionPayloadFromForm(formState, prescriptionImageUrl) {
  return {
    rightEye: {
      sph: parseDecimal(formState?.rightSph),
      cyl: parseDecimal(formState?.rightCyl),
      axis: parseInteger(formState?.rightAxis),
    },
    leftEye: {
      sph: parseDecimal(formState?.leftSph),
      cyl: parseDecimal(formState?.leftCyl),
      axis: parseInteger(formState?.leftAxis),
    },
    pd: parseDecimal(formState?.pd),
    notes: normalizeOptionalField(formState?.notes),
    prescriptionImageUrl: normalizeOptionalField(prescriptionImageUrl),
  };
}

function normalizePricingOptions(options) {
  return Array.isArray(options)
    ? options
        .map((option) => ({
          code: normalizeText(option?.code) ?? "",
          label: normalizeText(option?.label) ?? normalizeText(option?.code) ?? "Option",
          priceAdjustment: normalizePrice(option?.priceAdjustment),
        }))
        .filter((option) => option.code.length > 0)
    : [];
}

function normalizePrescriptionListItem(item) {
  return {
    prescriptionId: Number(item?.prescriptionId ?? 0),
    userId: Number(item?.userId ?? 0),
    customerName: normalizeText(item?.customerName) ?? `Customer #${item?.userId ?? ""}`,
    customerEmail: normalizeText(item?.customerEmail) ?? "",
    orderId: Number(item?.orderId ?? 0),
    lensTypeId: Number(item?.lensTypeId ?? 0),
    lensTypeCode: normalizeText(item?.lensTypeCode) ?? "",
    lensMaterial: normalizeText(item?.lensMaterial) ?? "",
    totalLensPrice: normalizePrice(item?.totalLensPrice),
    prescriptionImageUrl: normalizeText(item?.prescriptionImageUrl) ?? "",
    prescriptionStatus: item?.prescriptionStatus ?? "",
    prescriptionStatusLabel: getPrescriptionStatusLabel(item?.prescriptionStatus),
    notes: normalizeText(item?.notes) ?? "",
    createdAt: item?.createdAt ?? null,
    createdAtLabel: formatDateTime(item?.createdAt),
  };
}

function normalizePrescriptionDetail(item) {
  const normalized = normalizePrescriptionListItem(item);

  return {
    ...normalized,
    lensBasePrice: normalizePrice(item?.lensBasePrice),
    materialPrice: normalizePrice(item?.materialPrice),
    coatingPrice: normalizePrice(item?.coatingPrice),
    coatings: Array.isArray(item?.coatings) ? item.coatings.filter(Boolean) : [],
    rightEye: normalizeEye(item?.rightEye),
    leftEye: normalizeEye(item?.leftEye),
    pd: normalizePrice(item?.pd),
    staffId: Number(item?.staffId ?? 0),
    verifiedAt: item?.verifiedAt ?? null,
    verifiedAtLabel: item?.verifiedAt ? formatDateTime(item.verifiedAt) : "",
  };
}

function normalizeEye(eye) {
  return {
    sph: Number(eye?.sph ?? 0),
    cyl: Number(eye?.cyl ?? 0),
    axis: Number(eye?.axis ?? 0),
  };
}

function createPrescriptionQueryString(filters) {
  const params = new URLSearchParams();

  appendQueryValue(params, "page", filters.page ?? 1);
  appendQueryValue(params, "pageSize", filters.pageSize ?? 20);
  appendQueryValue(params, "prescriptionStatus", filters.prescriptionStatus);
  appendQueryValue(params, "userId", filters.userId);
  appendQueryValue(params, "fromDate", filters.fromDate);
  appendQueryValue(params, "toDate", filters.toDate);
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

function parseDecimal(value) {
  return Number.parseFloat(String(value ?? "").trim().replace(",", "."));
}

function parseInteger(value) {
  return Number.parseInt(String(value ?? "").trim(), 10);
}

function normalizeOptionalField(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizePrice(value) {
  const normalizedValue = Number(value ?? 0);
  return Number.isFinite(normalizedValue) ? normalizedValue : 0;
}

function formatDateTime(value) {
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

