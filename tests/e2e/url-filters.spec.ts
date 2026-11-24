import { test, expect } from '@playwright/test';
import { skipWalkthroughOnboarding, dismissWelcomeModal } from './helpers';

test('?search and ?dex apply on a cold load', async ({ page }) => {
  await skipWalkthroughOnboarding(page);
  await page.goto('/?search=pikachu&dex=kanto');
  await dismissWelcomeModal(page);

  const searchInput = page.locator('#main-search');
  await expect(searchInput).toHaveValue('pikachu');

  await expect(page.getByLabel(/View details for Pikachu/i).first()).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByLabel(/View details for Bulbasaur/i)).toHaveCount(0);

  const dexSelect = page.locator('select').filter({ hasText: 'Kanto' });
  await expect(dexSelect).toHaveValue('kanto');
});
