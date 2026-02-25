import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PokemonListItem, TeamMember } from '../types';
import { ACCENT_COLORS, type AccentColor } from '../constants';
import type { SortOption } from '../types/sorting';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type {
  Action,
  PokemonState,
  ReducerContext,
  GameStats,
  SavedTeamEntry,
} from './pokemonStoreTypes';
import { reducePokemonStore } from './pokemonStoreReducer';
import { validateSavedTeam } from '../utils/teamStorage';

// Cyberpunk Mode Detection
const CYBERPUNK_ACCENTS: AccentColor[] = [
  'neonPink',
  'neonCyan',
  'neonYellow',
  'neonGreen',
  'neonOrange',
  'neonPurple',
];

export const isCyberpunkAccent = (accent: AccentColor): boolean => {
  return CYBERPUNK_ACCENTS.includes(accent);
};

export type { Action, PokemonState };

// Store Actions Interface
export interface PokemonActions {
  // Data-loading helpers (used by PokemonContext query sync).
  setMasterPokemonList: (list: PokemonListItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Typed action helpers.
  setSearchTerm: (term: string) => void;
  setGeneration: (generation: string) => void;
  toggleType: (type: string) => void;
  setMinStat: (stat: string, value: number) => void;
  setAbility: (ability: string) => void;
  toggleMonoType: () => void;
  setMinBST: (value: number) => void;
  clearFilters: () => void;
  setFlavorTextSearch: (value: string) => void;

  addToTeam: (pokemon: PokemonListItem) => void;
  removeFromTeam: (id: number) => void;
  updateTeamMember: (id: number, updates: Partial<TeamMember>) => void;
  reorderTeam: (fromIndex: number, toIndex: number) => void;
  clearTeam: () => void;
  setTeam: (team: PokemonListItem[]) => void;

  setFavorites: (favorites: Set<number>) => void;
  toggleFavorite: (id: number) => void;

  addToComparison: (pokemon: PokemonListItem) => void;
  removeFromComparison: (id: number) => void;
  clearComparison: () => void;
  setComparisonList: (ids: number[]) => void;

  setSort: (sortBy: SortOption, sortOrder: 'asc' | 'desc') => void;
  setPokedex: (pokedex: string) => void;

  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setAccent: (accent: AccentColor) => void;
  toggleShiny: () => void;

  setFilteredPokemon: (list: PokemonListItem[]) => void;
  setIsFiltering: (isFiltering: boolean) => void;
  setReload: (reload: () => Promise<void>) => void;
  reload: () => Promise<void>;
  undo: () => void;
  redo: () => void;

  // Consolidated persistence actions
  unlockAchievement: (id: string) => void;
  recordGameResult: (gameId: string, win: boolean) => void;
  saveTeamEntry: (entry: SavedTeamEntry) => void;
  deleteSavedTeam: (id: string) => void;
  setSavedTeams: (teams: SavedTeamEntry[]) => void;
}

const TEAM_CAPACITY = env.teamCapacity;
const MAX_COMPARISON = env.maxComparison;
const MAX_HISTORY = 20;
const reducerContext: ReducerContext = {
  teamCapacity: TEAM_CAPACITY,
  maxComparison: MAX_COMPARISON,
  maxHistory: MAX_HISTORY,
};

const initialState: PokemonState = {
  masterPokemonList: [],
  loading: true,
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
  selectedPokedex: 'national',
  theme: 'dark',
  accent: 'cyan',
  isShiny: false,

  // Consolidated persistence
  achievements: {},
  gameStats: {},
  savedTeams: [],
};

type PersistedPokemonStorage = {
  team?: unknown;
  favorites?: unknown;
  theme?: unknown;
  accent?: unknown;
  selectedPokedex?: unknown;
  achievements?: unknown;
  gameStats?: unknown;
  savedTeams?: unknown;
  // Allow other persisted keys (versioning, middleware metadata, etc).
  [key: string]: unknown;
};

const isTheme = (value: unknown): value is 'dark' | 'light' =>
  value === 'dark' || value === 'light';

function normalizeAccent(value: unknown, fallback: AccentColor): AccentColor {
  if (typeof value === 'string' && ACCENT_COLORS[value as AccentColor]) return value as AccentColor;
  return fallback;
}

function normalizeTeam(value: unknown, fallback: number[]): number[] {
  if (!Array.isArray(value)) return fallback;
  // Handle both legacy (full objects with .id) and new (plain number) formats.
  return value
    .slice(0, TEAM_CAPACITY)
    .map((item: unknown) => {
      if (typeof item === 'number') return item;
      if (
        item &&
        typeof item === 'object' &&
        'id' in item &&
        typeof (item as any).id === 'number'
      ) {
        return (item as any).id;
      }
      return undefined;
    })
    .filter((id): id is number => id !== undefined);
}

function normalizeFavorites(value: unknown, fallback: Set<number>): Set<number> {
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value.filter((n) => typeof n === 'number'));
  return fallback;
}

