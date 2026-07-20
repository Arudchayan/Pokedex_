import { test, expect } from '@playwright/test';

async function dismissWelcomeModal(page: import('@playwright/test').Page) {
  const welcomeModal = page
    .locator('div[role="dialog"]')
    .filter({ hasText: /Welcome to Pokédex/i });
  try {
    await welcomeModal.waitFor({ state: 'visible', timeout: 3000 });
    const skipButton = welcomeModal.locator('button', { hasText: /Skip for now/i });
    await skipButton.click();
    await welcomeModal.waitFor({ state: 'hidden', timeout: 3000 });
  } catch {
    // Modal didn't appear, continue
  }
}

test('Detail deep-link opens Pikachu from ?pokemon=25', async ({ page }) => {
  await page.goto('/?pokemon=25');
  await dismissWelcomeModal(page);

  // Detail dialog: while loading it uses aria-label "Pokemon details";
  // after load it is labelled by the Pikachu heading.
  const detailDialog = page.locator('div[role="dialog"]').filter({
    has: page.getByRole('heading', { name: /Pikachu/i }),
  });

  await expect(
    page
      .locator('div[role="dialog"]')
      .filter({ hasText: /Loading details|Pokemon details/i })
      .or(detailDialog)
      .first()
  ).toBeVisible({ timeout: 15000 });

  await expect(detailDialog).toBeVisible({ timeout: 30000 });
  await expect(detailDialog.getByRole('heading', { name: /Pikachu/i })).toBeVisible();
  await expect(page).toHaveTitle(/Pikachu/i);
});

test('Compare deep-link opens comparison from ?compare=1,4', async ({ page }) => {
  await page.goto('/?compare=1,4');
  await dismissWelcomeModal(page);

  const comparisonDialog = page.getByRole('dialog', { name: /Pokemon Comparison/i });
  await expect(comparisonDialog).toBeVisible({ timeout: 30000 });

  // Bulbasaur (#1) and Charmander (#4) once comparison data resolves
  await expect(comparisonDialog).toContainText(/Bulbasaur/i, { timeout: 30000 });
  await expect(comparisonDialog).toContainText(/Charmander/i, { timeout: 30000 });
});
