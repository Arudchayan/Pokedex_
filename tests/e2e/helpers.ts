import type { Page } from '@playwright/test';

/** Seed walkthrough progress so the welcome modal does not auto-open in e2e. */
export async function skipWalkthroughOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pokedex_walkthrough_v1',
      JSON.stringify({
        isFirstVisit: false,
        completedTours: [],
        currentTourId: null,
        currentStepIndex: 0,
        hasSkippedOnboarding: true,
        lastVisitAt: Date.now(),
        tourStartedAt: {},
      })
    );
  });
}

/** Fallback dismiss if a walkthrough dialog still appears. */
export async function dismissWelcomeModal(page: Page) {
  const welcomeModal = page
    .locator('div[role="dialog"]')
    .filter({ hasText: /Welcome to (Advanced )?Pokédex/i });
  try {
    await welcomeModal.waitFor({ state: 'visible', timeout: 2000 });
    const skipButton = welcomeModal.getByRole('button', { name: /Skip for now/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await welcomeModal.waitFor({ state: 'hidden', timeout: 3000 });
  } catch {
    // Modal didn't appear, continue
  }
}
