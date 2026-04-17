import { apiRequest } from "@/services/apiClient";

export interface AuthApiUser {
  userId: number;
  email: string;
  role: string;
}

export interface AuthApiResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthApiUser;
}

export interface CurrentUserApiResponse {
  userId: number;
  email: string;
  fullName?: string | null;
  role: string;
}

export interface RegisterApiResponse {
  userId: number;
  email: string;
  role: string;
}

export interface RegisterRequestPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
}

interface LogoutApiResponse {
  message: string;
}

export async function loginRequest(email: string, password: string): Promise<AuthApiResponse> {
  return apiRequest<AuthApiResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithGoogleRequest(credential: string): Promise<AuthApiResponse> {
  return apiRequest<AuthApiResponse>("/api/auth/google-login", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export async function registerRequest(payload: RegisterRequestPayload): Promise<RegisterApiResponse> {
  return apiRequest<RegisterApiResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUserRequest(accessToken: string): Promise<CurrentUserApiResponse> {
  return apiRequest<CurrentUserApiResponse>("/api/auth/me", {
    method: "GET",
    token: accessToken,
  });
}

export async function logoutRequest(refreshToken: string, accessToken: string): Promise<LogoutApiResponse> {
  return apiRequest<LogoutApiResponse>("/api/auth/logout", {
    method: "POST",
    token: accessToken,
    body: JSON.stringify({ refreshToken }),
  });
}
