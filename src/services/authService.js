import { apiGet, apiPost } from "@/services/apiClient";

const AUTH_BASE_PATH = "/api/auth";

const DEMO_USERS = [
  {
    id: "admin-001",
    email: "admin@eyewear.com",
    password: "admin123",
    fullName: "Nguyễn Văn Admin",
    phone: "0901234567",
    role: "admin",
  },
  {
    id: "staff-001",
    email: "staff@eyewear.com",
    password: "staff123",
    fullName: "Tran Thi Staff",
    phone: "0902234567",
    role: "staff",
  },
  {
    id: "customer-001",
    email: "customer@example.com",
    password: "customer123",
    fullName: "Le Van Khách",
    phone: "0903234567",
    role: "customer",
  },
];

export async function loginUser(credentials) {
  const email = credentials.email.trim().toLowerCase();
  const password = credentials.password;

  try {
    const authResponse = await apiPost(`${AUTH_BASE_PATH}/login`, {
      email,
      password,
    });

    return createSessionFromApiResponse(authResponse);
  } catch (error) {
    if (import.meta.env.DEV) {
      return loginWithDemoAccount(email, password, error);
    }

    throw error;
  }
}

export async function loginWithGoogleUser(credential) {
  const authResponse = await apiPost(`${AUTH_BASE_PATH}/google-login`, {
    credential,
  });

  return createSessionFromApiResponse(authResponse);
}

export async function registerUser(payload) {
  const registerPayload = {
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    fullName: payload.fullName.trim(),
    phone: payload.phone?.trim() || null,
  };

  await apiPost(`${AUTH_BASE_PATH}/register`, registerPayload);

  return loginUser({
    email: registerPayload.email,
    password: registerPayload.password,
  });
}

export async function getCurrentUser(accessToken, previousUser = null) {
  const profile = await apiGet(`${AUTH_BASE_PATH}/me`, {
    token: accessToken,
  });

  return mapApiUserToAppUser(profile, previousUser);
}

export async function logoutUser({ accessToken, refreshToken }) {
  if (!accessToken || !refreshToken) {
    return;
  }

  try {
    await apiPost(
      `${AUTH_BASE_PATH}/logout`,
      { refreshToken },
      { token: accessToken },
    );
  } catch {
    // Logging out should still clear local auth state even if the API call fails.
  }
}

export function getAuthErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

async function createSessionFromApiResponse(authResponse) {
  const profile = await getProfileFromToken(authResponse.accessToken);
  const user = mapApiUserToAppUser(profile ?? authResponse.user);

  return {
    user,
    accessToken: authResponse.accessToken,
    refreshToken: authResponse.refreshToken,
  };
}

async function getProfileFromToken(accessToken) {
  try {
    return await apiGet(`${AUTH_BASE_PATH}/me`, {
      token: accessToken,
    });
  } catch {
    return null;
  }
}

function loginWithDemoAccount(email, password, originalError) {
  const demoUser = DEMO_USERS.find((user) => user.email === email && user.password === password);

  if (!demoUser) {
    throw originalError;
  }

  const { password: _password, ...user } = demoUser;

  return {
    user,
    accessToken: null,
    refreshToken: null,
  };
}

function mapApiUserToAppUser(apiUser, previousUser = null) {
  return {
    id: String(apiUser.userId ?? previousUser?.id ?? apiUser.email),
    email: apiUser.email,
    fullName: apiUser.fullName ?? previousUser?.fullName ?? "",
    phone: apiUser.phone ?? previousUser?.phone ?? "",
    role: normalizeRole(apiUser.role),
  };
}

function normalizeRole(role) {
  const normalizedRole = String(role ?? "").trim().toLowerCase();

  if (normalizedRole === "admin" || normalizedRole === "staff" || normalizedRole === "customer") {
    return normalizedRole;
  }

  return "customer";
}

