import type { Response } from 'express';
import { env, isProd } from '../config/env';

/**
 * Refresh token cookie. HTTP-only so JS can't read it, Secure in prod,
 * and path-scoped to /api/v1/auth so the browser only sends it to the
 * refresh/logout endpoints — not on every API request.
 */
const COOKIE_PATH = '/api/v1/auth';

function baseOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: COOKIE_PATH,
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(env.REFRESH_COOKIE_NAME, token, {
    ...baseOptions(),
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.REFRESH_COOKIE_NAME, baseOptions());
}
