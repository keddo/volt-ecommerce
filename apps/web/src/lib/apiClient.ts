import type { AuthResponse } from "@personal-ecommerce/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

// Uploaded images are stored and returned as paths relative to the API server (e.g.
// "/uploads/foo.png"), not the Vite dev server that serves this app - resolveImageUrl (in
// ./imageUrl) needs the bare origin to turn those into URLs the browser can actually fetch.
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  // Leave Content-Type unset for FormData so fetch can add its own multipart boundary.
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retry && path !== "/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, false);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const data = await request<AuthResponse>("/auth/refresh", { method: "POST" }, false);
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

function serialize(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (body instanceof FormData) return body;
  return JSON.stringify(body);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: serialize(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: serialize(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: serialize(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
