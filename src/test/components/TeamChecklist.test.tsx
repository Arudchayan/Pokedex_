import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TeamChecklist from '../../components/team/TeamChecklist';
import { TeamMember } from '../../types';

describe('TeamChecklist', () => {
  const mockTeam: TeamMember[] = [
    {
      id: 1,
      name: 'TestPokemon',
      imageUrl: 'test.png',
      shinyImageUrl: 'shiny.png',
      types: ['normal'],
      flavorText: 'test',
      selectedMoves: ['stealth rock', 'recover', 'swords dance', 'tackle'],
    } as unknown as TeamMember
  ];

  it('renders nothing when team is empty', () => {
    const { container } = render(<TeamChecklist team={[]} theme="light" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('identifies present moves correctly', () => {
    render(<TeamChecklist team={mockTeam} theme="light" />);

    // Check categories that should be present
    expect(screen.getByText('Entry Hazards')).toBeInTheDocument();
    // Use getAllByText for '1' because it might appear multiple times if multiple categories have 1 count
    const counts = screen.getAllByText('1');
    expect(counts.length).toBeGreaterThanOrEqual(3); // Hazards, Recovery, Setup

    // Check carriers
    const carrierElements = screen.getAllByText('TestPokemon');
    expect(carrierElements.length).toBeGreaterThan(0);
  });

  it('identifies missing moves correctly', () => {
    render(<TeamChecklist team={mockTeam} theme="light" />);

    // "Hazard Removal" (rapid spin/defog) is NOT in the mock team
    expect(screen.getByText('Hazard Removal')).toBeInTheDocument();
    // Should show "Not detected" for missing categories
    // Since "Not detected" appears multiple times, use getAllByText
    const notDetected = screen.getAllByText('Not detected');
    expect(notDetected.length).toBeGreaterThan(0);
  });

  it('handles mixed case move names', () => {
     const mixedCaseTeam: TeamMember[] = [
        {
          id: 1,
          name: 'Spinner',
          imageUrl: '',
          shinyImageUrl: '',
          types: ['normal'],
          flavorText: '',
          selectedMoves: ['Rapid Spin', 'DEFOG'],
        } as unknown as TeamMember
      ];

      render(<TeamChecklist team={mixedCaseTeam} theme="light" />);
      // Should find Rapid Spin or Defog under Hazard Removal
      // The component lowercases inputs, so it should match
      const carrier = screen.getByText('Spinner');
      expect(carrier).toBeInTheDocument();
  });
});
