/**
 * Production smoke tests — run against the live Cloudflare Pages deployment.
 *
 * NON-DESTRUCTIVE: read-only navigation only. No demo seeding, no family
 * creation, no "Set up" click, no account login. Fresh context per test, so
 * nothing is written to the backend or any real family.
 *
 * Run: npx playwright test --config=playwright.prod.config.ts
 */
import { test, expect } from '@playwright/test';
import { APP_VERSION } from '../src/version';

test('app loads and serves the PWA shell', async ({ page }) => {
  const resp = await page.goto('/');
  expect(resp?.status(), 'root should return 2xx').toBeLessThan(400);
  await expect(page).toHaveTitle(/Jitsu/i, { timeout: 10000 });
});

test('live site serves the expected build version', async ({ page }) => {
  await page.goto('/');
  // Build version is stamped into index.html as <meta name="app-version"> at build time.
  const deployed = await page.locator('meta[name="app-version"]').getAttribute('content');
  expect(deployed, 'app-version meta tag should be present').toBeTruthy();
  expect(deployed).toMatch(/^\d{4}\.\d{2}\.\d{2}\.\d+$/);
  // Confirms the deploy/CDN is serving the build we just shipped (catches stale deploys).
  expect(deployed).toBe(APP_VERSION);
});

test('welcome screen renders with both onboarding actions', async ({ page }) => {
  await page.goto('/welcome');
  await expect(page.locator('h1, h2').filter({ hasText: /Jitsu/i })).toBeVisible({
    timeout: 10000,
  });
  // Note: /set up/i alone matches the Join button too ("Already set up?"), so be specific.
  await expect(page.getByRole('button', { name: /set up our family/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /join our family/i })).toBeVisible();
});

test('join screen renders the join-code form', async ({ page }) => {
  await page.goto('/join');
  await expect(page.getByRole('heading', { name: /join your family/i })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByPlaceholder(/TIGER-42/i)).toBeVisible();
});

test('demo-seed button is NOT present in production build', async ({ page }) => {
  // Confirms the prod bundle stripped the DEV-only seed hook — i.e. this is a
  // real production build, not a dev server.
  await page.goto('/welcome');
  await expect(page.getByTestId('load-demo-btn')).toHaveCount(0);
});

test('service worker / PWA manifest is served', async ({ page }) => {
  const resp = await page.request.get('/manifest.webmanifest').catch(() => null);
  // vite-plugin-pwa emits manifest.webmanifest; tolerate either name.
  const alt = resp && resp.ok() ? resp : await page.request.get('/manifest.json');
  expect(alt.ok(), 'a PWA manifest should be served').toBeTruthy();
});