function normalizeAchievements(
  value: unknown,
  fallback: Record<string, number>
): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const result: Record<string, number> = {};
  for (const [key, ts] of Object.entries(value as Record<string, unknown>)) {
    if (typeof ts === 'number' && Number.isFinite(ts)) {
      result[key] = ts;
    }
  }
  return Object.keys(result).length > 0 ? result : fallback;
}

function normalizeGameStats(
  value: unknown,
  fallback: Record<string, GameStats>
): Record<string, GameStats> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const result: Record<string, GameStats> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (v && typeof v === 'object' && 'gameId' in (v as any)) {
      result[key] = v as GameStats;
    }
  }
  return result;
}

function normalizeSavedTeams(value: unknown, fallback: SavedTeamEntry[]): SavedTeamEntry[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((entry) => {
      const validated = validateSavedTeam(entry);
      return validated
        ? {
            id: validated.id,
            name: validated.name,
            team: validated.team,
            updatedAt: validated.updatedAt,
          }
        : null;
    })
    .filter((t): t is SavedTeamEntry => t !== null);
}

/**
 * Legacy storage migration — only runs if no Zustand-persisted data exists.
 * Gated behind a version flag so we can remove it safely in a future release.
 * Set LEGACY_MIGRATION_ENABLED to false once all users have migrated.
 */
const LEGACY_MIGRATION_ENABLED = true;

function readLegacyStorage(): Partial<
  Pick<
    PokemonState,
    'team' | 'favorites' | 'theme' | 'accent' | 'achievements' | 'gameStats' | 'savedTeams'
  >
> {
  if (!LEGACY_MIGRATION_ENABLED) return {};

  try {
    const legacy: Partial<
      Pick<
        PokemonState,
        'team' | 'favorites' | 'theme' | 'accent' | 'achievements' | 'gameStats' | 'savedTeams'
      >
    > = {};

    const legacyTeam = localStorage.getItem('pokedex_team');
    if (legacyTeam) {
      const parsed = JSON.parse(legacyTeam);
      if (Array.isArray(parsed)) {
        // Legacy storage may contain full objects; extract IDs.
        legacy.team = parsed
          .slice(0, TEAM_CAPACITY)
          .map((item: any) => (typeof item === 'number' ? item : item?.id))
          .filter((id: any): id is number => typeof id === 'number');
      }
    }

    const legacyFavs = localStorage.getItem('pokedex_favorites');
    if (legacyFavs) {
      const parsed = JSON.parse(legacyFavs);
      if (Array.isArray(parsed)) legacy.favorites = new Set(parsed);
    }

    const legacyTheme = localStorage.getItem('theme');
    if (isTheme(legacyTheme)) legacy.theme = legacyTheme;

    const legacyAccent = localStorage.getItem('accent');
    if (legacyAccent) legacy.accent = normalizeAccent(legacyAccent, initialState.accent);

    // Migrate achievements from standalone localStorage key
    const legacyAchievements = localStorage.getItem('pokedex_achievements');
    if (legacyAchievements) {
      try {
        const parsed = JSON.parse(legacyAchievements);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          legacy.achievements = normalizeAchievements(parsed, {});
        }
      } catch {
        /* non-critical */
      }
    }

    // Migrate game stats from standalone localStorage key
    const legacyGameStats = localStorage.getItem('pokedex_game_stats');
    if (legacyGameStats) {
      try {
        const parsed = JSON.parse(legacyGameStats);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          legacy.gameStats = normalizeGameStats(parsed, {});
        }
      } catch {
        /* non-critical */
      }
    }

    // Migrate saved teams from standalone localStorage key
    const legacySavedTeams = localStorage.getItem('pokedex_saved_teams');
    if (legacySavedTeams) {
      try {
        const parsed = JSON.parse(legacySavedTeams);
        if (Array.isArray(parsed)) {
          legacy.savedTeams = normalizeSavedTeams(parsed, []);
        }
      } catch {
        /* non-critical */
      }
    }

    // Clean up legacy keys after successful migration
    if (Object.keys(legacy).length > 0) {
      logger.debug('Migrated legacy storage keys');
      try {
        localStorage.removeItem('pokedex_team');
        localStorage.removeItem('pokedex_favorites');
        localStorage.removeItem('pokedex_achievements');
        localStorage.removeItem('pokedex_game_stats');
        localStorage.removeItem('pokedex_saved_teams');
      } catch {
        /* non-critical */
      }
    }

    return legacy;
  } catch (e) {
    logger.error('Legacy storage migration failed', e);
    return {};
  }
}

