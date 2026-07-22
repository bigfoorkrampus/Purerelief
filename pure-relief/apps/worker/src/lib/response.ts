import type { Context } from 'hono';
import type { ApiResult } from '@pure-relief/shared';

export function ok<T>(c: Context, data: T, status: 200 | 201 = 200) {
  const body: ApiResult<T> = { ok: true, data };
  return c.json(body, status);
}

export function fail(
  c: Context,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500,
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
) {
  const body: ApiResult<never> = { ok: false, error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } };
  return c.json(body, status);
}

export class HttpError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}
