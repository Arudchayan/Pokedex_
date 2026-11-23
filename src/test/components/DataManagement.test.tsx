import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataManagement from '../../components/shared/DataManagement';
import { renderWithProvider } from '../utils';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import { PERSISTENCE_VERSION } from '../../utils/persistenceSchema';
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

const existingSavedTeam = {
  id: 'existing-team',
  name: 'Existing Team',
  team: [],
  updatedAt: 111,
};

const makeBackup = (overrides: Record<string, unknown> = {}) => ({
  version: PERSISTENCE_VERSION,
  timestamp: '2024-01-01T00:00:00.000Z',
  theme: 'light',
  team: [
    {
      id: 25,
      name: 'pikachu',
      imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      shinyImageUrl:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png',
      types: ['electric'],
      flavorText: 'Mouse Pokemon',
    },
  ],
  favorites: [25, 133],
  savedTeams: [
    {
      id: 'saved-1',
      name: 'Kanto Team',
      team: [],
      updatedAt: 123456,
    },
  ],
  ...overrides,
});

const seedCurrentData = () => {
  usePokemonStore.setState({
    team: [1],
    teamCustomizations: {},
    favorites: new Set([1]),
    savedTeams: [existingSavedTeam],
    history: [],
    future: [],
    theme: 'dark',
  });
};

const openImport = () => {
  renderWithProvider(<DataManagement onClose={() => {}} />);
  return screen.getByPlaceholderText('Paste JSON here...');
};

const getDataManagementDialog = () => screen.getByRole('dialog', { name: 'Data Management' });

const getImportError = () => within(getDataManagementDialog()).getByRole('alert');

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
      achievements: {},
      gameStats: {},
      history: [],
      future: [],
      theme: 'dark',
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

  it('shows an inline error and keeps restore disabled for invalid JSON', () => {
    seedCurrentData();
    const textarea = openImport();

    fireEvent.change(textarea, { target: { value: '{ not json ' } });

    expect(getImportError()).toHaveTextContent(/invalid json/i);
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Restore Backup' })).toBeDisabled();

    const state = usePokemonStore.getState();
    expect(state.team).toEqual([1]);
    expect(Array.from(state.favorites)).toEqual([1]);
    expect(state.savedTeams).toEqual([existingSavedTeam]);
    expect(state.theme).toBe('dark');
  });

  it('previews a valid backup without applying it until confirmed', () => {
    seedCurrentData();
    const textarea = openImport();

    fireEvent.change(textarea, { target: { value: JSON.stringify(makeBackup()) } });

    expect(within(getDataManagementDialog()).queryByRole('alert')).not.toBeInTheDocument();
    const restoreButton = screen.getByRole('button', { name: 'Restore Backup' });
    expect(restoreButton).toBeEnabled();

    fireEvent.click(restoreButton);

    const dialog = screen.getByRole('alertdialog', { name: 'Confirm restore' });
    expect(dialog).toHaveTextContent(/replaces your current team/i);
    expect(within(dialog).getByText('Team members').parentElement).toHaveTextContent('1');
    expect(within(dialog).getByText('Favorites').parentElement).toHaveTextContent('2');
    expect(within(dialog).getByText('Saved teams').parentElement).toHaveTextContent('1');
    expect(within(dialog).getByText('Theme').parentElement).toHaveTextContent('light');

    // Nothing is written until the explicit confirmation.
    const state = usePokemonStore.getState();
    expect(state.team).toEqual([1]);
    expect(Array.from(state.favorites)).toEqual([1]);
    expect(state.savedTeams).toEqual([existingSavedTeam]);
    expect(state.theme).toBe('dark');
  });

  it('leaves current data untouched when the restore is cancelled', () => {
    seedCurrentData();
    const textarea = openImport();
    const backupJson = JSON.stringify(makeBackup());

    fireEvent.change(textarea, { target: { value: backupJson } });
    fireEvent.click(screen.getByRole('button', { name: 'Restore Backup' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(textarea).toHaveValue(backupJson);

    const state = usePokemonStore.getState();
    expect(state.team).toEqual([1]);
    expect(Array.from(state.favorites)).toEqual([1]);
    expect(state.savedTeams).toEqual([existingSavedTeam]);
    expect(state.theme).toBe('dark');
  });

  it('replaces current data exactly after confirmation and shows success', async () => {
    seedCurrentData();
    const textarea = openImport();
    const backup = makeBackup({ unknownKey: { ignored: true } });

    fireEvent.change(textarea, { target: { value: JSON.stringify(backup) } });
    fireEvent.click(screen.getByRole('button', { name: 'Restore Backup' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Restore' }));

    await waitFor(() => {
      const state = usePokemonStore.getState();
      expect(state.team).toEqual([25]);
      expect(Array.from(state.favorites)).toEqual([25, 133]);
      expect(state.savedTeams).toEqual(backup.savedTeams);
      expect(state.theme).toBe('light');
    });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Restored 1 team member, 2 favorites, and 1 saved team.'
    );
    expect(textarea).toHaveValue('');
  });

  it('rejects an unsupported backup version without writing anything', () => {
    seedCurrentData();
    const textarea = openImport();

    fireEvent.change(textarea, {
      target: { value: JSON.stringify(makeBackup({ version: '2.0' })) },
    });

    expect(getImportError()).toHaveTextContent(/unsupported backup version "2.0"/i);
    expect(screen.getByRole('button', { name: 'Restore Backup' })).toBeDisabled();

    const state = usePokemonStore.getState();
    expect(state.team).toEqual([1]);
    expect(Array.from(state.favorites)).toEqual([1]);
    expect(state.savedTeams).toEqual([existingSavedTeam]);
  });

  it('rejects a malformed backup without partial application', () => {
    seedCurrentData();
    const textarea = openImport();

    fireEvent.change(textarea, {
      target: { value: JSON.stringify(makeBackup({ team: 'not-an-array' })) },
    });

    expect(getImportError()).toHaveTextContent(/does not match the expected schema/i);
    expect(screen.getByRole('button', { name: 'Restore Backup' })).toBeDisabled();

    const state = usePokemonStore.getState();
    expect(state.team).toEqual([1]);
    expect(Array.from(state.favorites)).toEqual([1]);
    expect(state.savedTeams).toEqual([existingSavedTeam]);
    expect(state.theme).toBe('dark');
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
