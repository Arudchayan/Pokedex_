import { test, expect, type Page } from '@playwright/test';
import { skipWalkthroughOnboarding, dismissWelcomeModal } from './helpers';

const DRAWER_ROOT = '[data-testid="mobile-drawer-root"]';

async function loadApp(page: Page) {
  await skipWalkthroughOnboarding(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Pokedex' })).toBeVisible();
  await dismissWelcomeModal(page);
}

function drawerRoot(page: Page) {
  return page.locator(DRAWER_ROOT);
}

function drawerDialog(page: Page) {
  return page.locator('[role="dialog"][aria-label="Navigation menu"]');
}

async function openDrawerWithKeyboard(page: Page) {
  const trigger = page.getByRole('button', { name: 'Open navigation menu' });
  await trigger.focus();
  await page.keyboard.press('Enter');

  const dialog = drawerDialog(page);
  await expect(dialog).toHaveAttribute('aria-hidden', 'false');
  await expect(dialog.getByRole('button', { name: 'Move Dex' })).toBeFocused();

  return { trigger, dialog };
}

async function focusIsInsideDrawer(page: Page) {
  return page.evaluate((selector) => {
    const root = document.querySelector(selector);
    return !!root && root.contains(document.activeElement);
  }, DRAWER_ROOT);
}

async function bodyOverflow(page: Page) {
  return page.evaluate(() => document.body.style.overflow);
}

async function expectNoDrawerTabStop(page: Page, presses: number) {
  const visited: string[] = [];

  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });

  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate((selector) => {
      const root = document.querySelector(selector);
      const active = document.activeElement as HTMLElement | null;
      return {
        inDrawer: !!root && !!active && root.contains(active),
        label:
          active?.getAttribute('aria-label') ??
          active?.textContent?.trim().slice(0, 40) ??
          active?.tagName ??
          '',
      };
    }, DRAWER_ROOT);

    if (focused.inDrawer) visited.push(focused.label);
  }

  expect(visited).toEqual([]);
}

test.describe('mobile navigation drawer focus (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('closed drawer controls are inert and skipped by the keyboard', async ({ page }) => {
    await loadApp(page);

    const root = drawerRoot(page);
    const dialog = drawerDialog(page);

    await expect(root).toHaveAttribute('inert', '');
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(dialog).toHaveClass(/-translate-x-full/);

    await expectNoDrawerTabStop(page, 48);

    expect(await bodyOverflow(page)).toBe('');
  });

  test('opening traps Tab and Shift+Tab inside the drawer', async ({ page }) => {
    await loadApp(page);

    const { trigger, dialog } = await openDrawerWithKeyboard(page);
    const root = drawerRoot(page);

    expect(await root.evaluate((element) => element.hasAttribute('inert'))).toBe(false);
    await expect(page.locator('#root')).toHaveAttribute('inert', '');

    const close = dialog.getByRole('button', { name: 'Close menu' });
    const lastItem = dialog.getByRole('button', { name: 'Data Management' });

    // Move Dex -> Theme trigger -> Close menu, then wrap backwards to the last item.
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(close).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(lastItem).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();

    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      expect(await focusIsInsideDrawer(page)).toBe(true);
    }

    await expect(trigger).not.toBeFocused();
  });

  test('Escape and Close restore focus to the trigger and unlock scrolling', async ({ page }) => {
    await loadApp(page);

    const firstOpen = await openDrawerWithKeyboard(page);
    expect(await bodyOverflow(page)).toBe('hidden');

    await page.keyboard.press('Escape');

    await expect(firstOpen.dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(firstOpen.trigger).toBeFocused();
    await expect(drawerRoot(page)).toHaveAttribute('inert', '');
    expect(await bodyOverflow(page)).toBe('');

    const secondOpen = await openDrawerWithKeyboard(page);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(secondOpen.dialog.getByRole('button', { name: 'Close menu' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(secondOpen.dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(secondOpen.trigger).toBeFocused();
    expect(await bodyOverflow(page)).toBe('');
  });

  test('backdrop click closes the drawer and restores focus', async ({ page }) => {
    await loadApp(page);

    const { trigger, dialog } = await openDrawerWithKeyboard(page);

    await page.getByTestId('mobile-drawer-backdrop').click({ position: { x: 370, y: 400 } });

    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(trigger).toBeFocused();
    await expect(drawerRoot(page)).toHaveAttribute('inert', '');
    expect(await bodyOverflow(page)).toBe('');
  });

  test('the theme popover stays inside the trap', async ({ page }) => {
    await loadApp(page);

    const { trigger, dialog } = await openDrawerWithKeyboard(page);

    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('button', { name: 'Light' })).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Light' })).toBeFocused();

    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      expect(await focusIsInsideDrawer(page)).toBe(true);
    }

    await page.keyboard.press('Escape');

    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(trigger).toBeFocused();
    expect(await bodyOverflow(page)).toBe('');
  });
});

test.describe('desktop navigation drawer focus (1440x900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('closed drawer controls are inert and skipped by the keyboard', async ({ page }) => {
    await loadApp(page);

    const root = drawerRoot(page);
    const dialog = drawerDialog(page);

    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden();
    await expect(dialog).toBeHidden();
    await expect(root).toHaveAttribute('inert', '');
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');

    await expectNoDrawerTabStop(page, 48);

    expect(await bodyOverflow(page)).toBe('');
  });
});
