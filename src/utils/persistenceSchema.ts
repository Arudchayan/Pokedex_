import { PokemonListItem, TeamMember } from '../types';
import { SavedTeam, validateSavedTeam, validateTeamMember } from './teamStorage';
import { UI_CONSTANTS } from '../constants';
import { env } from '../config/env';
import { MAX_INPUT_LENGTH } from './securityUtils';
import { sanitizeFavoriteIds } from './favorites';

export const PERSISTENCE_VERSION = '1.0';

export type ThemePreference = 'dark' | 'light';

export interface PersistenceData {
  team: PokemonListItem[];
  favorites: number[];
  savedTeams?: SavedTeam[];
  theme: ThemePreference;
  timestamp: string;
  version: string;
}

/** Fully validated and sanitized backup, ready to apply to the store. */
export interface PersistenceRestorePayload {
  team: TeamMember[];
  favorites: number[];
  savedTeams: SavedTeam[];
  theme: ThemePreference;
  timestamp: string;
}

export type PersistenceParseResult =
  | { ok: true; backup: PersistenceRestorePayload }
  | { ok: false; error: string };

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
    Number.isSafeInteger(record.id) &&
    record.id > 0 &&
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
    Number.isFinite(record.updatedAt) &&
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

const normalizeRestoreTeam = (team: PokemonListItem[]): TeamMember[] => {
  const seen = new Set<number>();
  const result: TeamMember[] = [];

  for (const entry of team) {
    const member = validateTeamMember(entry);
    if (!member || seen.has(member.id)) continue;
    seen.add(member.id);
    result.push(member);
    if (result.length >= env.teamCapacity) break;
  }

  return result;
};

const normalizeRestoreSavedTeams = (teams: SavedTeam[] | undefined): SavedTeam[] => {
  const seen = new Set<string>();
  const result: SavedTeam[] = [];

  for (const entry of teams ?? []) {
    const savedTeam = validateSavedTeam(entry);
    if (!savedTeam || seen.has(savedTeam.id)) continue;
    seen.add(savedTeam.id);
    result.push(savedTeam);
    if (result.length >= UI_CONSTANTS.MAX_SAVED_TEAMS) break;
  }

  return result;
};

/**
 * Parse and validate a pasted backup without touching application state.
 * Unknown keys are ignored; malformed or unsupported backups return a
 * user-facing error so a destructive restore can stay disabled.
 */
export const parsePersistenceBackup = (raw: string): PersistenceParseResult => {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, error: 'Paste a backup to restore.' };
  }

  if (trimmed.length > MAX_INPUT_LENGTH) {
    return { ok: false, error: 'Backup is too large. Paste a backup under 50,000 characters.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: 'Invalid JSON. Check for missing quotes, commas, or braces.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Backup must be a JSON object.' };
  }

  const version = (parsed as Record<string, unknown>).version;
  if (typeof version !== 'string') {
    return { ok: false, error: 'Backup is missing its schema version.' };
  }
  if (version !== PERSISTENCE_VERSION) {
    return {
      ok: false,
      error: `Unsupported backup version "${version}". This app supports version ${PERSISTENCE_VERSION}.`,
    };
  }

  if (!isPersistenceData(parsed)) {
    return {
      ok: false,
      error: 'Backup does not match the expected schema (team, favorites, theme, or timestamp).',
    };
  }

  return {
    ok: true,
    backup: {
      team: normalizeRestoreTeam(parsed.team),
      favorites: Array.from(sanitizeFavoriteIds(parsed.favorites)),
      savedTeams: normalizeRestoreSavedTeams(parsed.savedTeams),
      theme: parsed.theme,
      timestamp: parsed.timestamp,
    },
  };
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
