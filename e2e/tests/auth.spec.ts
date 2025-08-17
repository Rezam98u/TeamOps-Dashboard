import { test, expect } from '@playwright/test'

test.describe('Auth', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
  })
})


