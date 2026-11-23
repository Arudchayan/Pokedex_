import { test, expect, type Page } from '@playwright/test';
import { skipWalkthroughOnboarding } from './helpers';

const HEADER_WIDTHS = [768, 900, 950, 1000, 1024] as const;

interface HeaderGeometry {
  wordmark: {
    text: string;
    boxWidth: number;
    textWidth: number;
    scrollWidth: number;
    clientWidth: number;
  };
  subtitle: {
    display: string;
    visibility: string;
    scrollWidth: number;
    clientWidth: number;
    scrollHeight: number;
    clientHeight: number;
    right: number;
  } | null;
  documentScrollWidth: number;
  viewportWidth: number;
}

/** Read the header brand geometry in the browser, including the painted text range. */
async function readHeaderGeometry(page: Page): Promise<HeaderGeometry> {
  return page.evaluate(() => {
    const wordmark = document.querySelector<HTMLElement>('header h1');
    if (!wordmark) throw new Error('Header wordmark not found');

    const subtitle = document.querySelector<HTMLElement>('header h1 + p');
    const range = document.createRange();
    range.selectNodeContents(wordmark);

    const wordmarkRect = wordmark.getBoundingClientRect();
    const textRect = range.getBoundingClientRect();
    const subtitleStyle = subtitle ? getComputedStyle(subtitle) : null;

    return {
      wordmark: {
        text: wordmark.textContent ?? '',
        boxWidth: wordmarkRect.width,
        textWidth: textRect.width,
        scrollWidth: wordmark.scrollWidth,
        clientWidth: wordmark.clientWidth,
      },
      subtitle:
        subtitle && subtitleStyle
          ? {
              display: subtitleStyle.display,
              visibility: subtitleStyle.visibility,
              scrollWidth: subtitle.scrollWidth,
              clientWidth: subtitle.clientWidth,
              scrollHeight: subtitle.scrollHeight,
              clientHeight: subtitle.clientHeight,
              right: subtitle.getBoundingClientRect().right,
            }
          : null,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

for (const width of HEADER_WIDTHS) {
  test(`header wordmark is not clipped at ${width}px`, async ({ page }) => {
    await skipWalkthroughOnboarding(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('header h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const geometry = await readHeaderGeometry(page);
    const { wordmark, subtitle } = geometry;

    // Every character of the wordmark stays inside its painted (background-clip: text) box.
    expect(wordmark.scrollWidth).toBeLessThanOrEqual(wordmark.clientWidth + 1);
    expect(wordmark.textWidth).toBeLessThanOrEqual(wordmark.boxWidth + 1);
    expect(wordmark.text).toBe('Pokédex');

    // The subtitle is either hidden outright or fully painted inside the viewport.
    if (subtitle?.display === 'none' || subtitle?.visibility === 'hidden') {
      await expect(page.locator('header h1 + p')).toBeHidden();
    } else {
      expect(subtitle).not.toBeNull();
      expect(subtitle!.scrollWidth).toBeLessThanOrEqual(subtitle!.clientWidth + 1);
      expect(subtitle!.scrollHeight).toBeLessThanOrEqual(subtitle!.clientHeight + 1);
      expect(subtitle!.right).toBeLessThanOrEqual(geometry.viewportWidth);
      await expect(page.locator('header h1 + p')).toBeVisible();
    }

    expect(geometry.documentScrollWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  });
}
