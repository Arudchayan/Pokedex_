import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MovesSection from '../../components/pokemon-detail/MovesSection';
import { describe, it, expect, vi } from 'vitest';
import { PokemonMove } from '../../types';

// Mock MoveList to avoid rendering complex children
vi.mock('../../components/dex/MoveList', () => ({
  default: () => <div data-testid="move-list-mock">Move List Content</div>,
}));

const mockMoves: PokemonMove[] = [
  {
    name: 'tackle',
    url: 'https://pokeapi.co/api/v2/move/33/',
    type: 'normal',
    damageClass: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    priority: 0,
    level: 1,
    learnMethod: 'level up',
  },
];

describe('MovesSection Accessibility', () => {
  it('renders a button for toggling moves', () => {
    const onToggle = vi.fn();
    render(<MovesSection theme="dark" moves={mockMoves} isExpanded={false} onToggle={onToggle} />);

    // This check confirms semantic button usage.
    // If it's a div with role="button", it might pass getByRole if accessible,
    // but we specifically want to ensure it handles keyboard interaction natively or via tabIndex.
    // However, simplest check for now is getByRole('button').
    // If it's a div without tabIndex, it's not truly a functional button for keyboard users.
    const button = screen.getByRole('button', { name: /moves/i });
    expect(button).toBeInTheDocument();

    // Check if it's reachable via keyboard (tabIndex)
    // Note: <button> has tabIndex=0 by default. <div> does not.
    // We can check if it matches the selector for focusable elements or check tabIndex attribute if explicitly set.
    // But easier: <button> is preferred.
    expect(button.tagName).toBe('BUTTON');
  });

  it('displays aria-expanded state correctly', () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <MovesSection theme="dark" moves={mockMoves} isExpanded={false} onToggle={onToggle} />
    );

    const button = screen.getByRole('button', { name: /moves/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    rerender(<MovesSection theme="dark" moves={mockMoves} isExpanded={true} onToggle={onToggle} />);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('controls the moves list visibility', () => {
    const onToggle = vi.fn();
    render(<MovesSection theme="dark" moves={mockMoves} isExpanded={true} onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: /moves/i });
    expect(button).toHaveAttribute('aria-controls', 'moves-list');
    expect(screen.getByTestId('move-list-mock')).toBeVisible();
  });
});
