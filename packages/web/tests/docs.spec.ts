import { expect, test } from '@playwright/test';

test('docs page navigation and sidebar', async ({ page }) => {
  await page.goto('/docs');

  // Sidebar should be visible
  const sidebar = page.locator('aside');
  await expect(sidebar).toBeVisible();

  // Check for Introduction link
  const introLink = sidebar.getByRole('link', { name: 'Introduction' });
  await expect(introLink).toBeVisible();

  // Check for Getting Started section in sidebar
  const gettingStartedHeader = sidebar.getByRole('heading', { name: 'Getting Started' });
  await expect(gettingStartedHeader).toBeVisible();
});
