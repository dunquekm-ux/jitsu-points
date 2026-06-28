/**
 * "What's New" modal — shows once in Parent Mode after a version change,
 * for returning users only.
 */
import { test, expect } from '@playwright/test';
import { clearAppData, loadDemoData } from './helpers';

const VERSION_KEY = 'jitsu-last-seen-version';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await clearAppData(page);
  await loadDemoData(page);
});

test('returning user sees the modal once in Parent Mode, then never again', async ({ page }) => {
  // Demo seed marks the current version as seen — simulate a returning user on a
  // freshly-updated build by clearing that record.
  await page.evaluate((key) => localStorage.removeItem(key), VERSION_KEY);

  await page.getByRole('button', { name: /parent mode/i }).click();

  // Modal appears with the release content
  const modal = page.getByRole('dialog', { name: /what's new/i });
  await expect(modal).toBeVisible({ timeout: 5000 });
  await expect(modal.getByText('Points history for kids and parents')).toBeVisible();

  // Dismiss
  await modal.getByRole('button', { name: /got it/i }).click();
  await expect(modal).toBeHidden();

  // Re-entering Parent Mode does not show it again (version now recorded)
  await page.getByRole('button', { name: /back/i }).click();
  await page.getByRole('button', { name: /parent mode/i }).click();
  await expect(page.getByRole('dialog', { name: /what's new/i })).toHaveCount(0);
});

test('seeded (established) family does NOT see the modal', async ({ page }) => {
  // No version-key clearing — loadDemoData already marked it seen.
  await page.getByRole('button', { name: /parent mode/i }).click();
  await expect(page.getByRole('dialog', { name: /what's new/i })).toHaveCount(0);
});
