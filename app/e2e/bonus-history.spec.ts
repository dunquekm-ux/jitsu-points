/**
 * Phase 8.10–8.13 — bonus/demerit feedback flow.
 *
 *  - 8.10 Parent sees a confirmation toast after giving a bonus.
 *  - 8.11 The child's bonus popup is derived from persisted data, so it shows
 *         reliably and survives a reload (and only stops once acknowledged).
 *  - 8.12 Child "My Points Story" history.
 *  - 8.13 Parent per-child audit screen.
 *
 * Clock pinned to a morning window so Emma's demo tasks resolve to "available".
 */
import { test, expect } from '@playwright/test';
import { clearAppData, loadDemoData } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-06-24T08:00:00') });
  await page.goto('/');
  await clearAppData(page);
  await loadDemoData(page);
});

test('parent sees a confirmation toast after giving a bonus', async ({ page }) => {
  await page.getByRole('button', { name: /parent mode/i }).click();
  await expect(page).toHaveURL(/\/parent$/, { timeout: 5000 });

  await page.getByText('Give Bonus').click();
  await expect(page).toHaveURL(/\/parent\/bonus/, { timeout: 5000 });

  await page.getByRole('button', { name: /emma/i }).click();
  await page.getByRole('button', { name: '+25' }).click();
  await page.getByRole('button', { name: /give bonus/i }).click();

  // Back on the dashboard with a confirmation toast naming the child + amount.
  await expect(page).toHaveURL(/\/parent$/, { timeout: 5000 });
  const toast = page.getByTestId('parent-toast');
  await expect(toast).toBeVisible({ timeout: 5000 });
  await expect(toast).toContainText('Emma');
  await expect(toast).toContainText('25');
});

test('child reliably sees a new bonus and it survives a reload until dismissed', async ({ page }) => {
  // Give Emma a fresh bonus from Parent Mode.
  await page.getByRole('button', { name: /parent mode/i }).click();
  await page.getByText('Give Bonus').click();
  await page.getByRole('button', { name: /emma/i }).click();
  await page.getByRole('button', { name: '+25' }).click();
  await page.getByPlaceholder(/great attitude/i).fill('Big test win');
  await page.getByRole('button', { name: /give bonus/i }).click();
  await expect(page).toHaveURL(/\/parent$/, { timeout: 5000 });

  // Go to Emma's home — the bonus celebration should appear.
  await page.getByRole('button', { name: /back/i }).click();
  await page.getByRole('button', { name: /select emma/i }).click();
  await expect(page).toHaveURL(/\/child\/[^/]+$/, { timeout: 5000 });
  await expect(page.getByText(/surprise bonus/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Big test win')).toBeVisible();

  // Reload WITHOUT dismissing — it must still be there (persisted, not in-memory).
  await page.reload();
  await expect(page.getByText(/surprise bonus/i)).toBeVisible({ timeout: 5000 });

  // Dismiss → acknowledged. After a reload it should no longer appear.
  await page.getByRole('button', { name: /woohoo/i }).click();
  await expect(page.getByText(/surprise bonus/i)).toBeHidden();
  await page.reload();
  await expect(page).toHaveURL(/\/child\/[^/]+$/, { timeout: 5000 });
  await expect(page.getByText(/surprise bonus/i)).toHaveCount(0);
});

test('child can open their points history (My Points Story)', async ({ page }) => {
  await page.getByRole('button', { name: /select emma/i }).click();
  await expect(page).toHaveURL(/\/child\/[^/]+$/, { timeout: 5000 });

  await page.getByRole('button', { name: /history/i }).click();
  await expect(page).toHaveURL(/\/history$/, { timeout: 5000 });
  await expect(page.getByText(/my points story/i)).toBeVisible({ timeout: 5000 });

  // The demo seed includes a "Great week!" bonus for Emma.
  await expect(page.getByTestId('history-list')).toBeVisible();
  await expect(page.getByText('Great week!')).toBeVisible();
});

test('parent can open a child audit log from the dashboard', async ({ page }) => {
  await page.getByRole('button', { name: /parent mode/i }).click();
  await expect(page).toHaveURL(/\/parent$/, { timeout: 5000 });

  await page.getByTitle("View Emma's history").click();
  await expect(page).toHaveURL(/\/parent\/child\//, { timeout: 5000 });
  await expect(page.getByText(/emma's history/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('history-list')).toBeVisible();
  await expect(page.getByText('Great week!')).toBeVisible();

  // Quick action present.
  await expect(page.getByRole('button', { name: /give bonus/i })).toBeVisible();
});
