import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AppMain from '../../app/AppMain';
import type { AppController } from '../../app/useAppController';
import { PokemonListItem } from '../../types';

// Mock child components to isolate AppMain. The skeleton is intentionally left
// unmocked so the tests can audit the real loading accessibility tree.
vi.mock('../../components/pokemon/VirtualPokemonList', () => ({
  default: () => <div data-testid="virtual-list">Virtual List</div>,
}));

vi.mock('../../components/team/TeamBuilder', () => ({
  default: () => <div data-testid="team-builder">Team Builder</div>,
}));

vi.mock('../../components/layout/SortingControls', () => ({
  default: () => <div data-testid="sorting-controls">Sorting Controls</div>,
}));

vi.mock('../../components/layout/FilterControls', () => ({
  default: () => <div data-testid="filter-controls">Filter Controls</div>,
}));

const mockPokemon: PokemonListItem = {
  id: 1,
  name: 'Bulbasaur',
  imageUrl: 'url',
  shinyImageUrl: 'url',
  types: ['grass', 'poison'],
  flavorText: 'flavor',
  stats: [],
  abilities: [],
};

const mockController: AppController = {
  loading: false,
  error: null,
  searchTerm: '',
  selectedGeneration: 'all',
  selectedTypes: [],
  flavorTextSearch: '',
  team: [],
  teamPokemon: [],
  teamIds: new Set(), // Added
  teamIsFull: false, // Added
  favorites: new Set(),
  comparisonList: [],
  comparisonPokemon: [],
  sortBy: 'id',
  sortOrder: 'asc',
  theme: 'light',
  isShiny: false,
  isCyberpunk: false,
  filteredPokemon: [mockPokemon],
  virtualList: [mockPokemon],
  TEAM_CAPACITY: 6,
  MAX_COMPARISON: 5,
  reload: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: false,
  canRedo: false,
  audioEnabled: true,
  viewMode: 'grid',
  isPaginationEnabled: false,
  searchInputRef: { current: null },
  setViewMode: vi.fn(),
  setIsPaginationEnabled: vi.fn(),
  selectedPokemonId: null,
  setSelectedPokemonId: vi.fn(),
  showMenu: false,
  toggleMenu: vi.fn(),
  closeMenu: vi.fn(),
  // Add other modal props as needed or cast as any if too many
  ...({} as any),
  handleSelectPokemon: vi.fn(),
  handleCloseDetail: vi.fn(),
  handleNext: vi.fn(),
  handlePrevious: vi.fn(),
  handleToggleFavorite: vi.fn(),
  handleToggleAudio: vi.fn(),
  handleToggleShiny: vi.fn(),
  handleRandomPokemon: vi.fn(),
  handleFocusSearch: vi.fn(),
  handleSortChange: vi.fn(),
  handleOrderChange: vi.fn(),
  handleGenerationChange: vi.fn(),
  handleTypeToggle: vi.fn(),
  handleFlavorTextChange: vi.fn(),
  handleClearFilters: vi.fn(),
  handleAddToTeam: vi.fn(),
  handleRemoveFromTeam: vi.fn(),
  handleClearTeam: vi.fn(),
  handleUpdateTeamMember: vi.fn(),
  handleLoadTeam: vi.fn(),
  handleRandomizeTeam: vi.fn(),
  handleReorderTeam: vi.fn(),
  handleAddToComparison: vi.fn(),
  handleRemoveFromComparison: vi.fn(),
} as unknown as AppController;

describe('AppMain Accessibility', () => {
  it('renders results count with live region attributes', () => {
    render(<AppMain controller={mockController} />);

    // Find the element containing "Showing" and the count
    const statusText = screen.getByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === 'p' &&
        content.includes('Showing') &&
        content.includes('Pokemon')
      );
    });

    const statusContainer = statusText.closest('div');
    expect(statusContainer).toBeInTheDocument();

    // These assertions are expected to fail before implementation
    expect(statusContainer).toHaveAttribute('role', 'status');
    expect(statusContainer).toHaveAttribute('aria-live', 'polite');
    expect(statusContainer).toHaveAttribute('aria-atomic', 'true');
  });

  it('exposes exactly one loading status and hides the decorative skeleton', () => {
    const { container } = render(
      <AppMain
        controller={{
          ...mockController,
          loading: true,
          error: null,
          filteredPokemon: [],
          virtualList: [],
        }}
      />
    );

    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveTextContent('Loading Pokemon...');

    // Raw DOM check: the previous implementation rendered a status per skeleton piece.
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(container.querySelectorAll('[role="status"][aria-label="Loading..."]')).toHaveLength(0);
    expect(container.querySelectorAll('[role="status"] [role="status"]')).toHaveLength(0);

    const resultsRegion = screen.getByRole('region', { name: 'Pokemon results' });
    expect(resultsRegion).toHaveAttribute('aria-busy', 'true');
    expect(within(resultsRegion).queryAllByRole('status')).toHaveLength(0);

    const skeletonPieces = resultsRegion.querySelectorAll('.animate-shimmer, .animate-pulse');
    expect(skeletonPieces.length).toBeGreaterThan(0);
    skeletonPieces.forEach((piece) => {
      expect(piece.closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  it('clears aria-busy when loading finishes', () => {
    render(<AppMain controller={mockController} />);

    expect(screen.getByRole('region', { name: 'Pokemon results' })).toHaveAttribute(
      'aria-busy',
      'false'
    );
  });

  it('announces a failed load once through a non-empty alert', () => {
    render(
      <AppMain
        controller={{ ...mockController, loading: false, error: 'Failed to fetch Pokemon data.' }}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Oops! Something went wrong.');
    expect(within(alert).getByText('Failed to fetch Pokemon data.')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);

    // The loading status stays empty so it cannot double-announce the failure.
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('moves focus from Retry to the loading status, then to the alert on failure', () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    const errorController: AppController = {
      ...mockController,
      loading: false,
      error: 'Failed to fetch Pokemon data.',
      reload,
    };

    const { rerender } = render(<AppMain controller={errorController} />);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    retryButton.focus();
    fireEvent.click(retryButton);
    expect(reload).toHaveBeenCalledTimes(1);

    rerender(<AppMain controller={{ ...errorController, loading: true, error: null }} />);

    const loadingStatus = screen.getByRole('status');
    expect(loadingStatus).toHaveTextContent('Loading Pokemon...');
    expect(loadingStatus).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);

    rerender(<AppMain controller={errorController} />);

    expect(screen.getByRole('alert')).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
  });

  it('does not steal focus on an ordinary successful load', () => {
    const outsideButton = document.createElement('button');
    document.body.appendChild(outsideButton);
    outsideButton.focus();

    const { rerender } = render(
      <AppMain controller={{ ...mockController, loading: true, error: null }} />
    );
    expect(outsideButton).toHaveFocus();

    rerender(<AppMain controller={mockController} />);

    expect(outsideButton).toHaveFocus();
    outsideButton.remove();
  });
});
