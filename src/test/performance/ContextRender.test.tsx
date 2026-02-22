import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PokemonProvider, usePokemon, usePokemonUI } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';

// Mock Sound Service
vi.mock('../../services/soundService', () => ({
  playUISound: vi.fn(),
  isAudioEnabled: vi.fn().mockReturnValue(true),
}));

// Mock fetchAllPokemons
vi.mock('../../services/pokeapiService', () => ({
  fetchAllPokemons: vi.fn().mockResolvedValue([]),
  fetchAllItems: vi.fn().mockResolvedValue([]),
  fetchAllMoves: vi.fn().mockResolvedValue([]),
}));

const Trigger = () => {
  return (
    <button
      data-testid="trigger-btn"
      onClick={() => usePokemonStore.getState().setSearchTerm('test')}
    >
      Trigger Search
    </button>
  );
};

const LegacyConsumer = ({ onRender }) => {
  usePokemon(); // Consumes everything
  onRender();
  return <div>Legacy Consumer</div>;
};

const OptimizedConsumer = ({ onRender }) => {
  usePokemonUI(); // Consumes only UI state
  onRender();
  return <div>Optimized Consumer</div>;
};

describe('Context Performance', () => {
  it('should verify optimization: legacy re-renders, optimized stays stable', async () => {
    let legacyRenderCount = 0;
    let optimizedRenderCount = 0;

    const onLegacyRender = () => {
      legacyRenderCount++;
    };

    const onOptimizedRender = () => {
      optimizedRenderCount++;
    };

    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <PokemonProvider>
          <LegacyConsumer onRender={onLegacyRender} />
          <OptimizedConsumer onRender={onOptimizedRender} />
          <Trigger />
        </PokemonProvider>
      </QueryClientProvider>
    );

    // Initial render
    // React strict mode might render double, so we capture initial
    const initialLegacyCount = legacyRenderCount;
    const initialOptimizedCount = optimizedRenderCount;

    expect(initialLegacyCount).toBeGreaterThan(0);
    expect(initialOptimizedCount).toBeGreaterThan(0);

    // Trigger update (Search Term)
    const btn = screen.getByTestId('trigger-btn');
    await act(async () => {
      btn.click();
    });

    console.log(`Legacy: ${initialLegacyCount} -> ${legacyRenderCount}`);
    console.log(`Optimized: ${initialOptimizedCount} -> ${optimizedRenderCount}`);

    // Legacy should re-render
    expect(legacyRenderCount).toBeGreaterThan(initialLegacyCount);

    // Optimized should NOT re-render
    expect(optimizedRenderCount).toBe(initialOptimizedCount);
  });
});
