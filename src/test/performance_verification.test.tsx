import React from 'react';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { renderWithProvider, setPokeapiServiceMock } from './utils';
import App from '../App';

// Mock IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
    root: Element | Document | null = null;
    rootMargin: string = '';
    thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as any;
});

// Mock TeamBuilder to track renders
const TeamBuilderMock = vi.fn((props) => <div data-testid="team-builder-mock">TeamBuilder</div>);

vi.mock('../components/team/TeamBuilder', () => ({
  default: React.memo((props: any) => {
    TeamBuilderMock(props);
    return <div data-testid="team-builder-mock">TeamBuilder</div>;
  }),
}));

// Mock lazy components
vi.mock('../components/games/GameHub', () => ({ default: () => null }));
vi.mock('../components/calculators/DamageCalculator', () => ({ default: () => null }));
vi.mock('../components/calculators/BreedingCalculator', () => ({ default: () => null }));
vi.mock('../components/calculators/StatCalculator', () => ({ default: () => null }));
vi.mock('../components/charts/ComparisonView', () => ({ default: () => null }));
vi.mock('../components/calculators/ShinyOddsCalculator', () => ({ default: () => null }));
vi.mock('../components/dex/MoveDex', () => ({ default: () => null }));
vi.mock('../components/dex/AbilityDex', () => ({ default: () => null }));
vi.mock('../components/dex/ItemDex', () => ({ default: () => null }));
vi.mock('../components/charts/NatureChart', () => ({ default: () => null }));
vi.mock('../components/charts/TypeChart', () => ({ default: () => null }));
vi.mock('../components/shared/DataManagement', () => ({ default: () => null }));

describe('App Performance', () => {
  beforeEach(() => {
    TeamBuilderMock.mockClear();
    setPokeapiServiceMock();
  });

  it('should not re-render TeamBuilder when search term changes', async () => {
    renderWithProvider(<App />);

    // Wait for initial load and data
    await screen.findByRole('heading', { name: /Pokedex/i });
    // Wait for loading to vanish to ensure data is loaded and filteredPokemon populated
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    await screen.findByTestId('team-builder-mock');

    const initialRenderCount = TeamBuilderMock.mock.calls.length;
    console.log('Initial Render Count:', initialRenderCount);

    // Type in search bar
    const searchInput = screen.getByPlaceholderText(/Search Pokemon.../i);

    // Change input to something that matches (so hasFilteredPokemon boolean doesn't flip)
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Bulba' } });
    });

    // Wait a bit for state updates
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    console.log('Final Render Count:', TeamBuilderMock.mock.calls.length);

    // Expect no extra renders
    expect(TeamBuilderMock.mock.calls.length).toBe(initialRenderCount);
  });

  it('should still randomize team correctly', async () => {
    renderWithProvider(<App />);
    await screen.findByRole('heading', { name: /Pokedex/i });
    // Wait for data load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    await screen.findByTestId('team-builder-mock');

    // Get the last call props
    const lastCall = TeamBuilderMock.mock.calls[TeamBuilderMock.mock.calls.length - 1][0];
    const { onRandomize, team } = lastCall;

    expect(team.length).toBe(0); // Initially empty

    // Call randomize
    await act(async () => {
      onRandomize();
    });

    // Wait for update
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Check new props
    const newLastCall = TeamBuilderMock.mock.calls[TeamBuilderMock.mock.calls.length - 1][0];
    const { team: newTeam } = newLastCall;

    // Should have added pokemon (Team Capacity is 6, we have 2 filtered pokemon in mock)
    expect(newTeam.length).toBeGreaterThan(0);
  });
});
