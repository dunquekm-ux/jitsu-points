/**
 * 8.9 — Child Home task-list sorting (Name / Points), applied within state groups.
 *
 * Clock pinned to a morning window so Emma's demo tasks resolve to "available":
 *   Brush Teeth (5 pts, 07:00–09:00) and Make Bed (10 pts, 07:30–09:30).
 */
import { test, expect } from '@playwright/test';
import { clearAppData, loadDemoData } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-06-24T08:00:00') });
  await page.goto('/');
  await clearAppData(page);
  await loadDemoData(page);
  await page.getByText('Emma').click();
  await expect(page).toHaveURL(/\/child\/[^/]+$/, { timeout: 5000 });
});

test('child can sort missions by name and points, within the available group', async ({ page }) => {
  const available = page.getByTestId('task-card-available');
  await expect(available.first()).toBeVisible({ timeout: 5000 });

  // Sort control is present (more than one mission today)
  await expect(page.getByRole('button', { name: /^Name/ })).toBeVisible();

  // Default Name A–Z → "Brush Teeth" before "Make Bed"
  await expect(available.first()).toContainText('Brush Teeth');

  // Points (defaults high→low) → "Make Bed" (10) first
  await page.getByRole('button', { name: /^Points/ }).click();
  await expect(available.first()).toContainText('Make Bed');

  // Flip → low→high → "Brush Teeth" (5) first
  await page.getByRole('button', { name: /^Points/ }).click();
  await expect(available.first()).toContainText('Brush Teeth');
});
