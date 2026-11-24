import { test, expect, type Locator, type Page } from '@playwright/test';
import { skipWalkthroughOnboarding } from './helpers';
import { contrastRatio } from '../../src/test/contrast';

type Scheme = 'light' | 'dark' | 'cyberpunk';

interface SchemeSettings {
  theme: 'light' | 'dark';
  accent: 'cyan' | 'neonCyan';
  darkClass: boolean;
  cyberClass: boolean;
}

const SCHEMES: Scheme[] = ['light', 'dark', 'cyberpunk'];
const SCHEME_SETTINGS: Record<Scheme, SchemeSettings> = {
  light: { theme: 'light', accent: 'cyan', darkClass: false, cyberClass: false },
  dark: { theme: 'dark', accent: 'cyan', darkClass: true, cyberClass: false },
  cyberpunk: { theme: 'light', accent: 'neonCyan', darkClass: false, cyberClass: true },
};
const VIEWPORTS = [
  { width: 390, height: 900 },
  { width: 1440, height: 900 },
] as const;

/** Approximate page colours behind the chrome (see `body` in global.css). */
const PAGE_BACKDROP: Record<Scheme, string> = {
  light: '#f1f5f9',
  dark: '#0a0e1a',
  // The cyberpunk skin darkens the header/body backdrop, but the light theme's
  // content shell (and the sort controls on it) stays light.
  cyberpunk: '#f1f5f9',
};
/** The cyberpunk header is a dark gradient even when the app theme is light. */
const CYBER_HEADER_BACKDROP = '#141428';

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseCssColor(value: string): Rgba | null {
  const match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/.exec(
    value.trim()
  );
  if (!match) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4]),
  };
}

function hexToRgba(hex: string): Rgba {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
    a: 1,
  };
}

function composite(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
    a,
  };
}

