/**
 * Robust, production API Client with CSRF handling, 401 auth interception,
 * 429 rate limit parsing, and typed error mapping.
 */

import { ApiError, type ApiErrorResponse } from "./errors";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

export interface RequestOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";

    // When running locally on localhost or 127.0.0.1, always route through Vite's dev proxy (/api/v1)
    // to eliminate CORS cross-origin blocks, third-party cookie restrictions, and DNS rebinding errors.
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      if (!envUrl || (typeof envUrl === "string" && envUrl.includes("localtest.me"))) {
        return "/api/v1";
      }
      return envUrl;
    }

    // On live production domains (e.g. *.vercel.app or HTTPS hosts), use relative /api/v1
    if (window.location.protocol === "https:" || hostname.endsWith(".vercel.app")) {
      if (typeof envUrl === "string" && envUrl.startsWith("https://")) {
        return envUrl;
      }
      return "/api/v1";
    }
  }
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api/v1";
}

export const API_BASE_URL = getApiBaseUrl();

export async function ensureCsrfToken(): Promise<string | null> {
  let existing = getCookie("csrftoken");
  if (!existing) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/csrf/`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.csrfToken) {
          return data.csrfToken;
        }
      }
    } catch {
      // Ignore network errors on pre-flight csrf fetch
    }
    existing = getCookie("csrftoken");
  }
  return existing;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const method = (options.method || "GET").toUpperCase();

  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  // On state-mutating requests (POST, PATCH, DELETE, PUT), include CSRF token
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    let csrfToken = getCookie("csrftoken");
    if (!csrfToken) {
      csrfToken = await ensureCsrfToken();
    }
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
    if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  // Handle errors
  if (!response.ok) {
    let errorCode = `http_${response.status}`;
    let errorMessage = response.statusText;
    let details: Record<string, string[]> = {};
    let requestId: string | undefined;

    try {
      const errJson = (await response.json()) as ApiErrorResponse;
      if (errJson && errJson.error) {
        errorCode = errJson.error.code || errorCode;
        errorMessage = errJson.error.message || errorMessage;
        details = errJson.error.details || {};
        requestId = errJson.error.request_id;
      }
    } catch {
      // Non-JSON error body fallback
    }

    // Rate limiting (429) retry header
    let retryAfterSeconds: number | undefined;
    const retryHeader = response.headers.get("Retry-After");
    if (retryHeader) {
      const parsed = parseInt(retryHeader, 10);
      if (!isNaN(parsed)) retryAfterSeconds = parsed;
    }

    // Handle 401 unauthenticated redirect (except when deliberately probing /auth/me/)
    if (response.status === 401 && !endpoint.includes("/auth/me/") && !options.skipAuthRedirect) {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith("/login") && !currentPath.startsWith("/signup")) {
          window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    throw new ApiError(errorCode, errorMessage, response.status, details, requestId, retryAfterSeconds);
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