export const usePokemonStore = create<PokemonState & PokemonActions>()(
  devtools(
    persist(
      (set) => {
        const dispatchAction = (action: Action) => {
          // Name actions in Zustand devtools for debuggability.
          set((state) => reducePokemonStore(state, action, reducerContext), false, action.type);
        };

        return {
          ...initialState,

          setFilteredPokemon: (list) => set({ filteredPokemon: list }),
          setIsFiltering: (val) => set({ isFiltering: val }),
          setReload: (reload) => set({ reload }),

          // Data-loading helpers.
          setMasterPokemonList: (list) =>
            dispatchAction({ type: 'SET_POKEMON_LIST', payload: list }),
          setLoading: (loading) => dispatchAction({ type: 'SET_LOADING', payload: loading }),
          setError: (error) => dispatchAction({ type: 'SET_ERROR', payload: error }),

          // Typed helpers (thin wrappers around dispatchAction).
          setSearchTerm: (term) => dispatchAction({ type: 'SET_SEARCH_TERM', payload: term }),
          setGeneration: (generation) =>
            dispatchAction({ type: 'SET_GENERATION', payload: generation }),
          toggleType: (type) => dispatchAction({ type: 'TOGGLE_TYPE', payload: type }),
          setMinStat: (stat, value) =>
            dispatchAction({ type: 'SET_MIN_STAT', payload: { stat, value } }),
          setAbility: (ability) => dispatchAction({ type: 'SET_ABILITY', payload: ability }),
          toggleMonoType: () => dispatchAction({ type: 'TOGGLE_MONO_TYPE' }),
          setMinBST: (value) => dispatchAction({ type: 'SET_MIN_BST', payload: value }),
          clearFilters: () => dispatchAction({ type: 'CLEAR_FILTERS' }),
          setFlavorTextSearch: (value) =>
            dispatchAction({ type: 'SET_FLAVOR_TEXT_SEARCH', payload: value }),

          addToTeam: (pokemon) => dispatchAction({ type: 'ADD_TO_TEAM', payload: pokemon }),
          removeFromTeam: (id) => dispatchAction({ type: 'REMOVE_FROM_TEAM', payload: id }),
          updateTeamMember: (id, updates) =>
            dispatchAction({ type: 'UPDATE_TEAM_MEMBER', payload: { id, updates } }),
          reorderTeam: (fromIndex, toIndex) =>
            dispatchAction({ type: 'REORDER_TEAM', payload: { fromIndex, toIndex } }),
          clearTeam: () => dispatchAction({ type: 'CLEAR_TEAM' }),
          setTeam: (team) => dispatchAction({ type: 'SET_TEAM', payload: team }),

          setFavorites: (favorites) =>
            dispatchAction({ type: 'SET_FAVORITES', payload: favorites }),
          toggleFavorite: (id) => dispatchAction({ type: 'TOGGLE_FAVORITE', payload: id }),

          addToComparison: (pokemon) =>
            dispatchAction({ type: 'ADD_TO_COMPARISON', payload: pokemon }),
          removeFromComparison: (id) =>
            dispatchAction({ type: 'REMOVE_FROM_COMPARISON', payload: id }),
          clearComparison: () => dispatchAction({ type: 'CLEAR_COMPARISON' }),
          setComparisonList: (ids) => dispatchAction({ type: 'SET_COMPARISON_LIST', payload: ids }),

          setSort: (sortBy, sortOrder) =>
            dispatchAction({ type: 'SET_SORT', payload: { sortBy, sortOrder } }),
          setPokedex: (pokedex) => dispatchAction({ type: 'SET_POKEDEX', payload: pokedex }),

          toggleTheme: () => dispatchAction({ type: 'TOGGLE_THEME' }),
          setTheme: (theme) => dispatchAction({ type: 'SET_THEME', payload: theme }),
          setAccent: (accent) => dispatchAction({ type: 'SET_ACCENT', payload: accent }),
          toggleShiny: () => dispatchAction({ type: 'TOGGLE_SHINY' }),

          // Bound by PokemonProvider (React Query). Default is a safe no-op so callers don't explode in tests.
          reload: async () => {},

          undo: () => dispatchAction({ type: 'UNDO_TEAM' }),
          redo: () => dispatchAction({ type: 'REDO_TEAM' }),

          // Consolidated persistence actions
          unlockAchievement: (id) => dispatchAction({ type: 'UNLOCK_ACHIEVEMENT', payload: id }),
          recordGameResult: (gameId, win) =>
            dispatchAction({ type: 'RECORD_GAME_RESULT', payload: { gameId, win } }),
          saveTeamEntry: (entry) => dispatchAction({ type: 'SAVE_TEAM_ENTRY', payload: entry }),
          deleteSavedTeam: (id) => dispatchAction({ type: 'DELETE_SAVED_TEAM', payload: id }),
          setSavedTeams: (teams) => dispatchAction({ type: 'SET_SAVED_TEAMS', payload: teams }),
        };
      },
      {
        name: 'pokedex-storage',
        partialize: (state) => ({
          team: state.team,
          favorites: Array.from(state.favorites),
          theme: state.theme,
          accent: state.accent,
          selectedPokedex: state.selectedPokedex,
          achievements: state.achievements,
          gameStats: state.gameStats,
          savedTeams: state.savedTeams,
        }),
        merge: (persistedState: unknown, currentState) => {
          const persisted = (persistedState ?? {}) as PersistedPokemonStorage;
          const hasNewStorage = Boolean(persisted && (persisted.team || persisted.favorites));
          const legacy = hasNewStorage ? {} : readLegacyStorage();

          const team = normalizeTeam(
            hasNewStorage ? persisted.team : legacy.team,
            currentState.team
          );
          const favorites = normalizeFavorites(
            hasNewStorage ? persisted.favorites : legacy.favorites,
            currentState.favorites
          );
          const themeCandidate = hasNewStorage ? persisted.theme : legacy.theme;
          const theme = isTheme(themeCandidate) ? themeCandidate : currentState.theme;
          const accentCandidate = hasNewStorage ? persisted.accent : legacy.accent;
          const accent = normalizeAccent(accentCandidate, currentState.accent);
          const pokedexCandidate = hasNewStorage ? persisted.selectedPokedex : persisted.selectedPokedex;
          const selectedPokedex =
            typeof pokedexCandidate === 'string' ? pokedexCandidate : currentState.selectedPokedex;

          // Consolidated persistence fields — prefer persisted Zustand, fall back to legacy
          const achievements = normalizeAchievements(
            persisted.achievements ?? legacy.achievements,
            currentState.achievements
          );
          const gameStats = normalizeGameStats(
            persisted.gameStats ?? legacy.gameStats,
            currentState.gameStats
          );
          const savedTeams = normalizeSavedTeams(
            persisted.savedTeams ?? legacy.savedTeams,
            currentState.savedTeams
          );

          // If we pulled achievements/gameStats/savedTeams from legacy keys,
          // clean them up now that they will be persisted in the Zustand store.
          if (!hasNewStorage && (legacy.achievements || legacy.gameStats || legacy.savedTeams)) {
            try {
              localStorage.removeItem('pokedex_achievements');
              localStorage.removeItem('pokedex_game_stats');
              localStorage.removeItem('pokedex_saved_teams');
            } catch {
              /* non-critical */
            }
          }

          return {
            ...currentState,
            ...persisted,
            team,
            favorites,
            theme,
            accent,
             selectedPokedex,
            achievements,
            gameStats,
            savedTeams,
          };
        },
      }
    )
  )
);

