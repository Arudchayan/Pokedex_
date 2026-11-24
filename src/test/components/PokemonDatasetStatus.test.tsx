import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PokemonDatasetStatus from '../../components/calculators/PokemonDatasetStatus';

describe('PokemonDatasetStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces a bounded loading state and then offers Retry', () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    render(<PokemonDatasetStatus loading error={null} hasData={false} onRetry={onRetry} />);

    expect(screen.getByRole('status')).toHaveTextContent(/loading pokémon data/i);

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/taking longer than expected/i);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows the query error and stays out of the way when data is available', () => {
    const { rerender } = render(
      <PokemonDatasetStatus
        loading={false}
        error="Failed to fetch Pokemon data."
        hasData={false}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/failed to fetch pokemon data/i);

    rerender(
      <PokemonDatasetStatus
        loading={false}
        error="Failed to fetch Pokemon data."
        hasData={true}
        onRetry={vi.fn()}
      />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
