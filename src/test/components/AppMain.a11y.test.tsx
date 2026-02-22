import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AppMain from '../../app/AppMain';
import type { AppController } from '../../app/useAppController';
import { PokemonListItem } from '../../types';

// Mock child components to isolate AppMain
vi.mock('../../components/pokemon/VirtualPokemonList', () => ({
  default: () => <div data-testid="virtual-list">Virtual List</div>
}));

vi.mock('../../components/team/TeamBuilder', () => ({
  default: () => <div data-testid="team-builder">Team Builder</div>
}));

vi.mock('../../components/layout/SortingControls', () => ({
  default: () => <div data-testid="sorting-controls">Sorting Controls</div>
}));

vi.mock('../../components/layout/FilterControls', () => ({
  default: () => <div data-testid="filter-controls">Filter Controls</div>
}));

vi.mock('../../components/base/SkeletonComposites', () => ({
  PokemonGridSkeleton: () => <div data-testid="skeleton">Loading...</div>
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
        return element?.tagName.toLowerCase() === 'p' && content.includes('Showing') && content.includes('Pokemon');
    });

    const statusContainer = statusText.closest('div');
    expect(statusContainer).toBeInTheDocument();

    // These assertions are expected to fail before implementation
    expect(statusContainer).toHaveAttribute('role', 'status');
    expect(statusContainer).toHaveAttribute('aria-live', 'polite');
    expect(statusContainer).toHaveAttribute('aria-atomic', 'true');
  });
});
