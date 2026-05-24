/**
 * Smoke tests — app loads correctly in all key states.
 */
import { test, expect } from '@playwright/test';
import { clearAppData } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearAppData(page);
});

test('fresh install → shows welcome screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1, h2').filter({ hasText: /Jitsu/i })).toBeVisible({ timeout: 8000 });
  // WelcomeScreen has the two action buttons
  await expect(page.getByRole('button', { name: /set up/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /join/i })).toBeVisible();
});

test('welcome screen → navigate to family setup', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /set up/i }).click();
  // Should land on FamilySetup (/setup route)
  await expect(page).toHaveURL(/\/setup/, { timeout: 5000 });
});

test('welcome screen → navigate to join family', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /join/i }).click();
  await expect(page).toHaveURL(/\/join/, { timeout: 5000 });
});

test('page title is correct', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Jitsu/i, { timeout: 8000 });
});
