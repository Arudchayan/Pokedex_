import type { Action, PokemonState, ReducerContext, GameStats } from '../pokemonStoreTypes';
import { UI_CONSTANTS } from '../../constants';

const HISTORY_LIMIT = 10;

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = (today: string): string => {
  const parts = today.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialGameStats = (gameId: string): GameStats => ({
  gameId,
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: null,
  history: [],
});

export function reducePokemonStorePersistence(
  state: PokemonState,
  action: Action,
  _ctx: ReducerContext
): Partial<PokemonState> | PokemonState | undefined {
  switch (action.type) {
    case 'UNLOCK_ACHIEVEMENT': {
      const id = action.payload;
      if (state.achievements[id]) return state;
      return { achievements: { ...state.achievements, [id]: Date.now() } };
    }

    case 'RECORD_GAME_RESULT': {
      const { gameId, win } = action.payload;
      const today = getTodayDateString();
      const current = state.gameStats[gameId] || initialGameStats(gameId);
      if (current.lastPlayedDate === today) return state;

      const yesterday = getYesterdayDateString(today);
      let newStreak = current.currentStreak;
      if (win) {
        newStreak = current.lastPlayedDate === yesterday ? newStreak + 1 : 1;
      } else {
        newStreak = 0;
      }

      const updatedStats: GameStats = {
        ...current,
        gamesPlayed: current.gamesPlayed + 1,
        gamesWon: win ? current.gamesWon + 1 : current.gamesWon,
        currentStreak: newStreak,
        maxStreak: Math.max(current.maxStreak, newStreak),
        lastPlayedDate: today,
        history: [
          { date: today, result: (win ? 'won' : 'lost') as 'won' | 'lost' },
          ...current.history,
        ].slice(0, HISTORY_LIMIT),
      };

      return { gameStats: { ...state.gameStats, [gameId]: updatedStats } };
    }

    case 'SAVE_TEAM_ENTRY': {
      const newTeams = [action.payload, ...state.savedTeams];
      // SECURITY: Enforce limit to prevent DoS
      if (newTeams.length > UI_CONSTANTS.MAX_SAVED_TEAMS) {
        return { savedTeams: newTeams.slice(0, UI_CONSTANTS.MAX_SAVED_TEAMS) };
      }
      return { savedTeams: newTeams };
    }

    case 'DELETE_SAVED_TEAM':
      return { savedTeams: state.savedTeams.filter((t) => t.id !== action.payload) };

    case 'SET_SAVED_TEAMS': {
      let teams = action.payload;
      // SECURITY: Enforce limit to prevent DoS
      if (teams.length > UI_CONSTANTS.MAX_SAVED_TEAMS) {
        teams = teams.slice(0, UI_CONSTANTS.MAX_SAVED_TEAMS);
      }
      return { savedTeams: teams };
    }

    default:
      return undefined;
  }
}
