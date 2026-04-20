const STORAGE_KEYS = {
  accessToken: "auth_access_token",
  refreshToken: "auth_refresh_token",
  user: "auth_user",
};

export function loadStoredAuth() {
  return {
    accessToken: readStorageText(STORAGE_KEYS.accessToken),
    refreshToken: readStorageText(STORAGE_KEYS.refreshToken),
    user: readStoredUser(),
  };
}

export function getStoredAccessToken() {
  return readStorageText(STORAGE_KEYS.accessToken);
}

export function getStoredRefreshToken() {
  return readStorageText(STORAGE_KEYS.refreshToken);
}

export function persistStoredAuth(authState) {
  writeStorageText(STORAGE_KEYS.accessToken, authState.accessToken);
  writeStorageText(STORAGE_KEYS.refreshToken, authState.refreshToken);
  writeStoredUser(authState.user);
}

export function updateStoredAccessToken(accessToken) {
  writeStorageText(STORAGE_KEYS.accessToken, accessToken);
}

export function clearStoredAuth() {
  writeStorageText(STORAGE_KEYS.accessToken, null);
  writeStorageText(STORAGE_KEYS.refreshToken, null);
  writeStoredUser(null);
}

function readStoredUser() {
  const storedUser = readStorageJson(STORAGE_KEYS.user);

  if (!isValidStoredUser(storedUser)) {
    return null;
  }

  return {
    id: storedUser.id ?? storedUser.email,
    email: storedUser.email,
    fullName: storedUser.fullName ?? "",
    phone: storedUser.phone ?? "",
    role: storedUser.role,
  };
}

function writeStoredUser(user) {
  if (!canUseLocalStorage()) {
    return;
  }

  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.user);
    return;
  }

  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

function readStorageText(key) {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageText(key, value) {
  if (!canUseLocalStorage()) {
    return;
  }

  if (value) {
    localStorage.setItem(key, value);
    return;
  }

  localStorage.removeItem(key);
}

function readStorageJson(key) {
  const rawValue = readStorageText(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isValidStoredUser(user) {
  return Boolean(
    user &&
      typeof user.email === "string" &&
      user.email.trim().length > 0 &&
      isValidUserRole(user.role),
  );
}

function isValidUserRole(role) {
  return role === "admin" || role === "staff" || role === "customer";
}
