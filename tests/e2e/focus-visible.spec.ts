import { test, expect, type Locator, type Page } from '@playwright/test';
import { skipWalkthroughOnboarding } from './helpers';
import { contrastRatio } from '../../src/test/contrast';

type Theme = 'light' | 'dark';

const THEMES: Theme[] = ['light', 'dark'];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
] as const;

/** Approximate page colours behind the chrome (see `body` in global.css). */
const PAGE_BACKDROP: Record<Theme, string> = {
  light: '#f8fafc',
  dark: '#0a0e1a',
};

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

async function seedTheme(page: Page, theme: Theme) {
  await skipWalkthroughOnboarding(page);
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
}

async function openApp(page: Page, theme: Theme, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await seedTheme(page, theme);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('header h1')).toBeVisible();
  await page.waitForFunction(
    (isDark) => document.documentElement.classList.contains('dark') === isDark,
    theme === 'dark'
  );
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

for (const theme of THEMES) {
  for (const { width } of VIEWPORTS) {
    test.describe(`focus visibility (${theme}, ${width}px)`, () => {
      test(`skip link is painted above the header with a ≥3:1 focus indicator`, async ({
        page,
      }) => {
        await openApp(page, theme, width);
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

        const header = page.getByRole('banner').first();
        const headerBackground = await header.evaluate(
          (element) => getComputedStyle(element).backgroundColor
        );
        const backdropHex = overBackdrop(headerBackground, PAGE_BACKDROP[theme]);
        expectVisibleRing(after, backdropHex);

        // The solid fill itself is the primary indicator for the first tab stop.
        const fillHex = overBackdrop(after.backgroundColor, backdropHex);
        expect(contrastRatio(fillHex, backdropHex)).toBeGreaterThanOrEqual(3);

        await test.info().attach('skip-link-focus', {
          body: await page.screenshot({ clip: { x: 0, y: 0, width: 360, height: 120 } }),
          contentType: 'image/png',
        });
      });

      test(`generation select shows a ≥3:1 keyboard focus ring`, async ({ page }) => {
        await openApp(page, theme, width);
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

        const fillHex = overBackdrop(after.backgroundColor, PAGE_BACKDROP[theme]);
        expectVisibleRing(after, fillHex);

        // The ring sits outside the control, over the filter panel.
        const panelBackground = await select.evaluate((element) => {
          const panel = element.closest('section');
          return panel ? getComputedStyle(panel).backgroundColor : 'rgba(0, 0, 0, 0)';
        });
        const panelHex = overBackdrop(panelBackground, PAGE_BACKDROP[theme]);
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

  test(`Tools menu items show a keyboard-only focus ring (${theme}, 1440px)`, async ({ page }) => {
    await openApp(page, theme, 1440);
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
    const first = await readFocusStyle(firstItem);
    expect(first.focusVisible).toBe(true);

    const menuBackground = await menu.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const menuHex = overBackdrop(menuBackground, PAGE_BACKDROP[theme]);
    expectVisibleRing(first, menuHex);

    await page.keyboard.press('ArrowDown');
    const secondItem = menu.getByRole('menuitem').nth(1);
    await expect(secondItem).toBeFocused();
    const second = await readFocusStyle(secondItem);
    expect(second.focusVisible).toBe(true);
    expectVisibleRing(second, menuHex);

    // The 2px ring plus 2px offset must stay inside the scrolling menu container.
    const geometry = await menu.evaluate((element) => {
      const items = Array.from(element.querySelectorAll<HTMLElement>('[role="menuitem"]'));
      const menuRect = element.getBoundingClientRect();
      return items.map((item) => {
        const style = getComputedStyle(item);
        const rect = item.getBoundingClientRect();
        const extent =
          Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset);
        return {
          top: rect.top - extent - menuRect.top,
          right: menuRect.right - (rect.right + extent),
          bottom: menuRect.bottom - (rect.bottom + extent),
          left: rect.left - extent - menuRect.left,
        };
      });
    });
    for (const item of geometry) {
      expect(item.top).toBeGreaterThanOrEqual(0);
      expect(item.right).toBeGreaterThanOrEqual(0);
      expect(item.bottom).toBeGreaterThanOrEqual(0);
      expect(item.left).toBeGreaterThanOrEqual(0);
    }

    await test.info().attach('tools-menu-focus', {
      body: await menu.screenshot(),
      contentType: 'image/png',
    });
  });
}
