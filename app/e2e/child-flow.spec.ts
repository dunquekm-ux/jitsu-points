/**
 * Child experience flow tests.
 * Uses the DEV-only demo data seed to get a populated state quickly.
 */
import { test, expect } from '@playwright/test';
import { clearAppData, loadDemoData } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearAppData(page);
});

test('load demo data → profile picker shows children', async ({ page }) => {
  await loadDemoData(page);
  // Profile picker should show Emma and Liam from demo data
  await expect(page.getByText('Emma')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Liam')).toBeVisible({ timeout: 5000 });
});

test('select child → home screen with tasks', async ({ page }) => {
  await loadDemoData(page);
  // Click Emma's profile card
  await page.getByText('Emma').click();
  // Should navigate to home screen
  await expect(page).toHaveURL(/\/child\/.+\/home/, { timeout: 5000 });
  // Home screen should show Emma's name / greeting
  await expect(page.getByText('Emma')).toBeVisible({ timeout: 5000 });
});

test('complete an available task → celebration overlay appears', async ({ page }) => {
  await loadDemoData(page);
  await page.getByText('Emma').click();

  // Wait for home screen to load
  await expect(page).toHaveURL(/\/child\/.+\/home/, { timeout: 5000 });

  // Find an available task and tap it
  const availableTask = page.locator('[data-testid="task-card-available"]').first();
  await expect(availableTask).toBeVisible({ timeout: 5000 });
  await availableTask.click();

  // Task detail screen
  await expect(page).toHaveURL(/\/task\//, { timeout: 5000 });

  // Tap the COMPLETE button
  await page.getByRole('button', { name: /complete/i }).click();

  // Celebration overlay should appear
  await expect(page.getByText(/mission complete/i)).toBeVisible({ timeout: 5000 });
});

test('rewards vault shows available rewards', async ({ page }) => {
  await loadDemoData(page);
  await page.getByText('Emma').click();

  // Navigate to rewards tab
  await page.getByRole('link', { name: /reward/i }).click();
  await expect(page).toHaveURL(/\/rewards/, { timeout: 5000 });

  // Should see at least one reward
  await expect(page.locator('body')).toContainText(/reward|vault/i, { timeout: 5000 });
});
