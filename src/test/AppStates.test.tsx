import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { renderWithProvider } from './utils';

const mockUsePokemon = vi.fn();

vi.mock('../context/PokemonContext', () => ({
  usePokemon: () => mockUsePokemon(),
  usePokemonUI: () => ({
    theme: mockUsePokemon().theme || 'dark',
    accent: 'cyan',
    isShiny: false,
    isCyberpunk: false,
  }),
  usePokemonData: () => mockUsePokemon(),
  usePokemonDispatch: () => ({ reload: vi.fn(), undo: vi.fn(), redo: vi.fn() }),
  PokemonProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn(), toasts: [] }),
  ToastProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../components/shared/Loader', () => ({
  default: () => <div>Loader</div>,
}));

vi.mock('../components/layout/SearchBar', () => ({
  default: () => <div>SearchBar</div>,
}));

vi.mock('../components/layout/FilterControls', () => ({
  default: () => <div>FilterControls</div>,
}));

vi.mock('../components/layout/SortingControls', () => ({
  default: () => <div>SortingControls</div>,
}));

vi.mock('../components/layout/PaginationControls', () => ({
  default: () => <div>Pagination</div>,
}));

vi.mock('../components/team/TeamBuilder', () => ({
  default: () => <div>TeamBuilder</div>,
}));

vi.mock('../components/pokemon/VirtualPokemonList', () => ({
  default: () => <div>VirtualPokemonList</div>,
}));

vi.mock('../components/shared/PokemonDetailView', () => ({
  default: () => <div>PokemonDetailView</div>,
}));

vi.mock('../components/layout/ThemeSelector', () => ({
  default: () => <div>ThemeSelector</div>,
}));

vi.mock('../services/soundService', () => ({
  playUISound: vi.fn(),
  toggleAudio: vi.fn(),
  isAudioEnabled: vi.fn(() => true),
}));

const baseState = {
  masterPokemonList: [],
  loading: false,
  error: null,
  searchTerm: '',
  selectedGeneration: 'all',
  selectedTypes: [],
  flavorTextSearch: '',
  currentPage: 1,
  team: [],
  favorites: new Set<number>(),
  comparisonList: [],
  sortBy: 'id',
  sortOrder: 'asc',
  theme: 'dark',
  isShiny: false,
  filteredPokemon: [],
  reload: vi.fn(),
  totalPages: 1,
} as const;

describe('App empty/error states', () => {
  beforeEach(() => {
    mockUsePokemon.mockReset();
  });

  it('shows the empty state when not loading and no error', () => {
    mockUsePokemon.mockReturnValue({
      ...baseState,
      loading: false,
      error: null,
      filteredPokemon: [],
    });

    renderWithProvider(<App />);

    expect(screen.getByText('No Pokemon match your filters')).toBeInTheDocument();
    expect(screen.queryByText('Oops! Something went wrong.')).not.toBeInTheDocument();
  });

  it('shows the error state with retry and hides the empty state', () => {
    const reload = vi.fn();
    mockUsePokemon.mockReturnValue({
      ...baseState,
      loading: false,
      error: 'Failed to fetch Pokemon data.',
      reload,
    });

    renderWithProvider(<App />);

    expect(screen.getByText('Oops! Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch Pokemon data.')).toBeInTheDocument();
    expect(screen.queryByText('No Pokemon match the current filters.')).not.toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
