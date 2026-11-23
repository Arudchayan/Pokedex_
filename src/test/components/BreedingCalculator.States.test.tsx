import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BreedingCalculator from '../../components/calculators/BreedingCalculator';
import { fetchPokemonDetails, fetchPokemonMoves } from '../../services/pokeapiService';
import { detailsById, masterPokemonList } from '../helpers/calculatorFixtures';

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
      <BreedingCalculator onClose={vi.fn()} />
    </QueryClientProvider>
  );
};

const chooseParent = async (label: 'A' | 'B', name: RegExp) => {
  const input = screen.getByPlaceholderText(new RegExp(`search parent ${label}`, 'i'));
  fireEvent.change(input, { target: { value: 'a' } });
  fireEvent.click(await screen.findByRole('option', { name }));
};

const choosePair = async () => {
  await chooseParent('A', /bulbasaur/i);
  await waitFor(() => expect(screen.getByPlaceholderText(/search parent b/i)).toBeInTheDocument());
  await chooseParent('B', /charmander/i);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Check Compatibility' })).toBeEnabled()
  );
};

describe('BreedingCalculator states', () => {
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

  it('shows initial guidance and a disabled Check action', () => {
    renderCalculator();

    const result = screen.getByRole('region', { name: 'Breeding Result' });
    expect(result).toHaveAttribute('aria-live', 'polite');
    expect(result).toHaveTextContent(/select parent a and parent b/i);
    expect(screen.getByRole('button', { name: 'Check Compatibility' })).toBeDisabled();
  });

  it('shows a compatible result with the existing offspring details', async () => {
    renderCalculator();
    await choosePair();

    fireEvent.click(screen.getByRole('button', { name: 'Check Compatibility' }));

    const result = screen.getByRole('region', { name: 'Breeding Result' });
    expect(result).toHaveTextContent(/compatible!/i);
    expect(result).toHaveTextContent(/offspring prediction/i);
    expect(result).toHaveTextContent(/charmander/i);
  });

  it('shows an incompatible result with a recovery hint', async () => {
    renderCalculator();
    await choosePair();

    const maleButtons = screen.getAllByRole('button', { name: 'male' });
    fireEvent.click(maleButtons[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Check Compatibility' }));

    const result = screen.getByRole('region', { name: 'Breeding Result' });
    expect(result).toHaveTextContent(/incompatible/i);
    expect(result).toHaveTextContent(/parents must be opposite genders/i);
    expect(result).toHaveTextContent(/change a parent or gender/i);
  });

  it('shows a Retry recovery path when a parent fails to load', async () => {
    vi.mocked(fetchPokemonDetails).mockRejectedValueOnce(new Error('network down'));
    renderCalculator();

    await chooseParent('A', /bulbasaur/i);

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load pokémon data/i);

    vi.mocked(fetchPokemonDetails).mockResolvedValue(detailsById[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/search parent b/i)).toBeInTheDocument()
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('resets back to the initial state', async () => {
    renderCalculator();
    await choosePair();
    fireEvent.click(screen.getByRole('button', { name: 'Check Compatibility' }));
    expect(screen.getByRole('region', { name: 'Breeding Result' })).toHaveTextContent(
      /compatible!/i
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByRole('region', { name: 'Breeding Result' })).toHaveTextContent(
      /select parent a and parent b/i
    );
    expect(screen.getByRole('button', { name: 'Check Compatibility' })).toBeDisabled();
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
    expect(screen.getByPlaceholderText(/search parent a/i)).toBeDisabled();
    expect(screen.getByPlaceholderText(/search parent b/i)).toBeDisabled();
  });
});
