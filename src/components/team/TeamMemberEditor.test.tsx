import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider, setPokeapiServiceMock } from '../../test/utils';
import TeamMemberEditor from './TeamMemberEditor';
import { TeamMember } from '../../types';

describe('TeamMemberEditor', () => {
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
      { name: 'speed', value: 45 },
    ],
  };

  const onClose = vi.fn();
  const onSave = vi.fn();

  it('renders stats tab with accessible inputs', async () => {
    setPokeapiServiceMock();
    renderWithProvider(
      <TeamMemberEditor member={mockMember} onClose={onClose} onSave={onSave} theme="dark" />
    );

    // Wait for data to load
    await waitFor(() => expect(screen.queryByText('Loading Editor...')).not.toBeInTheDocument());

    // Check for tab roles (this will fail before implementation)
    const statsTab = screen.getByRole('tab', { name: /Stats & EVs/i });
    expect(statsTab).toBeInTheDocument();
    expect(statsTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(statsTab);
    expect(statsTab).toHaveAttribute('aria-selected', 'true');

    // Check for accessible inputs (this will fail before implementation)
    // Using loose matching for "HP IV", "Attack EV slider" etc.
    expect(screen.getByLabelText(/^HP IV$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Attack EV slider$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Attack EV value$/i)).toBeInTheDocument();

    // Check nature tooltip/label on total
    // Assuming neutral nature by default
    const totalElements = screen.getAllByLabelText(/Total .* \(Neutral\)/i);
    expect(totalElements.length).toBeGreaterThan(0);
  });
});
