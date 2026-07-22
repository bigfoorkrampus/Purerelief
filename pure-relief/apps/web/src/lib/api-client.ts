import type { ApiResult } from '@pure-relief/shared';

// ============================================================================
// API client — every frontend data call goes through here. Talks to the real
// Worker API. If the Worker isn't running yet (e.g. `vite dev` without
// `wrangler dev` alongside it), calls will fail with a network error, and
// callers should handle that via TanStack Query's error state — there is no
// separate "mock mode" branch to keep in sync; the seeded D1 database is the
// single source of truth for demo content.
// ============================================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  isFormData?: boolean;
  csrfToken?: string;
  signal?: AbortSignal;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (!options.isFormData) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const csrf =
  options.csrfToken ??
  (options.method && options.method !== 'GET'
    ? readCsrfCookie()
    : undefined);

if (csrf) {
  headers['X-CSRF-Token'] = csrf;
}

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options.isFormData ? (options.body as FormData) : options.body != null ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) throw new ApiClientError('NETWORK_ERROR', 'Something went wrong. Please try again.', response.status);
    return (await response.text()) as unknown as T;
  }

  const json = (await response.json()) as ApiResult<T>;
  if (!json.ok) {
    throw new ApiClientError(json.error.code, json.error.message, response.status, json.error.fieldErrors);
  }
  return json.data;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiFetch<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body?: unknown, csrfToken?: string) => apiFetch<T>(path, { method: 'POST', body, csrfToken }),
  put: <T>(path: string, body?: unknown, csrfToken?: string) => apiFetch<T>(path, { method: 'PUT', body, csrfToken }),
  delete: <T>(path: string, csrfToken?: string) => apiFetch<T>(path, { method: 'DELETE', csrfToken }),
  postForm: <T>(path: string, formData: FormData, csrfToken?: string) =>
    apiFetch<T>(path, { method: 'POST', body: formData, isFormData: true, csrfToken }),
};

/** Reads the csrf_token cookie so admin mutation calls can echo it in the X-CSRF-Token header. */
export function readCsrfCookie(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match?.[1];
}
