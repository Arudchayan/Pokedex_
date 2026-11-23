import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StatCalculator from '../../components/calculators/StatCalculator';
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
      <StatCalculator onClose={vi.fn()} />
    </QueryClientProvider>
  );
};

const choosePikachu = async () => {
  fireEvent.change(screen.getByPlaceholderText(/search pokemon/i), {
    target: { value: 'pika' },
  });
  fireEvent.click(await screen.findByRole('option', { name: /pikachu/i }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /calculate stats/i })).toBeEnabled()
  );
};

describe('StatCalculator states', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
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

    expect(screen.getByText(/select a pokémon to set its level/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calculate Stats' })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps results hidden until Calculate and then shows known totals', async () => {
    renderCalculator();
    await choosePikachu();

    const resultRegion = screen.getByRole('region', { name: 'Calculated Stats' });
    expect(resultRegion).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByLabelText('Total hp')).toHaveTextContent('—');

    fireEvent.click(screen.getByRole('button', { name: 'Calculate Stats' }));

    expect(screen.getByLabelText('Total hp')).toHaveTextContent('110');
    expect(screen.getByLabelText('Total attack')).toHaveTextContent('75');
    expect(screen.getByLabelText('Total speed')).toHaveTextContent('110');
  });

  it('reports clamped out-of-range values inline', async () => {
    renderCalculator();
    await choosePikachu();

    fireEvent.change(screen.getByLabelText('Level value'), { target: { value: '150' } });

    expect(screen.getByRole('alert')).toHaveTextContent(/level must be between 1 and 100/i);
    expect(screen.getByLabelText('Level value')).toHaveValue(100);
  });

  it('shows a Retry recovery path when details fail, then recovers', async () => {
    vi.mocked(fetchPokemonDetails).mockRejectedValueOnce(new Error('network down'));
    renderCalculator();

    fireEvent.change(screen.getByPlaceholderText(/search pokemon/i), {
      target: { value: 'pika' },
    });
    fireEvent.click(await screen.findByRole('option', { name: /pikachu/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/failed to load pokémon data/i);

    vi.mocked(fetchPokemonDetails).mockResolvedValue(pikachuDetails);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /calculate stats/i })).toBeEnabled()
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('resets back to the initial state', async () => {
    renderCalculator();
    await choosePikachu();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate Stats' }));
    expect(screen.getByLabelText('Total hp')).toHaveTextContent('110');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByText(/select a pokémon to set its level/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calculate Stats' })).toBeDisabled();
    expect(screen.queryByRole('region', { name: 'Calculated Stats' })).not.toBeInTheDocument();
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
