/**
 * Auth token storage — persist/retrieve tokens from localStorage.
 * Kept separate so it's easily testable without the GIS library.
 */
import type { AuthTokens } from './types';
import { STORAGE_KEY } from './types';

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function loadTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthTokens;
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      typeof parsed.email !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Returns true if a stored token exists AND has not expired yet.
 * Uses a 60-second buffer to avoid using a nearly-expired token.
 */
export function hasValidToken(): boolean {
  const tokens = loadTokens();
  if (!tokens) return false;
  return tokens.expiresAt > Date.now() + 60_000;
}

/**
 * Compute expiry timestamp from the `expires_in` value Google returns.
 */
export function tokenExpiresAt(expiresInSeconds: number): number {
  return Date.now() + expiresInSeconds * 1_000;
}
