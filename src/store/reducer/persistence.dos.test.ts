import { describe, it, expect } from 'vitest';
import { reducePokemonStorePersistence } from './persistence';
import { PokemonState, Action, SavedTeamEntry } from '../pokemonStoreTypes';
import { UI_CONSTANTS } from '../../constants';

describe('PokemonStore Persistence DoS Vulnerability', () => {
  const initialState: PokemonState = {
    masterPokemonList: [],
    loading: false,
    error: null,
    searchTerm: '',
    selectedGeneration: 'all',
    selectedTypes: [],
    flavorTextSearch: '',
    minStats: {},
    selectedAbility: '',
    isMonoType: false,
    minBST: 0,
    filteredPokemon: [],
    isFiltering: false,
    team: [],
    favorites: new Set(),
    history: [],
    future: [],
    comparisonList: [],
    sortBy: 'id',
    sortOrder: 'asc',
    theme: 'dark',
    accent: 'cyan',
    isShiny: false,
    achievements: {},
    gameStats: {},
    savedTeams: [],
  };

  it('enforces limit on saved teams to prevent DoS', () => {
    let state = { ...initialState };
    // Try to add more than the limit
    const TEAMS_TO_ADD = UI_CONSTANTS.MAX_SAVED_TEAMS + 50;

    for (let i = 0; i < TEAMS_TO_ADD; i++) {
      const entry: SavedTeamEntry = {
        id: `team-${i}`,
        name: `Team ${i}`,
        team: [],
        updatedAt: Date.now(),
      };

      const newState = reducePokemonStorePersistence(state, {
        type: 'SAVE_TEAM_ENTRY',
        payload: entry
      }, {} as any);

      if (newState && 'savedTeams' in newState) {
          state = { ...state, ...newState };
      }
    }

    // Expectation: Capped at MAX_SAVED_TEAMS
    expect(state.savedTeams.length).toBe(UI_CONSTANTS.MAX_SAVED_TEAMS);

    // Verify it kept the most recent ones (the ones added last)
    // Since we prepend: [new, ...old]
    // The last added one should be at index 0
    expect(state.savedTeams[0].id).toBe(`team-${TEAMS_TO_ADD - 1}`);
  });
});
