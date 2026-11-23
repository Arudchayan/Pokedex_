import { test, expect, type Page } from '@playwright/test';
import { skipWalkthroughOnboarding } from './helpers';

async function openGameHub(page: Page) {
  await page.getByRole('button', { name: 'Tools', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Game Hub' }).click();
  await expect(page.getByRole('heading', { name: 'Game Suite' })).toBeVisible();
}

test('explains the outage and disables games that need Pokémon data', async ({ page }) => {
  await skipWalkthroughOnboarding(page);
  await page.route('**/graphql.pokeapi.co/**', (route) => route.abort('failed'));
  await page.goto('/');

  await expect(page.getByText('Failed to fetch Pokemon data.')).toBeVisible({ timeout: 45000 });
  await openGameHub(page);

  const hub = page.getByRole('dialog', { name: 'Game Suite' });
  await expect(hub.getByText('Game data is unavailable')).toBeVisible();
  await expect(page.locator('[data-game="whosthat"]')).toBeDisabled();
  await expect(page.locator('[data-game="move"]')).toBeEnabled();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Game Suite' })).toHaveCount(0);
});

test('Escape leaves a loaded game and restores focus to its card', async ({ page }) => {
  await skipWalkthroughOnboarding(page);
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /View details for Bulbasaur/i }).first()
  ).toBeVisible({ timeout: 45000 });
  await openGameHub(page);

  await page.locator('[data-game="whosthat"]').click();
  const game = page.getByRole('dialog', { name: /Who's That Pokémon\? game/ });
  await expect(game.getByRole('button', { name: 'Need a Hint?' })).toBeVisible({ timeout: 20000 });

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Game Suite' })).toBeVisible();
  await expect(page.locator('[data-game="whosthat"]')).toBeFocused();
});

test('bounds a game whose data never resolves and lets the player leave', async ({ page }) => {
  await skipWalkthroughOnboarding(page);
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /View details for Bulbasaur/i }).first()
  ).toBeVisible({ timeout: 45000 });

  // The list loaded; make every later detail request fail so the game never becomes ready.
  await page.route('**/graphql.pokeapi.co/**', (route) => route.abort('failed'));
  await openGameHub(page);

  await page.locator('[data-game="pokedle"]').click();
  const game = page.getByRole('dialog', { name: /Pokédle game/ });
  await expect(game.getByRole('button', { name: 'Back to games' })).toBeVisible();
  await expect(game.getByRole('status')).toHaveCount(1);

  await expect(game.getByRole('alert')).toBeVisible({ timeout: 20000 });
  await expect(game.getByRole('button', { name: 'Retry' })).toBeFocused();

  await game.getByRole('button', { name: 'Back to games' }).click();
  await expect(page.getByRole('heading', { name: 'Game Suite' })).toBeVisible();
  await expect(page.locator('[data-game="pokedle"]')).toBeFocused();
});
