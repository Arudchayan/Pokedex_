import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProvider, setPokeapiServiceMock } from '../utils';
import TeamMemberEditor from '../../components/team/TeamMemberEditor';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';

describe('TeamMemberEditor DoS Prevention', () => {
  const mockMember = {
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    imageUrl: 'url',
    shinyImageUrl: 'shiny-url',
    flavorText: 'flavor',
    selectedMoves: [],
    stats: [],
    abilities: [],
    evs: {},
    ivs: {},
  };

  it('should have maxLength attribute on item search input to prevent DoS', async () => {
    setPokeapiServiceMock();
    const onSave = vi.fn();
    const onClose = vi.fn();

    renderWithProvider(
      <TeamMemberEditor member={mockMember} onClose={onClose} onSave={onSave} theme="light" />
    );

    // Wait for data loading
    await waitFor(() => {
      expect(screen.queryByText('Loading Editor...')).not.toBeInTheDocument();
    });

    // Find item search input
    const itemSearchInput = screen.getByPlaceholderText('Search for an item...');

    // Expect maxLength to be present and equal to MAX_INPUT_LENGTH
    expect(itemSearchInput).toHaveAttribute('maxLength', String(MAX_INPUT_LENGTH));
  });
});
