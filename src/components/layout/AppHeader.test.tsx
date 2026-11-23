import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProvider } from '../../test/utils';
import AppHeader from './AppHeader';

// Mock ThemeSelector to avoid context issues
vi.mock('./ThemeSelector', () => ({
  default: () => <div data-testid="mock-theme-selector" />,
}));

describe('AppHeader', () => {
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
});
