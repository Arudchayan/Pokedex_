import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { ToastProvider } from '../../context/ToastContext';
import { AchievementProvider } from '../../context/AchievementContext';
import DataManagement from '../../components/shared/DataManagement';

const { setTeamMock, setFavoritesMock, setSavedTeamsMock, setThemeMock, saveTeamEntryMock } =
  vi.hoisted(() => ({
    setTeamMock: vi.fn(),
    setFavoritesMock: vi.fn(),
    setSavedTeamsMock: vi.fn(),
    setThemeMock: vi.fn(),
    saveTeamEntryMock: vi.fn(),
  }));

vi.mock('../../context/PokemonContext', () => ({
  usePokemon: () => ({
    theme: 'dark',
    team: [],
    teamPokemon: [],
    favorites: new Set<number>(),
    masterPokemonList: [],
  }),
}));

// Mock the store to intercept typed method calls.
// usePokemonStore is both a hook (callable with selector) and has .getState()
vi.mock('../../store/usePokemonStore', () => {
  const mockStoreState: Record<string, any> = {
    setTeam: (...args: any[]) => setTeamMock(...args),
    setFavorites: (...args: any[]) => setFavoritesMock(...args),
    setSavedTeams: (...args: any[]) => setSavedTeamsMock(...args),
    setTheme: (...args: any[]) => setThemeMock(...args),
    saveTeamEntry: (...args: any[]) => saveTeamEntryMock(...args),
    achievements: {},
    unlockAchievement: vi.fn(),
    theme: 'dark',
    team: [],
    favorites: new Set<number>(),
    masterPokemonList: [],
    savedTeams: [],
    gameStats: {},
  };

  const usePokemonStoreFn = (selector?: any) => {
    if (typeof selector === 'function') return selector(mockStoreState);
    return mockStoreState;
  };
  usePokemonStoreFn.getState = () => mockStoreState;

  return {
    usePokemonStore: usePokemonStoreFn,
  };
});

// Mock utils/favorites to track calls
vi.mock('../../utils/favorites', () => ({
  getFavorites: vi.fn(() => new Set()),
  saveFavorites: vi.fn(),
  toggleFavorite: vi.fn(),
  isFavorite: vi.fn(),
}));

// Mock utils/teamStorage validators used during import
vi.mock('../../utils/teamStorage', () => ({
  getSavedTeam: vi.fn(() => []),
  saveTeam: vi.fn(),
  validateTeamMember: vi.fn((x) => x),
  validateSavedTeam: vi.fn((x) => x),
  getSavedTeamList: vi.fn(() => []),
  saveTeamList: vi.fn(),
}));

// Mock the backup parser so oversized/partial fixtures are accepted and the
// restore flow can be driven without a full schema.
vi.mock('../../utils/persistenceSchema', () => ({
  PERSISTENCE_VERSION: '1.0',
  isPersistenceData: () => true,
  buildPersistenceData: () => ({}),
  parsePersistenceBackup: (raw: string) => {
    const data = JSON.parse(raw);
    return {
      ok: true,
      backup: {
        team: Array.isArray(data.team) ? data.team : [],
        favorites: Array.isArray(data.favorites) ? data.favorites : [],
        savedTeams: [],
        theme: 'dark',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    };
  },
}));

const confirmRestore = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Restore Backup' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm Restore' }));
};

describe('DataManagement DoS Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTeamMock.mockClear();
    setFavoritesMock.mockClear();
    setSavedTeamsMock.mockClear();
    setThemeMock.mockClear();
  });

  it('batches favorite updates to prevent storage thrashing', () => {
    render(
      <ToastProvider>
        <AchievementProvider>
          <DataManagement onClose={() => {}} />
        </AchievementProvider>
      </ToastProvider>
    );

    // Create a large list of favorites to import (e.g. 50 items)
    const largeFavoritesList = Array.from({ length: 50 }, (_, i) => i + 1);
    const importData = JSON.stringify({
      favorites: largeFavoritesList,
    });

    const textarea = screen.getByPlaceholderText('Paste JSON here...');
    fireEvent.change(textarea, { target: { value: importData } });
    confirmRestore();

    // Should replace favorites in ONE store update, not 50.
    expect(setFavoritesMock).toHaveBeenCalledTimes(1);

    // Verify the set passed to the store contains all items
    const calledSet = setFavoritesMock.mock.calls[0][0];
    expect(calledSet.size).toBe(50);
  });

  it('batches team updates to prevent storage thrashing', () => {
    render(
      <ToastProvider>
        <AchievementProvider>
          <DataManagement onClose={() => {}} />
        </AchievementProvider>
      </ToastProvider>
    );

    // Create a team list
    const teamList = [
      { id: 1, name: 'Bulbasaur' },
      { id: 4, name: 'Charmander' },
      { id: 7, name: 'Squirtle' },
    ];
    const importData = JSON.stringify({
      team: teamList,
    });

    const textarea = screen.getByPlaceholderText('Paste JSON here...');
    fireEvent.change(textarea, { target: { value: importData } });
    confirmRestore();

    // The key DoS mitigation is calling setTeam once (not N individual add actions).
    expect(setTeamMock).toHaveBeenCalledTimes(1);
    expect(setTeamMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 4 }),
        expect.objectContaining({ id: 7 }),
      ])
    );
  });
});
