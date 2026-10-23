import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { API_URL, WEB_URL } from './config';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  outputDir: './.artifacts/test-results',
  /* The suite shares one SQLite file, so it must not run in parallel. */
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: isCI
    ? [['github'], ['html', { outputFolder: './.artifacts/playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: './.artifacts/playwright-report', open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node e2e/scripts/start-api.mjs',
      cwd: root,
      url: `${API_URL}/api/v1/health`,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'node e2e/scripts/start-web.mjs',
      cwd: root,
      url: WEB_URL,
      reuseExistingServer: !isCI,
      timeout: 600_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
