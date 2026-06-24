/**
 * Shared test helpers for Jitsu E2E tests.
 */
import type { Page } from '@playwright/test';

export const DB_NAME = 'jitsu-points';

/** Wipe the IndexedDB so every test starts from a clean slate. */
export async function clearAppData(page: Page): Promise<void> {
  // IndexedDB is denied on the initial about:blank context — make sure we're on
  // the app origin before touching storage.
  if (!page.url().startsWith('http')) {
    await page.goto('/');
  }
  await page.evaluate((dbName) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve(); // already gone / blocked — continue
    });
  }, DB_NAME);
  // Also clear localStorage (theme, install banner dismissals, auth tokens)
  await page.evaluate(() => localStorage.clear());
}

/** Load demo data via the DEV-only button on the WelcomeScreen. */
export async function loadDemoData(page: Page): Promise<void> {
  await page.goto('/');
  // Wait for WelcomeScreen (no family data on fresh load)
  await page.waitForSelector('[data-testid="load-demo-btn"]', { timeout: 8000 });
  await page.click('[data-testid="load-demo-btn"]');
  // Wait for redirect to profile picker
  await page.waitForURL('/', { timeout: 8000 });
  await page.waitForSelector('[data-testid="profile-picker"]', { timeout: 8000 });
}
