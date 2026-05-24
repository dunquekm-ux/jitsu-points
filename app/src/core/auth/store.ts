/**
 * Auth Zustand store — global auth state shared across the app.
 * React components subscribe here; never read localStorage directly in components.
 */
import { create } from 'zustand';
import { loadTokens, saveTokens, clearTokens, hasValidToken } from './tokens';
import type { AuthTokens } from './types';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated' | 'refreshing' | 'error';

interface AuthState {
  status: AuthStatus;
  tokens: AuthTokens | null;
  error: string | null;

  // Actions
  hydrate: () => void;
  setTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  tokens: null,
  error: null,

  /** Load tokens from localStorage on app start. */
  hydrate: () => {
    const tokens = loadTokens();
    if (tokens && hasValidToken()) {
      set({ status: 'authenticated', tokens, error: null });
    } else {
      set({ status: 'unauthenticated', tokens: null, error: null });
    }
  },

  setTokens: (tokens: AuthTokens) => {
    saveTokens(tokens);
    set({ status: 'authenticated', tokens, error: null });
  },

  clearAuth: () => {
    clearTokens();
    set({ status: 'unauthenticated', tokens: null, error: null });
  },

  setStatus: (status: AuthStatus) => set({ status }),
  setError: (error: string | null) => set({ error }),
}));

/** Convenience selector — true if there's a valid access token. */
export function selectIsAuthenticated(state: AuthState): boolean {
  return state.status === 'authenticated' && state.tokens !== null;
}

/** Convenience selector — the current access token, or null. */
export function selectAccessToken(state: AuthState): string | null {
  return state.tokens?.accessToken ?? null;
}
