import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SavedTeamsModal from '../../components/team/SavedTeamsModal';
import { TeamMember } from '../../types';
import { usePokemonStore } from '../../store/usePokemonStore';

const mockTeam: TeamMember[] = [
  {
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    imageUrl: 'img.png',
    shinyImageUrl: 'shiny.png',
    stats: [],
    moves: [],
    item: null,
    nature: 'Adamant',
    ivs: {},
    evs: {},
    level: 50,
    ability: 'Overgrow',
  },
];

const mockSavedTeams = [
  {
    id: 'team-1',
    name: 'My Team 1',
    team: mockTeam,
    updatedAt: Date.now(),
  },
];

describe('SavedTeamsModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set up the Zustand store with mock saved teams
    usePokemonStore.setState({
      savedTeams: mockSavedTeams,
    });
  });

  it('renders correctly when open', () => {
    render(
      <SavedTeamsModal
        isOpen={true}
        onClose={() => {}}
        currentTeam={mockTeam}
        onLoadTeam={() => {}}
        theme="light"
      />
    );

    expect(screen.getByText('Saved Teams')).toBeDefined();
    expect(screen.getByText('My Team 1')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g., Rain Dance Team')).toBeDefined();
    // Verify accessibility label added
    expect(screen.getByLabelText('New team name')).toBeDefined();
  });

  it('requires confirmation to delete a team', () => {
    render(
      <SavedTeamsModal
        isOpen={true}
        onClose={() => {}}
        currentTeam={mockTeam}
        onLoadTeam={() => {}}
        theme="light"
      />
    );

    const deleteBtn = screen.getByLabelText('Delete team');

    // First click: Should NOT delete, but change text
    fireEvent.click(deleteBtn);
    expect(screen.getByText('Confirm?')).toBeDefined();

    // Verify aria-label change
    expect(screen.getByLabelText('Confirm deletion')).toBeDefined();

    // Second click: Should delete via Zustand store
    fireEvent.click(deleteBtn);

    // The team should disappear from the UI (store is updated)
    expect(screen.queryByText('My Team 1')).toBeNull();
  });
});
