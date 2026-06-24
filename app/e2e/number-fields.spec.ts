/**
 * Shared NumberField behaviour on the Bonus and Demerit composers
 * (same fix as the points field — clearable, overtype, clamp on blur).
 */
import { test, expect } from '@playwright/test';
import { clearAppData, loadDemoData } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await clearAppData(page);
  await loadDemoData(page);
  await page.getByRole('button', { name: /parent mode/i }).click();
  await expect(page).toHaveURL(/\/parent/, { timeout: 5000 });
});

test('bonus amount can be cleared, overtyped, and clamps to max on blur', async ({ page }) => {
  await page.getByText('Give Bonus').click();
  await expect(page).toHaveURL(/\/parent\/bonus/, { timeout: 5000 });

  const input = page.locator('input[type="number"]');
  await expect(input).toBeVisible();

  // Clear → empty (old bug snapped to "1")
  await input.click();
  await page.keyboard.press('Backspace');
  await expect(input).toHaveValue('');

  // Overtype cleanly (old bug prepended → "135")
  await page.keyboard.type('35');
  await expect(input).toHaveValue('35');

  // Quick-pick chip updates the field
  await page.getByRole('button', { name: '+50' }).click();
  await expect(input).toHaveValue('50');

  // Over-max clamps down on blur (max 999)
  await input.click();
  await page.keyboard.type('9999');
  await input.blur();
  await expect(input).toHaveValue('999');
});

test('demerit amount clears, overtypes, and clamps to the −20 cap on blur', async ({ page }) => {
  await page.getByText('Give Demerit').click();
  await expect(page).toHaveURL(/\/parent\/demerit/, { timeout: 5000 });

  const input = page.locator('input[type="number"]');
  await expect(input).toBeVisible();

  await input.click();
  await page.keyboard.press('Backspace');
  await expect(input).toHaveValue('');

  await page.keyboard.type('15');
  await expect(input).toHaveValue('15');

  // Typing above the cap clamps to MAX_DEMERIT (20) on blur
  await input.click();
  await page.keyboard.type('99');
  await input.blur();
  await expect(input).toHaveValue('20');
});
