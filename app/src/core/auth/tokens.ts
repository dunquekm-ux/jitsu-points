/**
 * Family credential storage — persist/retrieve from localStorage.
 * Named "tokens" to match the old Google auth module's import paths.
 * No token expiry: credentials are valid until the family is deleted.
 */
import type { FamilyCredentials } from './types';
import { CREDS_STORAGE_KEY } from './types';

export function saveCredentials(creds: FamilyCredentials): void {
  localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(creds));
}

export function loadCredentials(): FamilyCredentials | null {
  try {
    const raw = localStorage.getItem(CREDS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FamilyCredentials;
    if (typeof parsed.familyId !== 'string' || typeof parsed.secret !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCredentials(): void {
  localStorage.removeItem(CREDS_STORAGE_KEY);
}

export function hasCredentials(): boolean {
  return loadCredentials() !== null;
}
