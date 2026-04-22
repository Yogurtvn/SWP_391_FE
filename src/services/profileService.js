import { ApiError, apiGet, apiRequest } from "@/services/apiClient";

const USERS_BASE_PATH = "/api/users";

export async function getMyProfile(token) {
  const response = await apiGet(`${USERS_BASE_PATH}/profile`, { token });
  return normalizeProfile(response);
}

export async function updateMyProfile(token, payload) {
  await apiRequest(`${USERS_BASE_PATH}/profile`, {
    method: "PUT",
    token,
    body: payload,
  });

  return getMyProfile(token);
}

export function createProfileUpdatePayload(profileForm) {
  return {
    fullName: normalizeText(profileForm?.fullName),
    phone: normalizeText(profileForm?.phone),
  };
}

export function normalizeProfile(profile) {
  const normalizedFullName = normalizeText(profile?.fullName) ?? "";

  return {
    userId: Number(profile?.userId ?? 0),
    email: normalizeText(profile?.email) ?? "",
    fullName: normalizedFullName,
    phone: normalizeText(profile?.phone) ?? "",
  };
}

export function getProfileErrorMessage(error, fallbackMessage) {
  if (error instanceof ApiError && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}
