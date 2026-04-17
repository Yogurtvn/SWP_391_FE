import type { User } from "@/store/auth/authTypes";

const STORAGE_KEYS = {
  accessToken: "auth_access_token",
  refreshToken: "auth_refresh_token",
  user: "auth_user",
} as const;

interface StoredAuthSnapshot {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}

export function loadStoredAuth(): StoredAuthSnapshot {
  return {
    accessToken: readStorageValue(STORAGE_KEYS.accessToken),
    refreshToken: readStorageValue(STORAGE_KEYS.refreshToken),
    user: readStoredUser(),
  };
}

export function persistStoredAuth(snapshot: StoredAuthSnapshot) {
  writeStorageValue(STORAGE_KEYS.accessToken, snapshot.accessToken);
  writeStorageValue(STORAGE_KEYS.refreshToken, snapshot.refreshToken);

  if (snapshot.user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(snapshot.user));
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.user);
}

function readStoredUser(): User | null {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEYS.user);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<User>;

    if (!parsedValue.email || !parsedValue.role || !isUserRole(parsedValue.role)) {
      return null;
    }

    return {
      id: parsedValue.id ?? parsedValue.email,
      email: parsedValue.email,
      fullName: parsedValue.fullName ?? "",
      phone: parsedValue.phone ?? "",
      role: parsedValue.role,
    };
  } catch {
    return null;
  }
}

function readStorageValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string | null) {
  if (value) {
    localStorage.setItem(key, value);
    return;
  }

  localStorage.removeItem(key);
}

function isUserRole(role: string): role is User["role"] {
  return role === "admin" || role === "staff" || role === "customer";
}
