import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CoverageGrid from '../../components/charts/CoverageGrid';
import { TeamMember } from '../../types';
import * as pokeapiService from '../../services/pokeapiService';

// Mock the service
vi.mock('../../services/pokeapiService', () => ({
  fetchAllMoves: vi.fn(),
  validatePokemonListItem: vi.fn(),
}));

const mockMoves = [
  {
    id: 1,
    name: 'scratch',
    type: 'normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
  },
  { id: 2, name: 'ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25 },
  {
    id: 3,
    name: 'water-gun',
    type: 'water',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 25,
  },
];

const baseMember: TeamMember = {
  id: 4,
  name: 'charmander',
  types: ['fire'],
  imageUrl: 'url',
  shinyImageUrl: 'url',
  flavorText: 'text',
  stats: [],
  abilities: [],
  selectedMoves: [],
};

describe('CoverageGrid', () => {
  beforeEach(() => {
    (pokeapiService.fetchAllMoves as any).mockResolvedValue(mockMoves);
  });

  it('renders correctly', async () => {
    render(<CoverageGrid team={[baseMember]} theme="light" />);
    expect(screen.getByText('Coverage Analysis')).toBeInTheDocument();
    expect(screen.getByText('charmander')).toBeInTheDocument();
    await waitFor(() => {
      expect(pokeapiService.fetchAllMoves).toHaveBeenCalled();
    });
  });

  it('calculates offensive coverage based on moves (Scratch - Normal - No SE)', async () => {
    const mockTeam = [{ ...baseMember, selectedMoves: ['Scratch'] }];
    render(<CoverageGrid team={mockTeam} theme="light" />);

    // Switch to Offensive Mode
    const offensiveBtn = screen.getByText('Offensive');
    fireEvent.click(offensiveBtn);

    // Wait for moves to load
    // Charmander has 'Scratch' (Normal). Normal is not super effective against anything.
    // So we expect NO check marks.
    await waitFor(() => {
      const checks = screen.queryAllByText('✓');
      expect(checks.length).toBe(0);
    });
  });

  it('calculates offensive coverage based on moves (Ember - Fire - Has SE)', async () => {
    const mockTeam = [{ ...baseMember, selectedMoves: ['Ember'] }];
    render(<CoverageGrid team={mockTeam} theme="light" />);

    // Switch to Offensive Mode
    const offensiveBtn = screen.getByText('Offensive');
    fireEvent.click(offensiveBtn);

    // Ember (Fire) hits Grass, Ice, Bug, Steel.
    // There should be 4 checks.
    await waitFor(() => {
      const checks = screen.getAllByText('✓');
      expect(checks.length).toBe(4);
    });
  });

  it('fallbacks to STAB if no moves selected', async () => {
    const mockTeam = [{ ...baseMember, selectedMoves: [] }];
    render(<CoverageGrid team={mockTeam} theme="light" />);

    const offensiveBtn = screen.getByText('Offensive');
    fireEvent.click(offensiveBtn);

    // Charmander (Fire) hits 4 types.
    await waitFor(() => {
      const checks = screen.getAllByText('✓');
      expect(checks.length).toBe(4);
    });
  });

  it('handles mixed case and spaces in move names', async () => {
    // "Water Gun" from user -> matches "water-gun" from API
    const mockTeam = [{ ...baseMember, selectedMoves: ['Water Gun'] }];
    render(<CoverageGrid team={mockTeam} theme="light" />);

    const offensiveBtn = screen.getByText('Offensive');
    fireEvent.click(offensiveBtn);

    // Water Gun (Water) hits Fire, Ground, Rock.
    // There should be 3 checks.
    await waitFor(() => {
      const checks = screen.getAllByText('✓');
      expect(checks.length).toBe(3);
    });
  });
});