function toHex(color: Rgba): string {
  return `#${[color.r, color.g, color.b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Composite a possibly translucent computed colour over an opaque backdrop. */
function overBackdrop(color: string, backdropHex: string): string {
  const fg = parseCssColor(color);
  if (!fg) return backdropHex;
  return toHex(composite(fg, hexToRgba(backdropHex)));
}

async function seedScheme(page: Page, scheme: Scheme) {
  await skipWalkthroughOnboarding(page);
  const settings = SCHEME_SETTINGS[scheme];
  await page.addInitScript((value) => {
    localStorage.setItem('theme', value.theme);
    localStorage.setItem('accent', value.accent);
  }, settings);
}

async function openApp(page: Page, scheme: Scheme, width: number, height = 900) {
  const settings = SCHEME_SETTINGS[scheme];
  await page.setViewportSize({ width, height });
  await seedScheme(page, scheme);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('header h1')).toBeVisible({ timeout: 15000 });
  await page.waitForFunction((expected) => {
    const classes = document.documentElement.classList;
    return (
      classes.contains('dark') === expected.darkClass &&
      classes.contains('cyberpunk') === expected.cyberClass
    );
  }, settings);
}

interface FocusStyle {
  outlineStyle: string;
  outlineWidth: string;
  outlineColor: string;
  outlineOffset: string;
  backgroundColor: string;
  boxShadow: string;
  focusVisible: boolean;
}

function readFocusStyle(locator: Locator): Promise<FocusStyle> {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      backgroundColor: style.backgroundColor,
      boxShadow: style.boxShadow,
      focusVisible: element.matches(':focus-visible'),
    };
  });
}

function readActiveFocusStyle(page: Page): Promise<FocusStyle & { label: string }> {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element) throw new Error('no active element');
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      backgroundColor: style.backgroundColor,
      boxShadow: style.boxShadow,
      focusVisible: element.matches(':focus-visible'),
      label: element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '',
    };
  });
}

/** Tab until the predicate sees the active element; returns false if it never does. */
async function tabUntil(page: Page, predicate: () => boolean, maxTabStops = 60): Promise<boolean> {
  for (let index = 0; index < maxTabStops; index += 1) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(predicate)) return true;
  }
  return false;
}

function expectVisibleRing(style: FocusStyle, backdropHex: string) {
  expect(style.outlineStyle).toBe('solid');
  expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
  const outline = parseCssColor(style.outlineColor);
  expect(outline?.a).toBeGreaterThan(0);

  const ringHex = overBackdrop(style.outlineColor, backdropHex);
  expect(contrastRatio(ringHex, backdropHex)).toBeGreaterThanOrEqual(3);
}

async function chromeBackdrop(page: Page, scheme: Scheme): Promise<string> {
  if (scheme === 'cyberpunk') return CYBER_HEADER_BACKDROP;
  const background = await page
    .getByRole('banner')
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  return overBackdrop(background, PAGE_BACKDROP[scheme]);
}

for (const scheme of SCHEMES) {
  for (const { width } of VIEWPORTS) {
    test.describe(`focus visibility (${scheme}, ${width}px)`, () => {
      test(`skip link is painted above the header with a ≥3:1 focus indicator`, async ({
        page,
      }) => {
        await openApp(page, scheme, width);
        const link = page.getByRole('link', { name: 'Skip to content' });

        const before = await readFocusStyle(link);
        await page.keyboard.press('Tab');
        await expect(link).toBeFocused();
        const after = await readFocusStyle(link);

        // The focused state must differ from the unfocused (visually hidden) state.
        expect(after).not.toEqual(before);
        expect(after.focusVisible).toBe(true);

        const hitTest = await page.evaluate(() => {
          const element = document.querySelector<HTMLElement>('a[href="#main-content"]');
          const header = document.querySelector<HTMLElement>('header');
          if (!element || !header) throw new Error('skip link or header missing');
          const rect = element.getBoundingClientRect();
          const hit = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          );
          return {
            hitIsLink: hit === element,
            linkZ: Number(getComputedStyle(element).zIndex),
            headerZ: Number(getComputedStyle(header).zIndex),
            width: rect.width,
            height: rect.height,
          };
        });

        // The link must be hit-testable (not covered by the sticky header).
        expect(hitTest.hitIsLink).toBe(true);
        expect(hitTest.linkZ).toBeGreaterThan(hitTest.headerZ);
        expect(hitTest.width).toBeGreaterThan(0);
        expect(hitTest.height).toBeGreaterThan(0);

        const backdropHex = await chromeBackdrop(page, scheme);
        expectVisibleRing(after, backdropHex);

        // The solid fill itself is the primary indicator for the first tab stop.
        const fillHex = overBackdrop(after.backgroundColor, backdropHex);
        expect(contrastRatio(fillHex, backdropHex)).toBeGreaterThanOrEqual(3);

        // Cyberpunk keeps the header dark in light theme, so the link switches
        // to a white fill with a cyan ring instead of the light-theme pair.
        if (scheme === 'cyberpunk') {
          expect(parseCssColor(after.outlineColor)).toEqual({ r: 103, g: 232, b: 249, a: 1 });
        }

        await test.info().attach('skip-link-focus', {
          body: await page.screenshot({ clip: { x: 0, y: 0, width: 360, height: 120 } }),
          contentType: 'image/png',
        });
      });

      test(`generation select shows a ≥3:1 keyboard focus ring`, async ({ page }) => {
        await openApp(page, scheme, width);
        let select = page.locator('select[id*="generation-select"]:visible');

        if (width < 640) {
          const opened = await tabUntil(
            page,
            () =>
              document.activeElement?.getAttribute('aria-label') === 'Filters' &&
              document.activeElement?.tagName === 'BUTTON'
          );
          expect(opened).toBe(true);
          await page.keyboard.press('Enter');
          await expect(select).toBeVisible();
        }

        const before = await readFocusStyle(select);

        const reached = await tabUntil(page, () =>
          Boolean(document.activeElement?.matches('select[id*="generation-select"]'))
        );
        expect(reached).toBe(true);
        await expect(select).toBeFocused();

        const after = await readFocusStyle(select);
        expect(after).not.toEqual(before);
        expect(after.focusVisible).toBe(true);

        const fillHex = overBackdrop(after.backgroundColor, PAGE_BACKDROP[scheme]);
        expectVisibleRing(after, fillHex);

        // The ring sits outside the control, over the filter panel.
        const panelBackground = await select.evaluate((element) => {
          const panel = element.closest('section');
          return panel ? getComputedStyle(panel).backgroundColor : 'rgba(0, 0, 0, 0)';
        });
        const panelHex = overBackdrop(panelBackground, PAGE_BACKDROP[scheme]);
        expectVisibleRing(after, panelHex);

        const box = await select.boundingBox();
        await test.info().attach('generation-select-focus', {
          body: await page.screenshot({
            clip: {
              x: Math.max(0, box!.x - 12),
              y: Math.max(0, box!.y - 12),
              width: Math.min(width, box!.width + 24),
              height: 90,
            },
          }),
          contentType: 'image/png',
        });
      });
    });
  }

  test(`Tools menu items show a keyboard-only focus ring (${scheme}, 1440x700)`, async ({
    page,
  }) => {
    await openApp(page, scheme, 1440, 700);
    const trigger = page.getByRole('button', { name: 'Tools', exact: true });

    // Mouse-opened menus focus the first item without painting a keyboard ring.
    await trigger.click();
    const menu = page.getByRole('menu', { name: 'Tools' });
    await expect(menu).toBeVisible();
    const firstItem = menu.getByRole('menuitem').first();
    await expect(firstItem).toBeFocused();
    const mouseFocus = await readFocusStyle(firstItem);
    expect(mouseFocus.focusVisible).toBe(false);
    expect(mouseFocus.outlineStyle).toBe('none');

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    // Re-open from the keyboard: Escape restored focus to the trigger.
    await page.keyboard.press('Enter');
    await expect(firstItem).toBeFocused();

    const scrollState = await menu.evaluate((element) => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
    }));
    expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);

    const items = menu.getByRole('menuitem');
    await expect(items).toHaveCount(16);

    const menuBackground = await menu.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const menuHex = overBackdrop(menuBackground, PAGE_BACKDROP[scheme]);
    const expectedRing =
      scheme === 'dark' ? { r: 255, g: 255, b: 255, a: 1 } : { r: 15, g: 23, b: 42, a: 1 };

    for (let index = 0; index < 16; index += 1) {
      const item = items.nth(index);
      await expect(item).toBeFocused();

      const style = await readFocusStyle(item);
      expect(style.focusVisible).toBe(true);
      expect(parseCssColor(style.outlineColor)).toEqual(expectedRing);
      expectVisibleRing(style, menuHex);

      // The ring + offset must clear the scrolling menu edge by at least 4px.
      const clearance = await item.evaluate((element) => {
        const menuElement = element.closest('[role="menu"]') as HTMLElement | null;
        if (!menuElement) throw new Error('menu container missing');
        const menuRect = menuElement.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        const itemStyle = getComputedStyle(element);
        const extent =
          Number.parseFloat(itemStyle.outlineWidth) + Number.parseFloat(itemStyle.outlineOffset);
        return Math.min(
          rect.top - extent - menuRect.top,
          menuRect.right - (rect.right + extent),
          menuRect.bottom - (rect.bottom + extent),
          rect.left - extent - menuRect.left
        );
      });
      expect(clearance).toBeGreaterThanOrEqual(4);

      if (index < 15) {
        await page.keyboard.press('ArrowDown');
      }
    }

    const lastItem = items.last();
    await expect(lastItem).toBeFocused();
    await expect(lastItem).toHaveText('View on GitHub');
    expect(await menu.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

    await test.info().attach('tools-menu-focus', {
      body: await menu.screenshot(),
      contentType: 'image/png',
    });
  });

  test(`Tools, Shiny, Mute and sort controls show focus rings (${scheme}, 1440px)`, async ({
    page,
  }) => {
    await openApp(page, scheme, 1440);
    const headerBackdrop = await chromeBackdrop(page, scheme);
    const pageBackdrop = PAGE_BACKDROP[scheme];

    const targets = [
      {
        name: 'Tools',
        find: () => document.activeElement?.getAttribute('aria-label') === 'Tools',
        backdrop: headerBackdrop,
      },
      {
        name: 'Shiny',
        find: () => /Shiny Mode/i.test(document.activeElement?.getAttribute('aria-label') ?? ''),
        backdrop: headerBackdrop,
      },
      {
        name: 'Mute',
        find: () => /sounds/i.test(document.activeElement?.getAttribute('aria-label') ?? ''),
        backdrop: headerBackdrop,
      },
    ];

    for (const target of targets) {
      const reached = await tabUntil(page, target.find, 20);
      expect(reached, `${target.name} should be reachable with Tab`).toBe(true);
      const style = await readActiveFocusStyle(page);
      expect(style.focusVisible, `${target.name} should match :focus-visible`).toBe(true);
      expectVisibleRing(style, target.backdrop);
    }

    const firstSortReached = await tabUntil(
      page,
      () =>
        Boolean(
          document.activeElement?.matches('div[role="group"][aria-labelledby] button[aria-pressed]')
        ),
      30
    );
    expect(firstSortReached).toBe(true);

    for (let index = 0; index < 4; index += 1) {
      const style = await readActiveFocusStyle(page);
      expect(style.focusVisible, `sort button ${index + 1} should match :focus-visible`).toBe(true);
      expectVisibleRing(style, pageBackdrop);
      if (index < 3) {
        await page.keyboard.press('Tab');
      }
    }

    const statSelectReached = await tabUntil(
      page,
      () => document.activeElement?.getAttribute('aria-label') === 'Sort by Stat',
      10
    );
    expect(statSelectReached).toBe(true);
    expectVisibleRing(await readActiveFocusStyle(page), pageBackdrop);

    const dexSelectReached = await tabUntil(
      page,
      () => {
        const element = document.activeElement as HTMLSelectElement | null;
        return Boolean(
          element &&
          element.tagName === 'SELECT' &&
          Array.from(element.labels ?? []).some((label) => label.textContent?.trim() === 'Dex:')
        );
      },
      10
    );
    expect(dexSelectReached).toBe(true);
    expectVisibleRing(await readActiveFocusStyle(page), pageBackdrop);

    const orderToggleReached = await tabUntil(
      page,
      () => /^Switch to /.test(document.activeElement?.getAttribute('aria-label') ?? ''),
      10
    );
    expect(orderToggleReached).toBe(true);
    expectVisibleRing(await readActiveFocusStyle(page), pageBackdrop);
  });
}
