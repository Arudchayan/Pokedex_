import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { renderWithProvider } from '../../test/utils';
import { useModalStore } from '../../store/useModalStore';
import AppHeader from './AppHeader';

// Mock ThemeSelector to avoid context issues
vi.mock('./ThemeSelector', () => ({
  default: () => <div data-testid="mock-theme-selector" />,
}));

describe('AppHeader', () => {
  // Modal/menu state lives in a global Zustand store, so reset it between tests.
  beforeEach(() => {
    useModalStore.getState().closeAll();
  });

  it('keeps the brand wordmark intact and hides the subtitle until large screens', () => {
    renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

    const wordmark = screen.getByRole('heading', { level: 1, name: 'Pokédex' });
    expect(wordmark).toHaveClass('whitespace-nowrap', 'sm:text-4xl', 'lg:text-5xl');

    const brand = wordmark.parentElement?.parentElement;
    expect(brand).toHaveClass('md:shrink-0', 'lg:shrink');

    const subtitle = screen.getByText(
      'Explore every species with instant filtering, encounter data, and team analytics.'
    );
    expect(subtitle).toHaveClass('hidden', 'lg:block');
  });

  it('renders the Random Pokemon button with correct accessibility attributes', () => {
    renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

    // Now we can find it by its accessible name
    const randomButton = screen.getByRole('button', { name: 'Random Pokemon' });
    expect(randomButton).toBeInTheDocument();
    expect(randomButton).toHaveAttribute('title', 'Random Pokemon (Shift + R)');
  });

  it('bounds the Tools menu to the viewport and keeps every destination in the scroll container', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Tools' }));
    const menu = await screen.findByRole('menu', { name: 'Tools' });

    // The menu itself is the bounded scroll container: 100dvh minus the sticky
    // header/margin offset, so it can never run past the bottom of the viewport.
    expect(menu).toHaveClass('max-h-[calc(100dvh-8rem)]');
    expect(menu).toHaveClass('overflow-y-auto');
    expect(menu).toHaveClass('overscroll-contain');

    const items = within(menu).getAllByRole('menuitem');
    expect(items).toHaveLength(16);
    expect(items[0]).toHaveTextContent('Move Dex');

    // Previously unreachable destinations stay inside the scroll container.
    const lastItem = screen.getByRole('menuitem', { name: 'View on GitHub' });
    expect(menu).toContainElement(lastItem);
    expect(items[items.length - 1]).toBe(lastItem);
    expect(screen.getByRole('menuitem', { name: 'Achievements' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Start Walkthrough' })).toBeInTheDocument();
  });

  /**
   * Opens the Tools menu and resolves once the first item owns focus (the
   * header focuses it on the animation frame after opening).
   */
  const openToolsMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Tools' }));
    const menu = await screen.findByRole('menu', { name: 'Tools' });
    const items = within(menu).getAllByRole('menuitem');
    await waitFor(() => expect(items[0]).toHaveFocus());
    return { menu, items };
  };

  it('moves focus between menu items with ArrowDown/ArrowUp and wraps at both ends', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

    const { items } = await openToolsMenu(user);

    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(items[2]).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(items[1]).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(items[0]).toHaveFocus();

    // Wrapping: Up from the first item lands on the last one, Down comes back.
    await user.keyboard('{ArrowUp}');
    expect(items[items.length - 1]).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(items[0]).toHaveFocus();

    // Arrow navigation must not dismiss the menu.
    expect(screen.getByRole('menu', { name: 'Tools' })).toBeInTheDocument();
  });

  it('jumps to the first and last menu items with Home and End', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

    const { items } = await openToolsMenu(user);

    await user.keyboard('{End}');
    expect(items[items.length - 1]).toHaveFocus();
    expect(items[items.length - 1]).toHaveTextContent('View on GitHub');

    await user.keyboard('{Home}');
    expect(items[0]).toHaveFocus();
    expect(items[0]).toHaveTextContent('Move Dex');
  });

  it('activates the focused calculator with Enter and closes the menu', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

    const { menu, items } = await openToolsMenu(user);
    const damageCalcItem = within(menu).getByRole('menuitem', { name: 'Damage Calculator' });

    for (let i = 0; i < items.indexOf(damageCalcItem); i += 1) {
      await user.keyboard('{ArrowDown}');
    }
    expect(damageCalcItem).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(useModalStore.getState().showDamageCalc).toBe(true);
    expect(useModalStore.getState().showMenu).toBe(false);
    expect(screen.queryByRole('menu', { name: 'Tools' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tools' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('lets Tab leave the menu so focus is never trapped', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

    const { menu, items } = await openToolsMenu(user);

    await user.keyboard('{End}');
    expect(items[items.length - 1]).toHaveFocus();

    await user.tab();

    expect(menu).not.toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole('button', { name: /Shiny Mode/ })).toHaveFocus();
  });

  it('closes on Escape and restores focus to the Tools trigger', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: 'Tools' });
    const { items } = await openToolsMenu(user);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu', { name: 'Tools' })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  describe('mobile navigation drawer', () => {
    const openDrawer = async (user: ReturnType<typeof userEvent.setup>) => {
      const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
      await user.click(trigger);
      const dialog = await screen.findByRole('dialog', { name: 'Navigation menu' });
      await waitFor(() =>
        expect(within(dialog).getByRole('button', { name: 'Move Dex' })).toHaveFocus()
      );
      return { trigger, dialog };
    };

    it('moves focus inside and keeps Tab and Shift+Tab within the drawer', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

      const { dialog } = await openDrawer(user);
      const first = within(dialog).getByRole('button', { name: 'Close menu' });
      const last = within(dialog).getByRole('button', { name: 'Data Management' });

      last.focus();
      await user.tab();
      expect(first).toHaveFocus();

      await user.tab({ shift: true });
      expect(last).toHaveFocus();

      for (let i = 0; i < 12; i += 1) {
        await user.tab();
        expect(dialog.contains(document.activeElement)).toBe(true);
      }
    }, 15000);

    it('restores focus to the trigger after Escape and the Close control', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

      const firstOpen = await openDrawer(user);

      await user.keyboard('{Escape}');
      await waitFor(() => expect(firstOpen.trigger).toHaveFocus());
      expect(firstOpen.dialog).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('mobile-drawer-root')).toHaveAttribute('inert');

      const secondOpen = await openDrawer(user);
      await user.click(within(secondOpen.dialog).getByRole('button', { name: 'Close menu' }));

      await waitFor(() => expect(secondOpen.trigger).toHaveFocus());
      expect(secondOpen.dialog).toHaveAttribute('aria-hidden', 'true');
    });

    it('keeps the closed drawer inert and hidden from assistive technology', () => {
      renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

      const root = screen.getByTestId('mobile-drawer-root');

      expect(root).toHaveAttribute('inert');
      expect(within(root).getByLabelText('Navigation menu')).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
