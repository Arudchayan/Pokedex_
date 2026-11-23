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
});
