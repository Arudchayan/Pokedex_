import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, render } from '@testing-library/react';
import { ToastProvider } from '../../context/ToastContext';
import { AchievementProvider } from '../../context/AchievementContext';
import DataManagement from '../../components/shared/DataManagement';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';

const { setTeamMock, setFavoritesMock } = vi.hoisted(() => ({
  setTeamMock: vi.fn(),
  setFavoritesMock: vi.fn(),
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

vi.mock('../../store/usePokemonStore', () => {
  const mockStoreState: Record<string, any> = {
    setTeam: (...args: any[]) => setTeamMock(...args),
    setFavorites: (...args: any[]) => setFavoritesMock(...args),
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

vi.mock('../../utils/favorites', () => ({
  getFavorites: vi.fn(() => new Set()),
  saveFavorites: vi.fn(),
  toggleFavorite: vi.fn(),
  isFavorite: vi.fn(),
}));

vi.mock('../../utils/teamStorage', () => ({
  getSavedTeam: vi.fn(() => []),
  saveTeam: vi.fn(),
  validateTeamMember: vi.fn((x) => x),
  getSavedTeamList: vi.fn(() => []),
  saveTeamList: vi.fn(),
}));

// Mock utils/persistenceSchema to bypass strict validation if needed
vi.mock('../../utils/persistenceSchema', () => ({
  isPersistenceData: () => true,
  buildPersistenceData: () => ({}),
}));

describe('DataManagement Input DoS Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent state update when JSON input exceeds MAX_INPUT_LENGTH', () => {
    render(
      <ToastProvider>
        <AchievementProvider>
          <DataManagement onClose={() => {}} />
        </AchievementProvider>
      </ToastProvider>
    );

    const textarea = screen.getByPlaceholderText('Paste JSON here...');
    const longString = 'a'.repeat(MAX_INPUT_LENGTH + 100);

    // Attempt to paste huge string
    fireEvent.change(textarea, { target: { value: longString } });

    // EXPECT PROTECTION: The value should NOT update to the huge string
    // It should remain empty (default) or truncated
    expect(textarea).not.toHaveValue(longString);
    expect(textarea).toHaveValue('');
  });

  it('should prevent state update when Showdown input exceeds MAX_INPUT_LENGTH', () => {
    render(
      <ToastProvider>
        <AchievementProvider>
          <DataManagement onClose={() => {}} />
        </AchievementProvider>
      </ToastProvider>
    );

    const textarea = screen.getByPlaceholderText(/Pikachu @ Light Ball/i);
    const longString = 'a'.repeat(MAX_INPUT_LENGTH + 100);

    // Attempt to paste huge string
    fireEvent.change(textarea, { target: { value: longString } });

    // EXPECT PROTECTION: The value should NOT update to the huge string
    expect(textarea).not.toHaveValue(longString);
    expect(textarea).toHaveValue('');
  });
});
