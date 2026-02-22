import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProvider, setPokeapiServiceMock } from '../utils';
import TeamMemberEditor from '../../components/team/TeamMemberEditor';
import { TeamMember } from '../../types';

describe('TeamMemberEditor Accessibility', () => {
  const mockMember: TeamMember = {
    id: 1,
    name: 'bulbasaur',
    imageUrl: 'img1.png',
    shinyImageUrl: '',
    types: ['grass', 'poison'],
    flavorText: '',
    stats: [
        { name: 'hp', value: 45 },
        { name: 'attack', value: 49 },
        { name: 'defense', value: 49 },
        { name: 'special-attack', value: 65 },
        { name: 'special-defense', value: 65 },
        { name: 'speed', value: 45 }
    ],
  };

  const onClose = vi.fn();
  const onSave = vi.fn();

  it('renders item search dropdown with accessible roles', async () => {
    setPokeapiServiceMock({
        fetchAllItems: [
            { id: 1, name: 'leftovers', cost: 0, flavorText: 'Restores HP', imageUrl: 'leftovers.png' },
            { id: 2, name: 'choice-band', cost: 0, flavorText: 'Boosts Atk', imageUrl: 'choice-band.png' }
        ]
    });

    renderWithProvider(
      <TeamMemberEditor
        member={mockMember}
        onClose={onClose}
        onSave={onSave}
        theme="dark"
      />
    );

    // Wait for data to load
    await waitFor(() => expect(screen.queryByText('Loading Editor...')).not.toBeInTheDocument());

    // Find the item input and type
    const itemInput = screen.getByPlaceholderText(/Search for an item/i);
    fireEvent.change(itemInput, { target: { value: 'le' } });
    fireEvent.focus(itemInput);

    // Wait for dropdown
    await waitFor(() => expect(screen.getByText('leftovers')).toBeInTheDocument());

    // Accessibility Checks
    // 1. The container should be a listbox
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // 2. Options should be buttons with role="option"
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(1); // 'leftovers' matches 'le'
    expect(options[0]).toHaveTextContent('leftovers');
    expect(options[0].tagName).toBe('BUTTON');
  });
});
