import type { AccentColor } from '../constants';
import type { PokemonListItem, TeamMember } from '../types';
import type { SortOption } from '../types/sorting';

// ---------------------------------------------------------------------------
// Consolidated persistence types (previously scattered across multiple files)
// ---------------------------------------------------------------------------

export interface GameStats {
  gameId: string;
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null; // YYYY-MM-DD
  history: { date: string; result: 'won' | 'lost' }[];
}

export interface SavedTeamEntry {
  id: string;
  name: string;
  team: TeamMember[];
  updatedAt: number;
}

export interface PokemonState {
  // Data
  masterPokemonList: PokemonListItem[];
  loading: boolean;
  error: string | null;

  // Filters & Search
  searchTerm: string;
  selectedGeneration: string;
  selectedTypes: string[];
  flavorTextSearch: string;
  minStats: Record<string, number>;
  selectedAbility: string;
  isMonoType: boolean;
  minBST: number;

  // Derived/Filtered Data
  filteredPokemon: PokemonListItem[];
  isFiltering: boolean;

  // User Data (normalized: store IDs, resolve to objects via selectors)
  team: number[];
  favorites: Set<number>;

  // Team History for Undo/Redo (normalized: ID arrays)
  history: number[][];
  future: number[][];

  // Comparisons (normalized: ID array)
  comparisonList: number[];

  // Sorting
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';

  // UI State
  theme: 'dark' | 'light';
  accent: AccentColor;
  isShiny: boolean;

  // Consolidated persistence (achievements, game stats, saved teams)
  achievements: Record<string, number>; // achievement id → unlock timestamp
  gameStats: Record<string, GameStats>;
  savedTeams: SavedTeamEntry[];
}

export type Action =
  | { type: 'SET_POKEMON_LIST'; payload: PokemonListItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_GENERATION'; payload: string }
  | { type: 'TOGGLE_TYPE'; payload: string }
  | { type: 'SET_MIN_STAT'; payload: { stat: string; value: number } }
  | { type: 'SET_ABILITY'; payload: string }
  | { type: 'TOGGLE_MONO_TYPE' }
  | { type: 'SET_MIN_BST'; payload: number }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_FLAVOR_TEXT_SEARCH'; payload: string }
  | { type: 'ADD_TO_TEAM'; payload: PokemonListItem }
  | { type: 'REMOVE_FROM_TEAM'; payload: number }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: { id: number; updates: Partial<TeamMember> } }
  | { type: 'REORDER_TEAM'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'CLEAR_TEAM' }
  | { type: 'SET_TEAM'; payload: PokemonListItem[] }
  | { type: 'UNDO_TEAM' }
  | { type: 'REDO_TEAM' }
  | { type: 'SET_FAVORITES'; payload: Set<number> }
  | { type: 'TOGGLE_FAVORITE'; payload: number }
  | { type: 'ADD_TO_COMPARISON'; payload: PokemonListItem }
  | { type: 'REMOVE_FROM_COMPARISON'; payload: number }
  | { type: 'CLEAR_COMPARISON' }
  | { type: 'SET_COMPARISON_LIST'; payload: number[] }
  | { type: 'SET_SORT'; payload: { sortBy: SortOption; sortOrder: 'asc' | 'desc' } }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_THEME'; payload: 'dark' | 'light' }
  | { type: 'SET_ACCENT'; payload: AccentColor }
  | { type: 'TOGGLE_SHINY' }
  // Consolidated persistence actions
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'RECORD_GAME_RESULT'; payload: { gameId: string; win: boolean } }
  | { type: 'SAVE_TEAM_ENTRY'; payload: SavedTeamEntry }
  | { type: 'DELETE_SAVED_TEAM'; payload: string }
  | { type: 'SET_SAVED_TEAMS'; payload: SavedTeamEntry[] };

export interface ReducerContext {
  teamCapacity: number;
  maxComparison: number;
  maxHistory: number;
}
