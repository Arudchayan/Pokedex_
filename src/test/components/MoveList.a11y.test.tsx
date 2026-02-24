import React from 'react';
import { render, screen } from '@testing-library/react';
import MoveList from '../../components/dex/MoveList';
import { describe, it, expect } from 'vitest';
import { PokemonMove } from '../../types';

// Mock data
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
  {
    name: 'growl',
    url: 'https://pokeapi.co/api/v2/move/45/',
    type: 'normal',
    damageClass: 'status',
    power: null,
    accuracy: 100,
    pp: 40,
    priority: 0,
    level: 1,
    learnMethod: 'level up',
  },
];

describe('MoveList Accessibility', () => {
  it('has accessible search input', () => {
    render(<MoveList moves={mockMoves} />);
    // This should FAIL initially as the input lacks a label
    expect(screen.getByRole('textbox', { name: /search moves/i })).toBeInTheDocument();
  });

  it('has accessible damage class icons', () => {
    render(<MoveList moves={mockMoves} />);
    // This should FAIL initially as icons lack role="img"
    const icons = screen.getAllByRole('img', { name: /(physical|status)/i });
    expect(icons.length).toBeGreaterThan(0);
  });

  it('has accessible sort buttons in headers', () => {
    render(<MoveList moves={mockMoves} />);
    // This should FAIL initially as headers use <th> with onClick instead of <button>
    expect(screen.getByRole('button', { name: /move/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /type/i })).toBeInTheDocument();
  });
});
