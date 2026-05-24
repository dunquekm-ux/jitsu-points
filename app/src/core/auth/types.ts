/**
 * Auth types — Google Identity Services ambient types + internal state.
 * GIS has no official @types package; we declare the minimal surface we use.
 */

// ─── Google Identity Services ambient declarations ────────────────────────────

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string; message?: string }) => void;
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface Google {
  accounts: {
    oauth2: {
      initTokenClient: (config: TokenClientConfig) => TokenClient;
      revoke: (token: string, callback: () => void) => void;
    };
  };
}

declare global {
  interface Window {
    google?: Google;
  }
}

// ─── Internal auth state ──────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  expiresAt: number; // Unix timestamp ms — when the token expires
  email: string;
}

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const STORAGE_KEY = 'jitsu-auth';
