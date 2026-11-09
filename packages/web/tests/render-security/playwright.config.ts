import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['render-security.spec.ts', 'preview-smoke.spec.ts'],
  workers: 1,
  expect: { timeout: 3_000 },
  reporter: 'list',
  outputDir: '/tmp/polagram-render-results',
  use: {
    baseURL: 'http://127.0.0.1:4178',
    browserName: 'chromium',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
  },
  webServer: {
    command: 'node server.mjs',
    url: 'http://127.0.0.1:4178/tests/render-security/index.html',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
