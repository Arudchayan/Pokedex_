import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProvider } from '../../test/utils';
import AppHeader from './AppHeader';

// Mock ThemeSelector to avoid context issues
vi.mock('./ThemeSelector', () => ({
  default: () => <div data-testid="mock-theme-selector" />,
}));

describe('AppHeader', () => {
  const mockProps = {
    theme: 'light' as const,
    isCyberpunk: false,
    isShiny: false,
    audioEnabled: true,
    comparisonListLength: 0,
    searchTerm: '',
    onSearchChange: vi.fn(),
    onToggleShiny: vi.fn(),
    onToggleAudio: vi.fn(),
    onRandomPokemon: vi.fn(),
    onToggleMenu: vi.fn(),
    onCloseMenu: vi.fn(),
    onShowMoveDex: vi.fn(),
    onShowAbilityDex: vi.fn(),
    onShowItemDex: vi.fn(),
    onShowBreedingCalc: vi.fn(),
    onShowNatureChart: vi.fn(),
    onShowTypeChart: vi.fn(),
    onShowDataManagement: vi.fn(),
    onShowGameHub: vi.fn(),
    onShowBattleCalc: vi.fn(),
    onShowStatCalc: vi.fn(),
    onShowShinyCalc: vi.fn(),
    onShowComparison: vi.fn(),
    onShowAchievements: vi.fn(),
    showMenu: false,
  };

  it('renders the Random Pokemon button with correct accessibility attributes', () => {
    renderWithProvider(<AppHeader {...mockProps} />);

    // Now we can find it by its accessible name
    const randomButton = screen.getByRole('button', { name: 'Random Pokemon' });
    expect(randomButton).toBeInTheDocument();
    expect(randomButton).toHaveAttribute('title', 'Random Pokemon (Shift + R)');
  });
});
