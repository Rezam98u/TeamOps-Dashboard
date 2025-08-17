import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 5173',
    cwd: '../frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})


