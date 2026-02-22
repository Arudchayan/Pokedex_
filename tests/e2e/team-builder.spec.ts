import { test, expect } from '@playwright/test';

test('Full Team Builder Flow: Search, Add, DnD, Undo, Export', async ({ page }) => {
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  // 1. Navigate
  await page.goto('/');

  // Wait for app to load
  await expect(page.locator('input[type="search"]')).toBeVisible({ timeout: 10000 });

  // Check for error state
  const errorState = page.locator('text=Oops! Something went wrong');
  if (await errorState.isVisible()) {
    console.log('Error state detected! Clicking retry...');
    await page.getByRole('button', { name: 'Retry' }).click();
  }

  // Wait for data to load (wait for a specific pokemon like Bulbasaur)
  // This ensures the initial fetch is done and we aren't just seeing placeholders
  await page
    .locator('div[role="button"]')
    .filter({ hasText: 'Bulbasaur' })
    .first()
    .waitFor({ state: 'visible', timeout: 30000 });

  // Give UI a moment to settle after data load
  await page.waitForTimeout(1000);

  const searchInput = page.locator('#main-search');
  const teamBuilder = page.locator('aside[aria-label="Team builder"]');
  const addPokemonFromGrid = async (name: string) => {
    await searchInput.click();
    await searchInput.fill('');
    await page.keyboard.type(name);

    const pokemonCard = page.getByLabel(new RegExp(`View details for ${name}`, 'i')).first();
    await expect(pokemonCard).toBeVisible();

    const addButton = pokemonCard.locator('button', { hasText: /Add to team/i });
    await expect(addButton).toBeEnabled();
    // Avoid draggable parent interference in headless browsers by dispatching click directly.
    await addButton.dispatchEvent('click');

    await expect(teamBuilder).toContainText(new RegExp(name, 'i'));
  };

  // 2. Search & Add Pikachu
  await addPokemonFromGrid('Pikachu');

  // 3. Search & Add Charizard
  await addPokemonFromGrid('Charizard');

  // Check slots are present
  // TeamMemberSlot renders an <article> and has a drag handle button
  const pikachuArticle = teamBuilder.locator('article').filter({ hasText: /Pikachu/i });
  const charizardArticle = teamBuilder.locator('article').filter({ hasText: /Charizard/i });

  await expect(pikachuArticle).toBeVisible();
  await expect(charizardArticle).toBeVisible();

  // Identify drag handles
  // The handle has aria-label="Reorder {name}. Position {index}."
  // Position is 1-based index.
  // Using case-insensitive match because API data might be lowercase
  const pikachuHandle = page.getByLabel(/Reorder Pikachu/i).first();
  // Verify initial order (Pikachu top, Charizard bottom)
  const articlesBefore = await teamBuilder.locator('article').allInnerTexts();
  expect(articlesBefore[0]).toMatch(/Pikachu/i);
  expect(articlesBefore[1]).toMatch(/Charizard/i);

  // 4. DnD Reorder
  // Use keyboard for reliable DnD with @dnd-kit (since manual mouse events are flaky in headless)
  // Move Pikachu (top) down to Charizard (bottom)
  await pikachuHandle.focus();
  await expect(pikachuHandle).toBeFocused();
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.keyboard.press('Space');

  // Verify order changed
  // Note: Drag and drop might take a moment or animation
  await page.waitForTimeout(1000);
  const articlesAfter = await teamBuilder.locator('article').allInnerTexts();
  console.log('Articles after reorder:', articlesAfter);
  expect(articlesAfter[0]).toMatch(/Charizard/i);
  expect(articlesAfter[1]).toMatch(/Pikachu/i);

  // 5. Undo
  const undoButton = page.locator('button[title="Undo"]');
  await expect(undoButton).toBeEnabled();
  await undoButton.click();

  // Verify order reverted
  const articlesReverted = await teamBuilder.locator('article').allInnerTexts();
  expect(articlesReverted[0]).toMatch(/Pikachu/i);
  expect(articlesReverted[1]).toMatch(/Charizard/i);

  // 6. Export
  const exportButton = page.locator('button[title="Export Team"]');
  await exportButton.click();

  const exportModal = page.getByRole('dialog', { name: /Export Team/i });
  await expect(exportModal).toBeVisible();
  await expect(exportModal).toContainText('Copy this text to share your team');

  // Close modal to clean up (optional but good practice)
  await exportModal.getByRole('button', { name: 'Close' }).click();
  await expect(exportModal).not.toBeVisible();
});
