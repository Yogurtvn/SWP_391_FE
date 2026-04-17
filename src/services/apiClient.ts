const DEFAULT_API_BASE_URL = "http://localhost:5188";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");

interface ApiErrorPayload {
  detail?: string;
  details?: unknown;
  errorCode?: string;
  errors?: Record<string, string[]>;
  message?: string;
  title?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errorCode?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  headers?: HeadersInit;
  token?: string;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers: rawHeaders, body, ...requestInit } = options;
  const headers = new Headers(rawHeaders);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    body,
    headers,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw createApiError(response, payload);
  }

  return payload as T;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

function createApiError(response: Response, payload: unknown): ApiError {
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

function getApiErrorMessage(payload: ApiErrorPayload, fallbackMessage: string): string {
  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (typeof payload.detail === "string" && payload.detail.trim().length > 0) {
    return payload.detail;
  }

  if (payload.errors) {
    const firstError = Object.values(payload.errors).flat().find((message) => message.trim().length > 0);

    if (firstError) {
      return firstError;
    }
  }

  if (typeof payload.title === "string" && payload.title.trim().length > 0) {
    return payload.title;
  }

  return fallbackMessage || "Request failed.";
}

function isApiErrorPayload(payload: unknown): payload is ApiErrorPayload {
  return typeof payload === "object" && payload !== null;
}
