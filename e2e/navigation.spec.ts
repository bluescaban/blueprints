import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the BluePrints heading', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /BluePrints by Blue/i })
    ).toBeVisible();
  });

  test('should navigate to docs page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=View Documentation');
    await expect(page).toHaveURL('/docs');
    await expect(
      page.getByRole('heading', { name: /Documentation/i })
    ).toBeVisible();
  });
});

test.describe('Docs Page', () => {
  test('should display all documentation sections', async ({ page }) => {
    await page.goto('/docs');

    // Check for all expected sections
    await expect(
      page.getByRole('heading', {
        name: /BRD \(Business Requirements Document\)/i,
      })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /^Flows$/i })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Specs$/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /FlowSpec Output/i })
    ).toBeVisible();
  });

  test('should have a back to home link', async ({ page }) => {
    await page.goto('/docs');
    await page.click('text=← Back to Home');
    await expect(page).toHaveURL('/');
  });
});
