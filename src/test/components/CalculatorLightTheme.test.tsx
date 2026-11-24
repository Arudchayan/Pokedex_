import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StatCalculator from '../../components/calculators/StatCalculator';
import CatchCalculator from '../../components/calculators/CatchCalculator';
import DamageCalculator from '../../components/calculators/DamageCalculator';
import BreedingCalculator from '../../components/calculators/BreedingCalculator';
import PokemonDatasetStatus from '../../components/calculators/PokemonDatasetStatus';
import { fetchPokemonDetails, fetchPokemonMoves } from '../../services/pokeapiService';
import { detailsById, masterPokemonList } from '../helpers/calculatorFixtures';

const context = vi.hoisted(() => ({
  current: {
    masterPokemonList: [] as unknown[],
    theme: 'light',
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

const renderWithQuery = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const expectThemeSafePrimary = (name: string) => {
  const action = screen.getByRole('button', { name });
  expect(action).toHaveClass('bg-slate-900', 'text-white', 'border-slate-900');
  expect(action).toHaveClass('dark:bg-white', 'dark:text-slate-900', 'dark:border-white');
  expect(action).toHaveClass(
    'disabled:bg-slate-500',
    'disabled:text-white',
    'disabled:border-slate-500'
  );
};

describe('calculator light-theme states', () => {
  beforeEach(() => {
    context.current = {
      masterPokemonList,
      theme: 'light',
      loading: false,
      error: null,
      reload: vi.fn(),
    };
    vi.mocked(fetchPokemonDetails).mockImplementation(
      async (id: number) => detailsById[id] ?? null
    );
    vi.mocked(fetchPokemonMoves).mockResolvedValue([]);
  });

  it('renders all four actions with high-contrast light and dark pairs', () => {
    renderWithQuery(<StatCalculator onClose={vi.fn()} />);
    expectThemeSafePrimary('Calculate Stats');
    expect(screen.getByText(/select a pokémon to set its level/i)).toHaveClass('text-slate-600');
  });

  it('renders the Catch and Breeding actions with the same safe pair', () => {
    renderWithQuery(<CatchCalculator onClose={vi.fn()} />);
    expectThemeSafePrimary('Calculate Catch Rate');

    renderWithQuery(<BreedingCalculator onClose={vi.fn()} />);
    expectThemeSafePrimary('Check Compatibility');
  });

  it('renders the Damage action with the same safe pair', () => {
    renderWithQuery(<DamageCalculator onClose={vi.fn()} />);
    expectThemeSafePrimary('Calculate Damage');
  });

  it('uses a readable dataset error and validation banner in light theme', async () => {
    renderWithQuery(
      <PokemonDatasetStatus
        loading={false}
        error="Failed to fetch Pokemon data."
        hasData={false}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveClass(
      'bg-red-50',
      'text-red-700',
      'dark:bg-red-500/10',
      'dark:text-red-300'
    );

    cleanup();

    renderWithQuery(<StatCalculator onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/search pokemon/i), {
      target: { value: 'pika' },
    });
    fireEvent.click(await screen.findByRole('option', { name: /pikachu/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Calculate Stats' })).toBeEnabled()
    );
    fireEvent.change(screen.getByLabelText('Level value'), { target: { value: '150' } });

    const validation = screen.getByRole('alert');
    expect(validation).toHaveClass('bg-amber-50', 'text-amber-800', 'dark:text-amber-200');
    expect(screen.getByLabelText('Level value')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Level value')).toHaveAttribute(
      'aria-describedby',
      'stat-validation'
    );
  });

  it('uses a readable detail-load error banner in light theme', async () => {
    vi.mocked(fetchPokemonDetails).mockRejectedValueOnce(new Error('offline'));
    renderWithQuery(<StatCalculator onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/search pokemon/i), {
      target: { value: 'pika' },
    });
    fireEvent.click(await screen.findByRole('option', { name: /pikachu/i }));

    expect(await screen.findByRole('alert')).toHaveClass('bg-red-50', 'text-red-700');
  });
});
