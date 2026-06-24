import { defineConfig, devices } from '@playwright/test';

/**
 * Jitsu Points — PRODUCTION smoke config.
 *
 * Targets the live Cloudflare Pages deployment. NON-DESTRUCTIVE only —
 * no data writes, no demo seeding, no account login. Each test runs in a
 * fresh browser context, so nothing touches real family data or the backend.
 *
 * Run: npx playwright test --config=playwright.prod.config.ts
 */
const PROD_URL = process.env.PROD_URL ?? 'https://jitsu-points.pages.dev';

export default defineConfig({
  testDir: './e2e',
  testMatch: /prod-smoke\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1, // tolerate transient network blips against a live URL
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: PROD_URL,
    trace: 'on-first-retry',
    viewport: { width: 390, height: 844 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],

  // No webServer — we hit the live deployment directly.
});
