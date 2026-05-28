/**
 * Auth Zustand store — global connection state shared across the app.
 * Replaces the previous Google OAuth store; no tokens to refresh.
 *
 * Status:
 *   'unknown'      — app just started; haven't checked credentials yet
 *   'connected'    — credentials found in localStorage (family is set up)
 *   'disconnected' — no credentials (new install or after sign-out)
 *   'error'        — unexpected failure
 */
import { create } from 'zustand';
import { loadCredentials, saveCredentials, clearCredentials } from './tokens';
import type { FamilyCredentials } from './types';

export type AuthStatus = 'unknown' | 'connected' | 'disconnected' | 'error';

interface AuthState {
  status: AuthStatus;
  familyId: string | null;
  secret: string | null;
  error: string | null;

  /** Load credentials from localStorage on app start. */
  hydrate: () => void;
  /** Save credentials and mark as connected (called after create/join family). */
  setCredentials: (creds: FamilyCredentials) => void;
  /** Clear credentials and mark as disconnected. */
  clearAuth: () => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  familyId: null,
  secret: null,
  error: null,

  hydrate: () => {
    const creds = loadCredentials();
    if (creds) {
      set({ status: 'connected', familyId: creds.familyId, secret: creds.secret, error: null });
    } else {
      set({ status: 'disconnected', familyId: null, secret: null, error: null });
    }
  },

  setCredentials: (creds: FamilyCredentials) => {
    saveCredentials(creds);
    set({ status: 'connected', familyId: creds.familyId, secret: creds.secret, error: null });
  },

  clearAuth: () => {
    clearCredentials();
    set({ status: 'disconnected', familyId: null, secret: null, error: null });
  },

  setStatus: (status: AuthStatus) => set({ status }),
  setError: (error: string | null) => set({ error }),
}));

/** True if family credentials are present. */
export function selectIsAuthenticated(state: AuthState): boolean {
  return state.status === 'connected';
}

/** Returns { familyId, secret } or null — used by the sync engine. */
export function selectCredentials(state: AuthState): { familyId: string; secret: string } | null {
  if (state.status !== 'connected' || !state.familyId || !state.secret) return null;
  return { familyId: state.familyId, secret: state.secret };
}
