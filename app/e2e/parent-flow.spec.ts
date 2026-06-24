/**
 * Parent mode flow tests.
 */
import { test, expect } from '@playwright/test';
import { clearAppData, loadDemoData } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearAppData(page);
});

test('parent mode button is visible on profile picker', async ({ page }) => {
  await loadDemoData(page);
  await expect(page.getByRole('button', { name: /parent mode/i })).toBeVisible({ timeout: 5000 });
});

test('enter parent mode → dashboard', async ({ page }) => {
  await loadDemoData(page);
  await page.getByRole('button', { name: /parent mode/i }).click();
  await expect(page).toHaveURL(/\/parent/, { timeout: 5000 });
  await expect(page.getByText(/parent mode/i)).toBeVisible({ timeout: 5000 });
});

test('parent dashboard shows action tiles', async ({ page }) => {
  await loadDemoData(page);
  await page.getByRole('button', { name: /parent mode/i }).click();
  // Key action tiles should be visible
  await expect(page.getByText('New Task')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Rewards')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Give Bonus')).toBeVisible({ timeout: 5000 });
});

test('navigate to new task form', async ({ page }) => {
  await loadDemoData(page);
  await page.getByRole('button', { name: /parent mode/i }).click();
  await page.getByText('New Task').click();
  await expect(page).toHaveURL(/\/parent\/task\/new/, { timeout: 5000 });
  await expect(page.getByText(/new task/i)).toBeVisible({ timeout: 5000 });
});

test('app version is visible on parent dashboard', async ({ page }) => {
  await loadDemoData(page);
  await page.getByRole('button', { name: /parent mode/i }).click();
  // A "Jitsu Points · vYYYY.MM.DD.N" line should be readable in settings.
  await expect(page.getByText(/Jitsu Points · v\d{4}\.\d{2}\.\d{2}\.\d+/)).toBeVisible({
    timeout: 5000,
  });
});

test('theme switcher is visible on parent dashboard', async ({ page }) => {
  await loadDemoData(page);
  await page.getByRole('button', { name: /parent mode/i }).click();
  await expect(page.getByText(/app theme/i)).toBeVisible({ timeout: 5000 });
  // All 4 theme swatches
  await expect(page.getByRole('button', { name: /candy theme/i })).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: /berry theme/i })).toBeVisible({ timeout: 5000 });
});
