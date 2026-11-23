import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProvider } from '../../test/utils';
import MobileDrawer from './MobileDrawer';

const { openWalkthroughModalMock } = vi.hoisted(() => ({
  openWalkthroughModalMock: vi.fn(),
}));

vi.mock('../walkthrough/WalkthroughManager', () => ({
  openWalkthroughModal: openWalkthroughModalMock,
}));

describe('MobileDrawer mobile feature parity', () => {
  const onClose = vi.fn();
  const onRandomPokemon = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDrawer = () =>
    renderWithProvider(<MobileDrawer isOpen onClose={onClose} onRandomPokemon={onRandomPokemon} />);

  it('exposes the Theme control and Start Walkthrough entry', () => {
    renderDrawer();

    const themeGroup = screen.getByRole('group', { name: 'Theme' });
    expect(themeGroup).toHaveAttribute('data-tour', 'theme-mobile');
    expect(
      within(themeGroup).getByRole('button', { name: 'Customize theme settings' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Walkthrough' })).toBeInTheDocument();
  });

  it('opens the theme panel from the drawer', () => {
    renderDrawer();

    fireEvent.click(screen.getByRole('button', { name: 'Customize theme settings' }));

    expect(screen.getByText('Display Mode')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument();
  });

  it('starts the walkthrough and closes the drawer', () => {
    renderDrawer();

    fireEvent.click(screen.getByRole('button', { name: 'Start Walkthrough' }));

    expect(openWalkthroughModalMock).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('portals the drawer and backdrop out of the header through one root', () => {
    renderWithProvider(
      <header data-testid="host-header">
        <MobileDrawer isOpen onClose={onClose} onRandomPokemon={onRandomPokemon} />
      </header>
    );

    const header = screen.getByTestId('host-header');
    const root = screen.getByTestId('mobile-drawer-root');
    const drawer = screen.getByRole('dialog', { name: 'Navigation menu' });
    const backdrop = screen.getByTestId('mobile-drawer-backdrop');

    expect(header).not.toContainElement(root);
    expect(header).not.toContainElement(drawer);
    expect(header).not.toContainElement(backdrop);
    expect(drawer.closest('header')).toBeNull();
    expect(backdrop.closest('header')).toBeNull();

    expect(root.parentElement).toBe(document.body);
    expect(root).not.toHaveAttribute('class');
    expect(root).toContainElement(backdrop);
    expect(root).toContainElement(drawer);
    expect(backdrop.parentElement).toBe(root);
    expect(drawer.parentElement).toBe(root);

    expect(backdrop).toHaveClass('fixed', 'inset-0', 'z-drawer-backdrop');
    expect(drawer).toHaveClass('fixed', 'z-drawer');
  });

  it('closes when the portaled backdrop is clicked', () => {
    renderDrawer();

    fireEvent.click(screen.getByTestId('mobile-drawer-backdrop'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when the drawer panel is clicked', () => {
    renderDrawer();

    fireEvent.click(screen.getByRole('dialog', { name: 'Navigation menu' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps the closed drawer off-screen and hidden from assistive technology', () => {
    renderWithProvider(
      <MobileDrawer isOpen={false} onClose={onClose} onRandomPokemon={onRandomPokemon} />
    );

    const drawer = screen.getByLabelText('Navigation menu');

    expect(drawer).toHaveAttribute('aria-hidden', 'true');
    expect(drawer).toHaveClass('-translate-x-full');
    expect(screen.getByTestId('mobile-drawer-backdrop')).toHaveClass(
      'opacity-0',
      'pointer-events-none'
    );
  });
});
