/**
 * In-memory access token store. Deliberately NOT in localStorage/sessionStorage
 * so a token isn't readable by injected scripts and doesn't survive a tab close.
 * This module is the single source of truth for the raw token used in requests;
 * the Axios interceptor and AuthContext both read/write it here.
 */
let accessToken: string | null = null;

// Called when a silent refresh fails (session is no longer valid) so the
// AuthContext can clear the user and route to /login.
let authFailureHandler: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function setAuthFailureHandler(handler: (() => void) | null): void {
  authFailureHandler = handler;
}

export function notifyAuthFailure(): void {
  authFailureHandler?.();
}
