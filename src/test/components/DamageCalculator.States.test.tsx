import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DamageCalculator from '../../components/calculators/DamageCalculator';
import { fetchPokemonDetails, fetchPokemonMoves } from '../../services/pokeapiService';
import {
  bulbasaurDetails,
  detailsById,
  masterPokemonList,
  tackleMove,
} from '../helpers/calculatorFixtures';

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
      <DamageCalculator onClose={vi.fn()} />
    </QueryClientProvider>
  );
};

const choosePokemon = async (placeholder: RegExp, name: RegExp) => {
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value: 'a' } });
  fireEvent.click(await screen.findByRole('option', { name }));
};

const chooseBattle = async () => {
  await choosePokemon(/search attacker/i, /bulbasaur/i);
  await waitFor(() => expect(screen.getByPlaceholderText(/search defender/i)).toBeInTheDocument());
  await choosePokemon(/search defender/i, /charmander/i);
  await waitFor(() => expect(screen.getByLabelText('Select Move')).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText('Select Move'), { target: { value: 'tackle' } });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Calculate Damage' })).toBeEnabled()
  );
};

describe('DamageCalculator states', () => {
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
    vi.mocked(fetchPokemonMoves).mockResolvedValue([tackleMove]);
  });

  it('shows initial guidance and a disabled Calculate action', () => {
    renderCalculator();

    const result = screen.getByRole('region', { name: 'Damage Result' });
    expect(result).toHaveAttribute('aria-live', 'polite');
    expect(result).toHaveTextContent(/select an attacker/i);
    expect(screen.getByRole('button', { name: 'Calculate Damage' })).toBeDisabled();
  });

  it('computes the known damage range and keeps the result region live', async () => {
    renderCalculator();
    await chooseBattle();

    fireEvent.click(screen.getByRole('button', { name: 'Calculate Damage' }));

    const result = screen.getByRole('region', { name: 'Damage Result' });
    expect(result).toHaveTextContent('17 - 21');
    expect(result).toHaveTextContent('14.9% - 18.4% HP');
    expect(result).toHaveTextContent('Damage Range (16 rolls)');
  });

  it('validates out-of-range levels inline and disables Calculate', async () => {
    renderCalculator();
    await chooseBattle();

    const attackerLevel = screen.getAllByLabelText('Level')[0];
    fireEvent.change(attackerLevel, { target: { value: '150' } });

    expect(screen.getByRole('alert')).toHaveTextContent(/level must be between 1 and 100/i);
    expect(screen.getByRole('button', { name: 'Calculate Damage' })).toBeDisabled();
  });

  it('shows a Retry recovery path when a fighter fails to load', async () => {
    vi.mocked(fetchPokemonDetails).mockRejectedValueOnce(new Error('network down'));
    renderCalculator();

    await choosePokemon(/search attacker/i, /bulbasaur/i);

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load pokémon data/i);

    vi.mocked(fetchPokemonDetails).mockResolvedValue(bulbasaurDetails);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Bulbasaur' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('resets back to the initial state', async () => {
    renderCalculator();
    await chooseBattle();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate Damage' }));
    expect(screen.getByRole('region', { name: 'Damage Result' })).toHaveTextContent('17 - 21');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByRole('region', { name: 'Damage Result' })).toHaveTextContent(
      /select an attacker/i
    );
    expect(screen.getByRole('button', { name: 'Calculate Damage' })).toBeDisabled();
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
    expect(screen.getByPlaceholderText(/search attacker/i)).toBeDisabled();
  });
});
