import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string; // user id
}

/** Signs a short-lived JWT access token. */
export function signAccessToken(userId: string): string {
  const payload: AccessTokenPayload = { sub: userId };
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, options);
}

/** Verifies an access token and returns its payload, or throws. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}

/** Generates a high-entropy opaque refresh token (the raw value). */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

/** Hashes a refresh token for storage/lookup (never store the raw token). */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Refresh token expiry as a Date, based on REFRESH_TOKEN_TTL_DAYS. */
export function refreshTokenExpiry(): Date {
  const ms = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}
