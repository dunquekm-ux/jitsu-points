/**
 * Phase 8 — Parent UX refinements.
 * Validates: points input fix (8.3), duplicate task (8.1), sortable task list (8.2).
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

// ─── 8.3 Points input ─────────────────────────────────────────────────────────
test('points field can be cleared and overtyped, and clamps on blur', async ({ page }) => {
  await page.getByText('New Task').click();
  await expect(page).toHaveURL(/\/parent\/task\/new/, { timeout: 5000 });

  const input = page.locator('input[type="number"]');
  await expect(input).toBeVisible();

  // Clearing must leave the field EMPTY (old bug snapped it back to "1")
  await input.click(); // onFocus selects all
  await page.keyboard.press('Backspace');
  await expect(input).toHaveValue('');

  // Typing a fresh value yields exactly that value (old bug prepended → "125")
  await page.keyboard.type('30');
  await expect(input).toHaveValue('30');

  // Over-max clamps down on blur
  await input.click();
  await page.keyboard.type('999');
  await input.blur();
  await expect(input).toHaveValue('500');

  // Empty on blur falls back to a valid value (not blank, not 0)
  await input.click();
  await page.keyboard.press('Backspace');
  await input.blur();
  await expect(input).not.toHaveValue('');
  await expect(input).not.toHaveValue('0');
});

// ─── 8.1 Duplicate task ────────────────────────────────────────────────────────
test('duplicate creates a distinct copy without touching the original', async ({ page }) => {
  const rows = page.getByTestId('parent-task-row');
  await expect(rows.first()).toBeVisible(); // wait for the list to render before counting
  const before = await rows.count();

  // Duplicate "Make Bed"
  const makeBedRow = rows.filter({ hasText: 'Make Bed' }).first();
  await makeBedRow.getByRole('button', { name: /duplicate/i }).click();

  await expect(page).toHaveURL(/\/parent\/task\/.+\/duplicate/, { timeout: 5000 });
  await expect(page.getByRole('heading', { name: /duplicate task/i })).toBeVisible();
  // Title pre-filled with "(copy)" suffix
  await expect(page.locator('input').first()).toHaveValue('Make Bed (copy)');
  // Saves via the create path
  const createBtn = page.getByRole('button', { name: /create task/i });
  await expect(createBtn).toBeEnabled();
  await createBtn.click();

  await expect(page).toHaveURL(/\/parent$/, { timeout: 5000 });
  // One more task than before, and the copy is visible alongside the original
  await expect(rows).toHaveCount(before + 1);
  await expect(page.getByText('Make Bed (copy)')).toBeVisible();
  await expect(page.getByText('Make Bed', { exact: true })).toBeVisible();
});

test('duplicating a past one-time task is blocked until the date is fixed', async ({ page }) => {
  // Build a one-time task dated in the past, then duplicate it.
  await page.getByText('New Task').click();
  await page.getByPlaceholder('e.g. Brush Teeth').fill('Old Event');
  // Make it a one-time task
  await page.getByRole('button', { name: /one time/i }).click();
  const dateInput = page.locator('input[type="date"]');
  await dateInput.fill('2020-01-01');
  // Should be blocked here too (validation is global)
  const warn = page.getByText(/in the past/i);
  await expect(warn).toBeVisible();
  await expect(page.getByRole('button', { name: /create task/i })).toBeDisabled();
});

// ─── 8.2 Sortable task list ─────────────────────────────────────────────────────
test('task list sorts by name and by points', async ({ page }) => {
  const titles = page.getByTestId('parent-task-title');

  // Default: Name ascending
  await expect(page.getByRole('button', { name: /^Name/ })).toBeVisible();
  const nameAsc = await titles.allInnerTexts();
  const sortedAsc = [...nameAsc].sort((a, b) => a.localeCompare(b));
  expect(nameAsc).toEqual(sortedAsc);

  // Switch to Points (defaults high→low) → top task should be the 20-pt "Do Homework"
  await page.getByRole('button', { name: /^Points/ }).click();
  await expect(titles.first()).toHaveText('Do Homework');

  // Flip direction → lowest first ("Brush Teeth", 5 pts)
  await page.getByRole('button', { name: /^Points/ }).click();
  await expect(titles.first()).toHaveText('Brush Teeth');
});
