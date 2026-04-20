import { apiGet, apiPost } from "@/services/apiClient";

const SHIPPING_BASE_PATH = "/api/shipping";

export async function getShippingProvinces() {
  const response = await apiGet(`${SHIPPING_BASE_PATH}/provinces`);
  return Array.isArray(response) ? response.map(normalizeProvince) : [];
}

export async function getShippingDistricts(provinceId) {
  const response = await apiGet(`${SHIPPING_BASE_PATH}/districts?provinceId=${encodeURIComponent(provinceId)}`);
  return Array.isArray(response) ? response.map(normalizeDistrict) : [];
}

export async function getShippingWards(districtId) {
  const response = await apiGet(`${SHIPPING_BASE_PATH}/wards?districtId=${encodeURIComponent(districtId)}`);
  return Array.isArray(response) ? response.map(normalizeWard) : [];
}

export async function calculateShippingFee({ districtId, wardCode, weight }) {
  const response = await apiPost(`${SHIPPING_BASE_PATH}/calculate-fee`, {
    toDistrictId: Number(districtId),
    toWardCode: String(wardCode ?? ""),
    weight: Math.max(1, Number(weight ?? 200)),
  });

  return {
    totalFee: Number(response?.totalFee ?? response?.TotalFee ?? 0),
    serviceFee: Number(response?.serviceFee ?? response?.ServiceFee ?? 0),
    insuranceFee: Number(response?.insuranceFee ?? response?.InsuranceFee ?? 0),
    expectedDeliveryTime: response?.expectedDeliveryTime ?? response?.ExpectedDeliveryTime ?? "",
  };
}

export function getShippingErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}

function normalizeProvince(item) {
  return {
    provinceId: Number(item?.provinceID ?? item?.provinceId ?? item?.ProvinceID ?? 0),
    provinceName: item?.provinceName ?? item?.ProvinceName ?? "",
  };
}

function normalizeDistrict(item) {
  return {
    districtId: Number(item?.districtID ?? item?.districtId ?? item?.DistrictID ?? 0),
    districtName: item?.districtName ?? item?.DistrictName ?? "",
    provinceId: Number(item?.provinceID ?? item?.provinceId ?? item?.ProvinceID ?? 0),
  };
}

function normalizeWard(item) {
  return {
    wardCode: String(item?.wardCode ?? item?.WardCode ?? ""),
    wardName: item?.wardName ?? item?.WardName ?? "",
    districtId: Number(item?.districtID ?? item?.districtId ?? item?.DistrictID ?? 0),
  };
}
