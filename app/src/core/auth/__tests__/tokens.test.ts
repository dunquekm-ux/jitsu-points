/**
 * Tests for family credential storage (replaces the old Google token tests).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { saveCredentials, loadCredentials, clearCredentials, hasCredentials } from '../tokens';
import type { FamilyCredentials } from '../types';

function makeCreds(overrides: Partial<FamilyCredentials> = {}): FamilyCredentials {
  return {
    familyId: 'fam-uuid-1234',
    secret: 'super-secret-token',
    ...overrides,
  };
}

describe('saveCredentials / loadCredentials', () => {
  beforeEach(() => clearCredentials());

  it('round-trips credentials through localStorage', () => {
    const creds = makeCreds();
    saveCredentials(creds);
    expect(loadCredentials()).toEqual(creds);
  });

  it('returns null when nothing is stored', () => {
    expect(loadCredentials()).toBeNull();
  });

  it('returns null for corrupted localStorage entry', () => {
    localStorage.setItem('jitsu-creds', 'not-json{{{');
    expect(loadCredentials()).toBeNull();
  });

  it('returns null for missing fields', () => {
    localStorage.setItem('jitsu-creds', JSON.stringify({ familyId: 'x' }));
    expect(loadCredentials()).toBeNull();
  });

  it('overwrites existing credentials on a second save', () => {
    saveCredentials(makeCreds({ familyId: 'old-id' }));
    saveCredentials(makeCreds({ familyId: 'new-id' }));
    expect(loadCredentials()?.familyId).toBe('new-id');
  });
});

describe('clearCredentials', () => {
  it('removes stored credentials', () => {
    saveCredentials(makeCreds());
    clearCredentials();
    expect(loadCredentials()).toBeNull();
  });

  it('is safe to call when nothing is stored', () => {
    expect(() => clearCredentials()).not.toThrow();
  });
});

describe('hasCredentials', () => {
  beforeEach(() => clearCredentials());

  it('returns false when no credentials are stored', () => {
    expect(hasCredentials()).toBe(false);
  });

  it('returns true when credentials are stored', () => {
    saveCredentials(makeCreds());
    expect(hasCredentials()).toBe(true);
  });

  it('returns false after clearing', () => {
    saveCredentials(makeCreds());
    clearCredentials();
    expect(hasCredentials()).toBe(false);
  });
});
