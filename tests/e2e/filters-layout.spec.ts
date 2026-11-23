import { test, expect, type Locator, type Page } from '@playwright/test';
import { skipWalkthroughOnboarding } from './helpers';

const GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';
const STAT_NAMES = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

type MockPokemon = {
  id: number;
  name: string;
  pokemontypes: { type: { name: string } }[];
  pokemonspecy: { pokemonspeciesflavortexts: { flavor_text: string }[] };
  pokemonstats: { base_stat: number; stat: { name: string } }[];
  pokemonabilities: { ability: { name: string } }[];
};

const makePokemon = (id: number, name: string, types: string[]): MockPokemon => ({
  id,
  name,
  pokemontypes: types.map((type) => ({ type: { name: type } })),
  pokemonspecy: { pokemonspeciesflavortexts: [{ flavor_text: `${name} flavor text.` }] },
  pokemonstats: STAT_NAMES.map((stat) => ({ base_stat: 60, stat: { name: stat } })),
  pokemonabilities: [{ ability: { name: 'overgrow' } }],
});

const POKEMON_FIXTURE = [
  makePokemon(1, 'bulbasaur', ['grass', 'poison']),
  makePokemon(2, 'ivysaur', ['grass', 'poison']),
  makePokemon(3, 'venusaur', ['grass', 'poison']),
  makePokemon(4, 'charmander', ['fire']),
  makePokemon(5, 'charmeleon', ['fire']),
  makePokemon(6, 'charizard', ['fire', 'flying']),
  makePokemon(7, 'squirtle', ['water']),
  makePokemon(8, 'wartortle', ['water']),
];

/**
 * Answers the catalog request from a fixture and drops unrelated GraphQL calls,
 * so layout tests do not depend on the public API.
 */
const stubCatalogQuery = (page: Page, status: number, body: string) =>
  page.route(GRAPHQL_URL, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    let query = '';
    try {
      query = (route.request().postDataJSON() as { query?: string }).query ?? '';
    } catch {
      // A request without a JSON body cannot be the catalog query.
    }

    if (!query.includes('fetchAllPokemon')) {
      await route.abort();
      return;
    }

    await route.fulfill({ status, contentType: 'application/json', body });
  });

const mockCatalogQuery = (page: Page) =>
  stubCatalogQuery(page, 200, JSON.stringify({ data: { pokemon: POKEMON_FIXTURE } }));

const failCatalogQuery = (page: Page) =>
  stubCatalogQuery(page, 500, JSON.stringify({ errors: [{ message: 'Mock catalog failure' }] }));

async function loadHome(page: Page) {
  await skipWalkthroughOnboarding(page);
  await page.goto('/');
  await expect(page.locator('[aria-label^="View details for"]').first()).toBeAttached({
    timeout: 20000,
  });
}

/** Opens the compact Filters disclosure when the current breakpoint has one. */
async function expandFilters(page: Page) {
  const toggle = page.locator('button[aria-label^="Filters"]:visible').first();
  if ((await toggle.count()) === 0) return;

  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
}

async function expandAdvanced(page: Page) {
  const panel = page.locator('section[aria-label="Filters"]:visible').first();
  const advanced = panel.getByRole('button', { name: /Advanced \(Stats & Abilities\)/ });
  await expect(advanced).toHaveAttribute('aria-expanded', 'false');

  // Click without scrolling so the first-screen geometry stays meaningful.
  await advanced.evaluate((element) => (element as HTMLElement).click());
  await expect(advanced).toHaveAttribute('aria-expanded', 'true');
  await expect(panel.getByLabel('Ability')).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth + 1);
}

async function expectTopWithinViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, 'element should have a layout box').not.toBeNull();
  if (!box) return;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeLessThan(page.viewportSize()?.height ?? 0);
}

test.describe('expanded filters keep results visible on tablet widths', () => {
  for (const size of [
    { width: 768, height: 700 },
    { width: 912, height: 700 },
    { width: 1000, height: 700 },
    { width: 912, height: 626 },
  ]) {
    test(`results stay in the first viewport at ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size);
      await mockCatalogQuery(page);
      await loadHome(page);

      await expandFilters(page);
      await expandAdvanced(page);

      const filterPanel = page.locator('section[aria-label="Filters"]:visible').first();
      await expect(filterPanel).toBeVisible();
      await expectTopWithinViewport(page, filterPanel);

      await expectTopWithinViewport(page, page.getByRole('region', { name: 'Pokemon results' }));
      await expectTopWithinViewport(page, page.locator('[aria-label^="View details for"]').first());
      await expectNoHorizontalOverflow(page);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  }
});

test.describe('failed data keeps the error visible on tablet widths', () => {
  for (const size of [
    { width: 912, height: 700 },
    { width: 1000, height: 700 },
    { width: 912, height: 626 },
  ]) {
    test(`error stays in the first viewport at ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size);
      await failCatalogQuery(page);
      await skipWalkthroughOnboarding(page);

      await page.goto('/');
      await expandFilters(page);

      const errorHeading = page.getByText('Oops! Something went wrong.');
      await expect(errorHeading).toBeVisible({ timeout: 25000 });
      await expect(errorHeading).toHaveCount(1);
      await expect(page.getByRole('alert')).toHaveCount(1);
      await expectTopWithinViewport(page, errorHeading);
      await expectNoHorizontalOverflow(page);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  }
});

test('desktop layout at 1440 still stacks filters above results', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockCatalogQuery(page);
  await loadHome(page);

  await expect(page.locator('button[aria-label^="Filters"]:visible')).toHaveCount(0);
  const filterPanel = page.locator('section[aria-label="Filters"]:visible').first();
  await expect(filterPanel).toBeVisible();

  const filterBox = await filterPanel.boundingBox();
  const resultsBox = await page.getByRole('region', { name: 'Pokemon results' }).boundingBox();
  expect(filterBox).not.toBeNull();
  expect(resultsBox).not.toBeNull();
  if (!filterBox || !resultsBox) return;
  expect(resultsBox.y).toBeGreaterThanOrEqual(filterBox.y + filterBox.height);
  await expectTopWithinViewport(page, page.locator('[aria-label^="View details for"]').first());
  await expectNoHorizontalOverflow(page);
  await testInfo.attach('filters-layout-1440x900', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

test('mobile disclosure at 390 keeps its existing stacked behavior', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockCatalogQuery(page);
  await loadHome(page);

  const toggle = page.locator('button[aria-label^="Filters"]:visible').first();
  await expect(toggle).toHaveCount(1);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expectTopWithinViewport(page, page.locator('[aria-label^="View details for"]').first());

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  const filterPanel = page.locator('section[aria-label="Filters"]:visible').first();
  await expect(filterPanel).toBeVisible();
  const filterBox = await filterPanel.boundingBox();
  const resultsBox = await page.getByRole('region', { name: 'Pokemon results' }).boundingBox();
  expect(filterBox).not.toBeNull();
  expect(resultsBox).not.toBeNull();
  if (!filterBox || !resultsBox) return;
  expect(resultsBox.y).toBeGreaterThanOrEqual(filterBox.y + filterBox.height);
  await expectNoHorizontalOverflow(page);
  await testInfo.attach('filters-layout-390x844', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});