// ---------------------------------------------------------------------------
// Selector hooks: resolve ID arrays → full PokemonListItem objects.
// These are the primary way consumers should read team/comparison data.
// ---------------------------------------------------------------------------

/** Resolve team ID array to full PokemonListItem objects. */
export const useTeamPokemon = (): PokemonListItem[] => {
  const teamIds = usePokemonStore((s) => s.team);
  const masterList = usePokemonStore((s) => s.masterPokemonList);
  return useMemo(() => {
    if (teamIds.length === 0) return [];
    const map = new Map(masterList.map((p) => [p.id, p]));
    return teamIds.map((id) => map.get(id)).filter((p): p is PokemonListItem => p !== undefined);
  }, [teamIds, masterList]);
};

/** Resolve comparison ID array to full PokemonListItem objects. */
export const useComparisonPokemon = (): PokemonListItem[] => {
  const comparisonIds = usePokemonStore((s) => s.comparisonList);
  const masterList = usePokemonStore((s) => s.masterPokemonList);
  return useMemo(() => {
    if (comparisonIds.length === 0) return [];
    const map = new Map(masterList.map((p) => [p.id, p]));
    return comparisonIds
      .map((id) => map.get(id))
      .filter((p): p is PokemonListItem => p !== undefined);
  }, [comparisonIds, masterList]);
};

/** Resolve an arbitrary ID array to PokemonListItem objects (e.g. for undo preview). */
export const resolveTeamIds = (ids: number[], masterList: PokemonListItem[]): PokemonListItem[] => {
  if (ids.length === 0) return [];
  const map = new Map(masterList.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter((p): p is PokemonListItem => p !== undefined);
};
