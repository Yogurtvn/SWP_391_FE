import {
  clearStoredAuth,
  getStoredAccessToken,
  getStoredRefreshToken,
  updateStoredAccessToken,
} from "@/store/auth/authStorage";

const DEFAULT_API_BASE_URL = "http://localhost:5188";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");

let refreshAccessTokenPromise = null;

function notifyAuthExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth:expired"));
  }
}

export class ApiError extends Error {
  constructor(message, status, errorCode, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export function apiGet(path, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "GET",
  });
}

export function apiPost(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "POST",
    body,
  });
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    token,
    body,
    headers: customHeaders,
    _retryAfterRefresh = false,
    ...fetchOptions
  } = options;

  const headers = createHeaders(customHeaders, token);
  const requestBody = createRequestBody(body, headers);

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method,
    headers,
    body: requestBody,
  });

  if (response.status === 401 && shouldRetryAfterRefresh(path, _retryAfterRefresh)) {
    const refreshedAccessToken = await refreshAccessToken();

    if (refreshedAccessToken) {
      const retryHeaders = createHeaders(customHeaders, refreshedAccessToken);
      const retryBody = createRequestBody(body, retryHeaders);

      response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        method,
        headers: retryHeaders,
        body: retryBody,
      });
    }
  }

  const payload = await readResponseBody(response);

  if (!response.ok) {
    throw createApiError(response, payload);
  }

  return payload;
}

function createHeaders(customHeaders, token) {
  const headers = new Headers(customHeaders);
  const resolvedToken = resolveAccessToken(token);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (resolvedToken) {
    headers.set("Authorization", `Bearer ${resolvedToken}`);
  }

  return headers;
}

function resolveAccessToken(providedToken) {
  return getStoredAccessToken() || providedToken || null;
}

function createRequestBody(body, headers) {
  if (body === undefined || body === null) {
    return undefined;
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (isFormData) {
    return body;
  }

  const isRawBody =
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer;

  if (isRawBody) {
    return body;
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return JSON.stringify(body);
}

async function readResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const responseText = await response.text();

  if (responseText.length === 0) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(responseText);
  }

  return responseText;
}

function createApiError(response, payload) {
  if (isApiErrorPayload(payload)) {
    return new ApiError(
      getApiErrorMessage(payload, response.statusText),
      response.status,
      payload.errorCode,
      payload.details ?? payload.errors,
    );
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return new ApiError(payload, response.status);
  }

  return new ApiError(response.statusText || "Request failed.", response.status);
}

function shouldRetryAfterRefresh(path, hasRetried) {
  if (hasRetried) {
    return false;
  }

  if (!getStoredRefreshToken()) {
    return false;
  }

  return !(
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/google-login") ||
    path.startsWith("/api/auth/register") ||
    path.startsWith("/api/auth/logout") ||
    path.startsWith("/api/auth/refresh-tokens")
  );
}

async function refreshAccessToken() {
  if (!getStoredRefreshToken()) {
    return null;
  }

  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = requestNewAccessToken()
      .catch(() => {
        clearStoredAuth();
        notifyAuthExpired();
        return null;
      })
      .finally(() => {
        refreshAccessTokenPromise = null;
      });
  }

  return refreshAccessTokenPromise;
}

async function requestNewAccessToken() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh-tokens`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await readResponseBody(response);

  if (!response.ok) {
    throw createApiError(response, payload);
  }

  if (!payload?.accessToken) {
    throw new ApiError("Khong nhan duoc access token moi.", response.status || 401);
  }

  updateStoredAccessToken(payload.accessToken);
  return payload.accessToken;
}

function getApiErrorMessage(payload, fallbackMessage) {
  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (typeof payload.detail === "string" && payload.detail.trim().length > 0) {
    return payload.detail;
  }

  if (payload.errors) {
    const firstError = Object.values(payload.errors)
      .flat()
      .find((message) => typeof message === "string" && message.trim().length > 0);

    if (firstError) {
      return firstError;
    }
  }

  if (typeof payload.title === "string" && payload.title.trim().length > 0) {
    return payload.title;
  }

  return fallbackMessage || "Request failed.";
}

function isApiErrorPayload(payload) {
  return typeof payload === "object" && payload !== null;
}
