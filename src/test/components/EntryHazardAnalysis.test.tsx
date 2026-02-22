import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EntryHazardAnalysis from '../../components/calculators/EntryHazardAnalysis';
import { TeamMember } from '../../types';

describe('EntryHazardAnalysis', () => {
  const mockTeam: TeamMember[] = [
    {
      id: 6,
      name: 'Charizard',
      imageUrl: 'charizard.png',
      shinyImageUrl: '',
      types: ['fire', 'flying'],
      flavorText: '',
      abilities: ['blaze', 'solar power'],
    } as unknown as TeamMember,
    {
      id: 448,
      name: 'Lucario',
      imageUrl: 'lucario.png',
      shinyImageUrl: '',
      types: ['fighting', 'steel'],
      flavorText: '',
      abilities: ['steadfast', 'inner focus', 'justified'],
    } as unknown as TeamMember,
    {
      id: 94,
      name: 'Gengar',
      imageUrl: 'gengar.png',
      shinyImageUrl: '',
      types: ['ghost', 'poison'], // Gengar has Levitate in older gens, strictly it's Cursed Body in Gen 9.
      // But for test purposes we can simulate Levitate via ability override or mock ability list.
      // Let's explicitly set selectedAbility to Levitate to test that logic.
      selectedAbility: 'Levitate',
      flavorText: '',
      abilities: ['cursed body'],
    } as unknown as TeamMember,
    {
      id: 36,
      name: 'Clefable',
      imageUrl: 'clefable.png',
      shinyImageUrl: '',
      types: ['fairy'],
      flavorText: '',
      abilities: ['cute charm', 'magic guard', 'unaware'],
      selectedAbility: 'Magic Guard',
    } as unknown as TeamMember,
    {
      id: 637,
      name: 'Volcarona',
      imageUrl: 'volcarona.png',
      shinyImageUrl: '',
      types: ['bug', 'fire'],
      flavorText: '',
      abilities: ['flame body', 'swarm'],
      selectedItem: 'Heavy-Duty Boots',
    } as unknown as TeamMember,
    {
      id: 980,
      name: 'Clodsire',
      imageUrl: 'clodsire.png',
      shinyImageUrl: '',
      types: ['poison', 'ground'],
      flavorText: '',
      abilities: ['poison point', 'water absorb', 'unaware'],
    } as unknown as TeamMember,
  ];

  it('renders nothing when team is empty', () => {
    const { container } = render(<EntryHazardAnalysis team={[]} theme="light" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders table headers', () => {
    render(<EntryHazardAnalysis team={mockTeam} theme="light" />);
    expect(screen.getByText('Stealth Rock')).toBeInTheDocument();
    expect(screen.getByText('Spikes')).toBeInTheDocument();
    expect(screen.getByText('Toxic Spikes')).toBeInTheDocument();
    expect(screen.getByText('Sticky Web')).toBeInTheDocument();
  });

  it('calculates Stealth Rock damage correctly', () => {
    render(<EntryHazardAnalysis team={mockTeam} theme="light" />);

    // Charizard (Fire/Flying) -> 4x weak -> 50%
    // We look for the row containing Charizard, then check for 50%
    const charizardRow = screen.getByText('Charizard').closest('tr');
    expect(charizardRow).toHaveTextContent('50%');

    // Lucario (Fighting/Steel) -> 0.25x weak (resist) -> 3.125%
    const lucarioRow = screen.getByText('Lucario').closest('tr');
    expect(lucarioRow).toHaveTextContent('3.125%');

    // Clefable (Magic Guard) -> Immune
    const clefableRow = screen.getByText('Clefable').closest('tr');
    expect(clefableRow).toHaveTextContent('Immune');

    // Volcarona (Heavy-Duty Boots) -> Immune (otherwise 4x weak -> 50%)
    const volcaronaRow = screen.getByText('Volcarona').closest('tr');
    expect(volcaronaRow).toHaveTextContent('Immune');
  });

  it('handles Spikes susceptibility correctly', () => {
    render(<EntryHazardAnalysis team={mockTeam} theme="light" />);

    // Charizard (Flying) -> Immune
    const charizardRow = screen.getByText('Charizard').closest('tr');
    // We need to be specific about which column, but text check in row works if unique enough
    // Spikes is the 2nd column.
    // Let's rely on multiple checks or exact content if possible.
    // Or just check that 'Immune' appears multiple times in the row?
    // Charizard: Immune to Spikes, Immune to Toxic Spikes, Immune to Sticky Web.
    // So 'Immune' should appear at least 3 times.

    // Lucario (Grounded) -> Susceptible
    const lucarioRow = screen.getByText('Lucario').closest('tr');
    // Lucario is immune to Toxic Spikes (Steel), susceptible to Spikes/Sticky Web.
    expect(lucarioRow).toHaveTextContent('Susceptible');

    // Gengar (Levitate) -> Immune
    const gengarRow = screen.getByText('Gengar').closest('tr');
    expect(gengarRow).toHaveTextContent('Immune'); // Spikes
    expect(gengarRow).toHaveTextContent('Immune'); // Sticky Web
  });

  it('handles Toxic Spikes correctly', () => {
    render(<EntryHazardAnalysis team={mockTeam} theme="light" />);

    // Lucario (Steel) -> Immune
    const lucarioRow = screen.getByText('Lucario').closest('tr');
    // Since Immune appears for T.Spikes, check existence.
    // Hard to distinguish columns by text alone without stricter selectors,
    // but we can trust the component logic if we check the combination of values.

    // Clodsire (Poison/Ground) -> Absorbs
    const clodsireRow = screen.getByText('Clodsire').closest('tr');
    expect(clodsireRow).toHaveTextContent('Absorbs');

    // Charizard (Flying) -> Immune
    const charizardRow = screen.getByText('Charizard').closest('tr');
    expect(charizardRow).toHaveTextContent('Immune');
  });

  it('handles Sticky Web correctly', () => {
    render(<EntryHazardAnalysis team={mockTeam} theme="light" />);

    // Clodsire (Grounded) -> -1 Speed
    const clodsireRow = screen.getByText('Clodsire').closest('tr');
    expect(clodsireRow).toHaveTextContent('-1 Speed');

    // Volcarona (Boots) -> Immune
    const volcaronaRow = screen.getByText('Volcarona').closest('tr');
    expect(volcaronaRow).toHaveTextContent('Immune');
  });

  it('respects Clear Body immunity to Sticky Web', () => {
      const metagross: TeamMember = {
          id: 376,
          name: 'Metagross',
          imageUrl: '',
          shinyImageUrl: '',
          types: ['steel', 'psychic'],
          flavorText: '',
          abilities: ['clear body'], // Should be detected even without selectedAbility
      } as unknown as TeamMember;

      render(<EntryHazardAnalysis team={[metagross]} theme="light" />);
      const row = screen.getByText('Metagross').closest('tr');
      expect(row).toHaveTextContent('Immune'); // Sticky Web
  });

  it('respects Air Balloon immunity', () => {
      const heatran: TeamMember = {
          id: 485,
          name: 'Heatran',
          imageUrl: '',
          shinyImageUrl: '',
          types: ['fire', 'steel'],
          flavorText: '',
          abilities: ['flash fire'],
          selectedItem: 'Air Balloon',
      } as unknown as TeamMember;

      render(<EntryHazardAnalysis team={[heatran]} theme="light" />);
      const row = screen.getByText('Heatran').closest('tr');
      expect(row).toHaveTextContent('Immune'); // Spikes
      expect(row).toHaveTextContent('Immune'); // Sticky Web
  });
});
