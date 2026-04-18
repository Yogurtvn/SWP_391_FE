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
    fullName: [normalizeText(profileForm?.firstName), normalizeText(profileForm?.lastName)]
      .filter(Boolean)
      .join(" "),
    phone: normalizeText(profileForm?.phone),
  };
}

export function normalizeProfile(profile) {
  const normalizedFullName = normalizeText(profile?.fullName) ?? "";
  const { firstName, lastName } = splitFullName(normalizedFullName);

  return {
    userId: Number(profile?.userId ?? 0),
    email: normalizeText(profile?.email) ?? "",
    fullName: normalizedFullName,
    firstName,
    lastName,
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

function splitFullName(fullName) {
  const normalizedValue = normalizeText(fullName) ?? "";

  if (!normalizedValue) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const segments = normalizedValue.split(/\s+/);

  if (segments.length === 1) {
    return {
      firstName: segments[0],
      lastName: "",
    };
  }

  return {
    firstName: segments.slice(0, -1).join(" "),
    lastName: segments.at(-1) ?? "",
  };
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}
