import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PaginationControls from '../../components/layout/PaginationControls';
import VirtualPokemonList from '../../components/pokemon/VirtualPokemonList';
import { POKEMON_PER_PAGE } from '../../constants';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver as any;

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('PaginationControls', () => {
  it('renders correctly', () => {
    render(
      <PaginationControls currentPage={1} totalPages={5} onPageChange={vi.fn()} theme="light" />
    );

    // Check for numbers which are definitely present
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByLabelText('Previous Page')).toBeDisabled();
    expect(screen.getByLabelText('Next Page')).toBeEnabled();

    // Check for "Page" text specifically in the span (ignoring buttons like "Last Page")
    const pageInfo = screen
      .getAllByText(/Page/)
      .find((el) => el.tagName.toLowerCase() === 'span' && el.textContent?.includes('Page'));
    expect(pageInfo).toBeInTheDocument();
  });

  it('calls onPageChange when buttons are clicked', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
        theme="light"
      />
    );

    fireEvent.click(screen.getByLabelText('Previous Page'));
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByLabelText('Next Page'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});

describe('VirtualPokemonList Pagination', () => {
  const mockPokemonList = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `pokemon-${i + 1}`,
    types: ['normal'],
    stats: [],
    imageUrl: '',
  }));

  const defaultProps = {
    pokemonList: mockPokemonList,
    viewMode: 'grid' as const,
    onSelect: vi.fn(),
    teamIds: new Set<number>(),
    teamIsFull: false,
    favorites: new Set<number>(),
    comparisonList: [],
    MAX_COMPARISON: 4,
    onAddToTeam: vi.fn(),
    onRemoveFromTeam: vi.fn(),
    onToggleFavorite: vi.fn(),
    onAddToComparison: vi.fn(),
    theme: 'light',
    isShiny: false,
  };

  it('shows pagination controls when enabled', () => {
    render(<VirtualPokemonList {...defaultProps} isPaginationEnabled={true} />);

    // Check for Pagination Controls
    expect(screen.getByLabelText('Previous Page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next Page')).toBeInTheDocument();

    // Should show first page items
    expect(screen.getByText('pokemon-1')).toBeInTheDocument();
    expect(screen.getByText(`pokemon-${POKEMON_PER_PAGE}`)).toBeInTheDocument();

    // Should NOT show second page items
    expect(screen.queryByText(`pokemon-${POKEMON_PER_PAGE + 1}`)).not.toBeInTheDocument();
  });

  it('does not show pagination controls when disabled', () => {
    render(<VirtualPokemonList {...defaultProps} isPaginationEnabled={false} />);

    // Check absence of Pagination Controls
    expect(screen.queryByLabelText('Previous Page')).not.toBeInTheDocument();
  });
});
