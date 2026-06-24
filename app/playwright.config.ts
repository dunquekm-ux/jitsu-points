import { defineConfig, devices } from '@playwright/test';

/**
 * Jitsu Points — Playwright E2E config.
 *
 * Starts the Vite dev server automatically before running tests.
 * Tests run against Chromium only (the primary PWA target).
 *
 * Run: npx playwright test
 * UI:  npx playwright test --ui
 */
export default defineConfig({
  testDir: './e2e',
  testIgnore: /prod-smoke\.spec\.ts/, // prod smoke runs via playwright.prod.config.ts only
  fullyParallel: false, // Tests share stateful browser storage — run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // Mobile viewport — this is a mobile-first app
    viewport: { width: 390, height: 844 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],

  // Automatically start the dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
