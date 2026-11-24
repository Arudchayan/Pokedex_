import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CatchCalculator from '../../components/calculators/CatchCalculator';
import { fetchPokemonDetails, fetchPokemonMoves } from '../../services/pokeapiService';
import { detailsById, masterPokemonList, pikachuDetails } from '../helpers/calculatorFixtures';

const context = vi.hoisted(() => ({
  current: {
    masterPokemonList: [] as unknown[],
    theme: 'dark',
    loading: false,
    error: null as string | null,
    reload: vi.fn(),
  },
}));

vi.mock('../../context/PokemonContext', () => ({
  usePokemon: () => context.current,
}));

vi.mock('../../services/pokeapiService', () => ({
  fetchPokemonDetails: vi.fn(),
  fetchPokemonMoves: vi.fn(),
}));

const renderCalculator = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CatchCalculator onClose={vi.fn()} />
    </QueryClientProvider>
  );
};

const choosePikachu = async () => {
  fireEvent.change(screen.getByPlaceholderText(/search pokemon/i), {
    target: { value: 'pika' },
  });
  fireEvent.click(await screen.findByRole('option', { name: /pikachu/i }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Calculate Catch Rate' })).toBeEnabled()
  );
};

describe('CatchCalculator states', () => {
  beforeEach(() => {
    context.current = {
      masterPokemonList,
      theme: 'dark',
      loading: false,
      error: null,
      reload: vi.fn(),
    };
    vi.mocked(fetchPokemonDetails).mockImplementation(
      async (id: number) => detailsById[id] ?? null
    );
    vi.mocked(fetchPokemonMoves).mockResolvedValue([]);
  });

  it('shows initial guidance and a disabled Calculate action', () => {
    renderCalculator();

    expect(screen.getByText(/select a pokémon to estimate its catch rate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calculate Catch Rate' })).toBeDisabled();
    expect(screen.queryByRole('region', { name: 'Capture Probability' })).not.toBeInTheDocument();
  });

  it('shows a labelled result region with the known probability', async () => {
    renderCalculator();
    await choosePikachu();

    fireEvent.click(screen.getByRole('button', { name: 'Calculate Catch Rate' }));

    const result = screen.getByRole('region', { name: 'Capture Probability' });
    expect(result).toHaveAttribute('aria-live', 'polite');
    expect(result).toHaveTextContent('24.8%');
  });

  it('reports no matching species instead of rendering nothing', () => {
    renderCalculator();

    fireEvent.change(screen.getByPlaceholderText(/search pokemon/i), {
      target: { value: 'zzzz' },
    });

    expect(screen.getByRole('status')).toHaveTextContent(/no pokémon match/i);
  });

  it('shows a Retry recovery path when details fail, then recovers', async () => {
    vi.mocked(fetchPokemonDetails).mockRejectedValueOnce(new Error('network down'));
    renderCalculator();

    fireEvent.change(screen.getByPlaceholderText(/search pokemon/i), {
      target: { value: 'pika' },
    });
    fireEvent.click(await screen.findByRole('option', { name: /pikachu/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load pokémon data/i);

    vi.mocked(fetchPokemonDetails).mockResolvedValue(pikachuDetails);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Calculate Catch Rate' })).toBeEnabled()
    );
  });

  it('resets back to the initial state', async () => {
    renderCalculator();
    await choosePikachu();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate Catch Rate' }));
    expect(screen.getByRole('region', { name: 'Capture Probability' })).toHaveTextContent('24.8%');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByText(/select a pokémon to estimate its catch rate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calculate Catch Rate' })).toBeDisabled();
    expect(screen.queryByRole('region', { name: 'Capture Probability' })).not.toBeInTheDocument();
  });

  it('shows dataset failure with Retry when the species list is unavailable', () => {
    const reload = vi.fn();
    context.current = {
      masterPokemonList: [],
      theme: 'dark',
      loading: false,
      error: 'Failed to fetch Pokemon data.',
      reload,
    };

    renderCalculator();

    expect(screen.getByRole('alert')).toHaveTextContent(/failed to fetch pokemon data/i);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(reload).toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/search pokemon/i)).toBeDisabled();
  });
});
