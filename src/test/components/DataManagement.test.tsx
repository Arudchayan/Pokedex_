import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataManagement from '../../components/shared/DataManagement';
import { renderWithProvider } from '../utils';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import * as teamStorage from '../../utils/teamStorage';
import * as teamExport from '../../utils/teamExport';

// Mock scrollTo to prevent JSDOM errors
window.scrollTo = vi.fn();

// Mock URL.createObjectURL and HTMLAnchorElement click
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock dependencies
vi.mock('../../utils/teamStorage', async (importOriginal) => {
  const actual = await importOriginal<typeof teamStorage>();
  return {
    ...actual,
    getSavedTeamList: vi.fn(),
    saveTeamList: vi.fn(),
  };
});

vi.mock('../../utils/teamExport', () => ({
  importFromShowdown: vi.fn(),
}));

describe('DataManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('exports saved teams', () => {
    const mockSavedTeams = [{ id: '123', name: 'My Team', team: [], updatedAt: 12345 }];
    vi.mocked(teamStorage.getSavedTeamList).mockReturnValue(mockSavedTeams as any);

    renderWithProvider(<DataManagement onClose={() => {}} />);

    const downloadBtn = screen.getByText('Download JSON');
    fireEvent.click(downloadBtn);

    // Verify getSavedTeamList was called
    expect(teamStorage.getSavedTeamList).toHaveBeenCalled();
  });

  it('imports saved teams and merges them', async () => {
    vi.mocked(teamStorage.getSavedTeamList).mockReturnValue([]);

    renderWithProvider(<DataManagement onClose={() => {}} />);

    // We need a valid team structure because validateSavedTeam checks it
    const savedTeamsPayload = [
      {
        id: 'new-team',
        name: 'Imported Team',
        team: [], // Empty team array is valid per validateSavedTeam check if it's an array
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
      expect(teamStorage.saveTeamList).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'new-team', name: 'Imported Team' })])
      );
    });
  });

  it('handles ID collision by generating new ID', async () => {
    const existingTeam = { id: 'collision-id', name: 'Existing Team', team: [], updatedAt: 111 };
    vi.mocked(teamStorage.getSavedTeamList).mockReturnValue([existingTeam as any]);

    // Mock crypto.randomUUID
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
      // Should have called saveTeamList with existing team AND imported team with NEW ID
      expect(teamStorage.saveTeamList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'collision-id', name: 'Existing Team' }),
          expect.objectContaining({ id: newUUID, name: 'Imported Collision Team' }),
        ])
      );
    });

    // Cleanup
    if (originalRandomUUID)
      Object.defineProperty(crypto, 'randomUUID', { value: originalRandomUUID });
  });

  it('imports Showdown team to saved teams', async () => {
    vi.mocked(teamStorage.getSavedTeamList).mockReturnValue([]);
    // Mock valid team return
    const mockTeam = [{ id: 25, name: 'Pikachu', types: ['electric'], imageUrl: 'url' }];
    vi.mocked(teamExport.importFromShowdown).mockReturnValue(mockTeam as any);

    // Mock crypto.randomUUID
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
      expect(teamStorage.saveTeamList).toHaveBeenCalledWith(
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
