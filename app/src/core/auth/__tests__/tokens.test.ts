import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveTokens,
  loadTokens,
  clearTokens,
  hasValidToken,
  tokenExpiresAt,
} from '../tokens';
import type { AuthTokens } from '../types';

function makeTokens(overrides: Partial<AuthTokens> = {}): AuthTokens {
  return {
    accessToken: 'ya29.test-token',
    expiresAt: Date.now() + 3_600_000, // 1 hour from now
    email: 'parent@example.com',
    ...overrides,
  };
}

describe('saveTokens / loadTokens', () => {
  beforeEach(() => clearTokens());

  it('round-trips tokens through localStorage', () => {
    const tokens = makeTokens();
    saveTokens(tokens);
    const loaded = loadTokens();
    expect(loaded).toEqual(tokens);
  });

  it('returns null when nothing is stored', () => {
    expect(loadTokens()).toBeNull();
  });

  it('returns null for corrupted localStorage entry', () => {
    localStorage.setItem('jitsu-auth', 'not-json{{{');
    expect(loadTokens()).toBeNull();
  });

  it('returns null for missing fields', () => {
    localStorage.setItem('jitsu-auth', JSON.stringify({ accessToken: 'x' }));
    expect(loadTokens()).toBeNull();
  });
});

describe('clearTokens', () => {
  it('removes stored tokens', () => {
    saveTokens(makeTokens());
    clearTokens();
    expect(loadTokens()).toBeNull();
  });

  it('is safe to call when nothing is stored', () => {
    expect(() => clearTokens()).not.toThrow();
  });
});

describe('hasValidToken', () => {
  beforeEach(() => clearTokens());

  it('returns false when no token is stored', () => {
    expect(hasValidToken()).toBe(false);
  });

  it('returns true for a fresh token', () => {
    saveTokens(makeTokens({ expiresAt: Date.now() + 3_600_000 }));
    expect(hasValidToken()).toBe(true);
  });

  it('returns false for an expired token', () => {
    saveTokens(makeTokens({ expiresAt: Date.now() - 1_000 }));
    expect(hasValidToken()).toBe(false);
  });

  it('returns false for a token expiring within the 60s buffer', () => {
    saveTokens(makeTokens({ expiresAt: Date.now() + 30_000 })); // 30s — within 60s buffer
    expect(hasValidToken()).toBe(false);
  });

  it('returns true for a token expiring just outside the 60s buffer', () => {
    saveTokens(makeTokens({ expiresAt: Date.now() + 90_000 })); // 90s — outside buffer
    expect(hasValidToken()).toBe(true);
  });
});

describe('tokenExpiresAt', () => {
  it('converts expires_in seconds to a future timestamp', () => {
    const before = Date.now();
    const expiresAt = tokenExpiresAt(3600);
    const after = Date.now();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3_600_000);
    expect(expiresAt).toBeLessThanOrEqual(after + 3_600_000);
  });
});
