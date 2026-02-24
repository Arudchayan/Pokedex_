import React from 'react';
import { vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithProvider } from '../../test/utils';
import CoverageGrid from './CoverageGrid';
import { PokemonListItem } from '../../types';
import * as pokeapiService from '../../services/pokeapiService';

describe('CoverageGrid', () => {
  beforeEach(() => {
    vi.spyOn(pokeapiService, 'fetchAllMoves').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockTeam: PokemonListItem[] = [
    {
      id: 6,
      name: 'charizard',
      types: ['fire', 'flying'],
      imageUrl: 'charizard.png',
      shinyImageUrl: 'shiny-charizard.png',
      flavorText: 'Spits fire.',
      stats: [],
    },
    {
      id: 130,
      name: 'gyarados',
      types: ['water', 'flying'],
      imageUrl: 'gyarados.png',
      shinyImageUrl: 'shiny-gyarados.png',
      flavorText: 'Rampage.',
      stats: [],
    },
  ];

  it('renders without crashing', () => {
    renderWithProvider(<CoverageGrid team={mockTeam} theme="light" />);
    expect(screen.getByText('Coverage Analysis')).toBeInTheDocument();
    expect(screen.getByText('charizard')).toBeInTheDocument();
    expect(screen.getByText('gyarados')).toBeInTheDocument();
  });

  it('renders defensive mode by default', () => {
    renderWithProvider(<CoverageGrid team={mockTeam} theme="light" />);

    expect(screen.getByText('Defensive').closest('button')).toHaveClass('bg-primary-500');

    // Charizard is 4x weak to Rock. Gyarados is 4x weak to Electric.
    // We expect at least one "4" to be present.
    const fours = screen.getAllByText('4');
    expect(fours.length).toBeGreaterThan(0);
  });

  it('toggles to offensive mode', () => {
    renderWithProvider(<CoverageGrid team={mockTeam} theme="light" />);

    const offensiveBtn = screen.getByText('Offensive');
    fireEvent.click(offensiveBtn);

    expect(offensiveBtn.closest('button')).toHaveClass('bg-primary-500');

    // In offensive mode, Charizard (Fire/Flying) hits Grass (Fire) and Bug (Fire/Flying) and Fighting (Flying) super effectively.
    // We check for checkmarks.
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('calculates immunities correctly (defensive)', () => {
    renderWithProvider(<CoverageGrid team={mockTeam} theme="light" />);
    // Charizard (Flying) is immune to Ground (0x)
    // Should show "0"
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('renders summary row', () => {
    renderWithProvider(<CoverageGrid team={mockTeam} theme="light" />);
    expect(screen.getByText('Team Weakness')).toBeInTheDocument();
  });

  it('renders nothing if team is empty', () => {
    const { container } = renderWithProvider(<CoverageGrid team={[]} theme="light" />);
    expect(container).toBeEmptyDOMElement();
  });
});
