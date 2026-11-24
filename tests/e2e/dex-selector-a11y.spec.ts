import { test, expect } from '@playwright/test';
import { skipWalkthroughOnboarding, dismissWelcomeModal } from './helpers';

const viewports = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

for (const { width, height } of viewports) {
  test(`Dex selector has an accessible name at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await skipWalkthroughOnboarding(page);
    await page.goto('/');
    await dismissWelcomeModal(page);

    const dexSelect = page.getByRole('combobox', { name: /dex/i });
    await expect(dexSelect).toBeVisible({ timeout: 30000 });
    await expect(dexSelect).toHaveValue('national');
    await expect(dexSelect).toHaveAccessibleName('Dex:');

    // The stat sort combobox keeps its own, distinct name.
    await expect(page.getByRole('combobox', { name: 'Sort by Stat' })).toBeVisible();

    // The visible label is associated with the select, not just decorative text.
    await page.getByText('Dex:', { exact: true }).click();
    await expect(dexSelect).toBeFocused();
  });
}
