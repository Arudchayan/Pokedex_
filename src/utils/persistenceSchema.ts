import { PokemonListItem } from '../types';
import { SavedTeam } from './teamStorage';
import { UI_CONSTANTS } from '../constants';

export const PERSISTENCE_VERSION = '1.0';

type ThemePreference = 'dark' | 'light';

export interface PersistenceData {
  team: PokemonListItem[];
  favorites: number[];
  savedTeams?: SavedTeam[];
  theme: ThemePreference;
  timestamp: string;
  version: string;
}

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'dark' || value === 'light';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const isValidIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const ts = Date.parse(value);
  return Number.isFinite(ts);
};

const isPokemonListItem = (value: unknown): value is PokemonListItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as PokemonListItem;

  return (
    typeof record.id === 'number' &&
    typeof record.name === 'string' &&
    typeof record.imageUrl === 'string' &&
    typeof record.shinyImageUrl === 'string' &&
    isStringArray(record.types) &&
    typeof record.flavorText === 'string'
  );
};

const isSavedTeam = (value: unknown): value is SavedTeam => {
  if (!value || typeof value !== 'object') return false;
  const record = value as SavedTeam;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.updatedAt === 'number' &&
    Array.isArray(record.team)
  );
};

export const isPersistenceData = (value: unknown): value is PersistenceData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as PersistenceData;

  const hasValidSavedTeams =
    record.savedTeams === undefined ||
    (Array.isArray(record.savedTeams) && record.savedTeams.every(isSavedTeam));

  return (
    Array.isArray(record.team) &&
    record.team.length <= UI_CONSTANTS.MAX_TEAM_SIZE &&
    record.team.every(isPokemonListItem) &&
    Array.isArray(record.favorites) &&
    record.favorites.length <= 5000 &&
    record.favorites.every((favorite) => Number.isInteger(favorite) && favorite >= 0) &&
    hasValidSavedTeams &&
    isThemePreference(record.theme) &&
    isValidIsoTimestamp(record.timestamp) &&
    record.version === PERSISTENCE_VERSION
  );
};

export const buildPersistenceData = ({
  team,
  favorites,
  savedTeams,
  theme,
  timestamp,
  version,
}: {
  team: PokemonListItem[];
  favorites: number[] | Set<number>;
  savedTeams?: SavedTeam[];
  theme: ThemePreference;
  timestamp?: string;
  version?: string;
}): PersistenceData => ({
  team,
  favorites: Array.isArray(favorites) ? favorites : Array.from(favorites),
  savedTeams,
  theme,
  timestamp: timestamp ?? new Date().toISOString(),
  version: version ?? PERSISTENCE_VERSION,
});
