import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataManagement from '../../components/shared/DataManagement';
import { renderWithProvider } from '../utils';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import * as teamExport from '../../utils/teamExport';
import { usePokemonStore } from '../../store/usePokemonStore';

// Mock scrollTo to prevent JSDOM errors
window.scrollTo = vi.fn();

// Mock URL.createObjectURL and HTMLAnchorElement click
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

vi.mock('../../utils/teamExport', () => ({
  importFromShowdown: vi.fn(),
}));

describe('DataManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    usePokemonStore.setState({
      savedTeams: [],
      team: [],
      teamCustomizations: {},
      favorites: new Set(),
      masterPokemonList: [],
    });
  });

  it('renders correctly', () => {
    renderWithProvider(<DataManagement onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Data Management' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste JSON here...')).toBeInTheDocument();
  });

  it('validates input length on textarea', () => {
    renderWithProvider(<DataManagement onClose={() => {}} />);
    const textarea = screen.getByPlaceholderText('Paste JSON here...');
    expect(textarea).toHaveAttribute('maxLength', String(MAX_INPUT_LENGTH));
  });

  it('exports saved teams from the Zustand store', () => {
    usePokemonStore.setState({
      savedTeams: [{ id: '123', name: 'My Team', team: [], updatedAt: 12345 }],
    });

    renderWithProvider(<DataManagement onClose={() => {}} />);

    const downloadBtn = screen.getByText('Download JSON');
    fireEvent.click(downloadBtn);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('imports saved teams and merges them into the store', async () => {
    renderWithProvider(<DataManagement onClose={() => {}} />);

    const savedTeamsPayload = [
      {
        id: 'new-team',
        name: 'Imported Team',
        team: [],
        updatedAt: 123456,
      },
    ];

    const importData = JSON.stringify({
      version: '1.0',
      timestamp: '2024-01-01',
      theme: 'light',
      team: [],
      favorites: [],
      savedTeams: savedTeamsPayload,
    });

    const textarea = screen.getByPlaceholderText('Paste JSON here...');
    fireEvent.change(textarea, { target: { value: importData } });

    const importBtn = screen.getByRole('button', { name: 'Restore Backup' });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(usePokemonStore.getState().savedTeams).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'new-team', name: 'Imported Team' })])
      );
    });
  });

  it('handles ID collision by generating new ID', async () => {
    const existingTeam = { id: 'collision-id', name: 'Existing Team', team: [], updatedAt: 111 };
    usePokemonStore.setState({ savedTeams: [existingTeam] });

    const newUUID = 'new-unique-id';
    const originalRandomUUID = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', { value: vi.fn(() => newUUID), writable: true });

    renderWithProvider(<DataManagement onClose={() => {}} />);

    const savedTeamsPayload = [
      {
        id: 'collision-id',
        name: 'Imported Collision Team',
        team: [],
        updatedAt: 222,
      },
    ];

    const importData = JSON.stringify({
      version: '1.0',
      timestamp: '2024-01-01',
      theme: 'light',
      team: [],
      favorites: [],
      savedTeams: savedTeamsPayload,
    });

    const textarea = screen.getByPlaceholderText('Paste JSON here...');
    fireEvent.change(textarea, { target: { value: importData } });

    const importBtn = screen.getByRole('button', { name: 'Restore Backup' });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(usePokemonStore.getState().savedTeams).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'collision-id', name: 'Existing Team' }),
          expect.objectContaining({ id: newUUID, name: 'Imported Collision Team' }),
        ])
      );
    });

    if (originalRandomUUID)
      Object.defineProperty(crypto, 'randomUUID', { value: originalRandomUUID });
  });

  it('imports Showdown team to saved teams', async () => {
    const mockTeam = [{ id: 25, name: 'Pikachu', types: ['electric'], imageUrl: 'url' }];
    vi.mocked(teamExport.importFromShowdown).mockReturnValue(mockTeam as any);

    const newUUID = 'showdown-team-id';
    const originalRandomUUID = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', { value: vi.fn(() => newUUID), writable: true });

    renderWithProvider(<DataManagement onClose={() => {}} />);

    const nameInput = screen.getByLabelText('Team Name');
    fireEvent.change(nameInput, { target: { value: 'My Showdown Team' } });

    const textarea = screen.getByLabelText('Paste Showdown Text');
    fireEvent.change(textarea, { target: { value: 'Pikachu @ Light Ball' } });

    const saveBtn = screen.getByRole('button', { name: 'Save to My Teams' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(teamExport.importFromShowdown).toHaveBeenCalled();
      expect(usePokemonStore.getState().savedTeams).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: newUUID,
            name: 'My Showdown Team',
            team: mockTeam,
          }),
        ])
      );
    });

    if (originalRandomUUID)
      Object.defineProperty(crypto, 'randomUUID', { value: originalRandomUUID });
  });
});
