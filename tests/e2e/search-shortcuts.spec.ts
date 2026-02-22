import { test, expect } from '@playwright/test';

test('Search shortcut focuses input and clear resets query', async ({ page }) => {
  await page.goto('/');

  const searchInput = page.locator('#main-search');
  await expect(searchInput).toBeVisible({ timeout: 10000 });

  const errorState = page.locator('text=Oops! Something went wrong');
  if (await errorState.isVisible()) {
    await page.getByRole('button', { name: 'Retry' }).click();
  }

  await page
    .locator('div[role="button"]')
    .filter({ hasText: 'Bulbasaur' })
    .first()
    .waitFor({ state: 'visible', timeout: 30000 });

  await page.keyboard.press('/');
  await expect(searchInput).toBeFocused();

  await searchInput.fill('Pikachu');
  await expect(page.getByLabel(/View details for Pikachu/i).first()).toBeVisible();

  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(searchInput).toHaveValue('');
});
