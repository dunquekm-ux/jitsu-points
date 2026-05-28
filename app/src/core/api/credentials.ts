/**
 * Family credential storage — persists the familyId + secret in localStorage.
 * These are the only credentials the app needs; no OAuth, no tokens to expire.
 */

export interface FamilyCredentials {
  familyId: string;
  secret: string;
}

const CREDS_KEY = 'jitsu-creds';

export function saveCredentials(creds: FamilyCredentials): void {
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
}

export function loadCredentials(): FamilyCredentials | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FamilyCredentials;
    if (typeof parsed.familyId !== 'string' || typeof parsed.secret !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCredentials(): void {
  localStorage.removeItem(CREDS_KEY);
}
