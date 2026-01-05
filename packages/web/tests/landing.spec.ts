import { expect, test } from '@playwright/test';

test('landing page has expected title and links', async ({ page }) => {
  await page.goto('/');

  // Check title
  await expect(page).toHaveTitle(/Polagram/);

  // Check for Get Started button
  const getStartedLink = page.getByRole('link', { name: 'Get Started' });
  await expect(getStartedLink).toBeVisible();
  
  // Check for Playground button in navigation
  const playgroundLink = page.getByRole('navigation').getByRole('link', { name: 'Playground' });
  await expect(playgroundLink).toBeVisible();

  // Check for Master Diagram section
  await expect(page.getByRole('heading', { name: 'Master Diagram' })).toBeVisible();
});
