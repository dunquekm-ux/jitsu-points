/**
 * Google Identity Services wrapper.
 * Promisifies the callback-based GIS token client.
 *
 * Usage:
 *   await loadGIS();
 *   const tokens = await signIn();              // first time — shows consent screen
 *   const tokens = await silentRefresh();       // subsequent opens — no UI
 */
import { saveTokens, tokenExpiresAt } from './tokens';
import type { AuthTokens } from './types';
import { DRIVE_SCOPE } from './types';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let _tokenClient: ReturnType<NonNullable<Window['google']>['accounts']['oauth2']['initTokenClient']> | null = null;

/**
 * Inject the GIS script tag into <head>. Safe to call multiple times.
 */
export function loadGIS(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts) return Promise.resolve();
  if (document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)) {
    // Already injected — wait for it to load
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (window.google?.accounts) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

function getClientId(): string {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!id) throw new Error('VITE_GOOGLE_CLIENT_ID is not set');
  return id;
}

function getOrCreateTokenClient(): NonNullable<typeof _tokenClient> {
  if (_tokenClient) return _tokenClient;
  if (!window.google?.accounts) throw new Error('GIS not loaded — call loadGIS() first');

  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: getClientId(),
    scope: DRIVE_SCOPE,
    callback: () => {}, // overridden per request below
    error_callback: (err) => {
      console.error('[GIS] error_callback', err);
    },
  });
  return _tokenClient;
}

/**
 * Request an access token. `prompt` controls whether the consent screen shows.
 *   - `'consent select_account'` — first-time sign-in; always shows UI
 *   - `''` — silent refresh; shows UI only if the grant has been revoked
 */
function requestToken(prompt: string): Promise<AuthTokens> {
  return new Promise((resolve, reject) => {
    const client = getOrCreateTokenClient();

    // Monkey-patch the callback for this request
    (client as unknown as { callback: (r: { access_token: string; expires_in: number; email?: string; error?: string }) => void }).callback = (response) => {
      if (response.error) {
        reject(new Error(`GIS token error: ${response.error}`));
        return;
      }
      const tokens: AuthTokens = {
        accessToken: response.access_token,
        expiresAt: tokenExpiresAt(response.expires_in),
        email: response.email ?? '',
      };
      saveTokens(tokens);
      resolve(tokens);
    };

    client.requestAccessToken({ prompt });
  });
}

/**
 * First-time sign-in — shows Google consent screen.
 */
export function signIn(): Promise<AuthTokens> {
  return requestToken('consent select_account');
}

/**
 * Silent token refresh — returns a fresh token without showing any UI.
 * Rejects if the grant has been revoked or the account is no longer signed in.
 */
export function silentRefresh(): Promise<AuthTokens> {
  return requestToken('');
}

/**
 * Revoke the current token and clear local state.
 */
export async function revokeToken(accessToken: string): Promise<void> {
  await loadGIS();
  return new Promise(resolve => {
    window.google?.accounts.oauth2.revoke(accessToken, resolve);
  });
}

/** Reset the cached token client — used in tests. */
export function _resetTokenClient(): void {
  _tokenClient = null;
}
