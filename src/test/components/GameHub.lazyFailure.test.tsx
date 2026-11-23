import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
// Imported before GameHub so the shared pokeapiService mock is registered first.
import { renderWithProvider, setPokeapiServiceMock } from '../utils';
import GameHub from '../../components/games/GameHub';

const mockLazyState = vi.hoisted(() => ({ attempts: 0 }));

vi.mock('../../components/games/PokedleGame', async () => {
  const attempt = mockLazyState.attempts++;
  if (attempt === 0) throw new Error('chunk failed');
  const { useEffect } = await import('react');
  const MockPokedleGame = ({ onReady }: { onReady?: () => void }) => {
    useEffect(() => {
      onReady?.();
    }, [onReady]);
    return <div>Recovered Pokédle</div>;
  };
  return { default: MockPokedleGame };
});

describe('GameHub lazy chunk failures', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockLazyState.attempts = 0;
    setPokeapiServiceMock();
  });

  it('shows a retryable error and recovers when the chunk import is retried', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProvider(<GameHub onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Pokédle/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Game data couldn't load/i);
    expect(screen.getAllByRole('alert')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText('Recovered Pokédle')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    consoleError.mockRestore();
  });
}, 15_000);
