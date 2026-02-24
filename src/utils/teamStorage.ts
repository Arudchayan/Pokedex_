// Team persistence management using localStorage
import { TeamMember } from '../types';
import { sanitizeString, validateSafeNumber, sanitizeUrl } from './securityUtils';
import { UI_CONSTANTS } from '../constants';
import { logger } from './logger';

const TEAM_KEY = 'pokedex_team';
const SAVED_TEAMS_KEY = 'pokedex_saved_teams';

export interface SavedTeam {
  id: string;
  name: string;
  team: TeamMember[];
  updatedAt: number;
}

const validateStatsObject = (data: any, maxVal: number): Record<string, number> | undefined => {
  if (!data || typeof data !== 'object') return undefined;

  const stats: Record<string, number> = {};
  let hasValidStats = false;

  Object.entries(data).forEach(([key, value]) => {
    // Sanitize the key itself to prevent weird object keys
    const safeKey = sanitizeString(key);

    // SECURITY: Prevent prototype pollution
    if (safeKey === '__proto__' || safeKey === 'constructor' || safeKey === 'prototype') {
      return;
    }

    // Validate the value is a number within range
    const safeValue = validateSafeNumber(value, 0, maxVal);

    if (safeKey && safeValue !== undefined) {
      stats[safeKey] = safeValue;
      hasValidStats = true;
    }
  });

  return hasValidStats ? stats : undefined;
};

export const validateTeamMember = (data: any): TeamMember | null => {
  if (!data || typeof data !== 'object') return null;
  // Essential fields
  if (typeof data.id !== 'number') return null;
  if (typeof data.name !== 'string') return null;

  // Sanitize strings
  const safeName = sanitizeString(data.name);
  if (!safeName) return null; // Name is required

  // Construct safe object with allowlist of properties
  const member: TeamMember = {
    id: data.id,
    name: safeName,
    imageUrl: typeof data.imageUrl === 'string' ? sanitizeUrl(data.imageUrl) : '',
    shinyImageUrl: typeof data.shinyImageUrl === 'string' ? sanitizeUrl(data.shinyImageUrl) : '',
    types: Array.isArray(data.types) ? data.types.map((t: any) => sanitizeString(String(t))) : [],
    flavorText: typeof data.flavorText === 'string' ? sanitizeString(data.flavorText) : '',
    // Optional properties
    bst: validateSafeNumber(data.bst),
    stats: Array.isArray(data.stats)
      ? data.stats.map((s: any) => ({
          name: sanitizeString(String(s?.name || '')),
          value: validateSafeNumber(s?.value) || 0,
        }))
      : [],
    abilities: Array.isArray(data.abilities)
      ? data.abilities.map((a: any) => sanitizeString(String(a)))
      : [],

    // TeamMember specifics
    selectedMoves: Array.isArray(data.selectedMoves)
      ? data.selectedMoves.map((m: any) => sanitizeString(String(m)))
      : [],
    selectedAbility: data.selectedAbility ? sanitizeString(data.selectedAbility) : undefined,
    selectedNature: data.selectedNature ? sanitizeString(data.selectedNature) : undefined,
    selectedItem: data.selectedItem ? sanitizeString(data.selectedItem) : undefined,
    evs: validateStatsObject(data.evs, 252), // EVs max 252
    ivs: validateStatsObject(data.ivs, 31), // IVs max 31
  };

  return member;
};

export const validateSavedTeam = (data: any): SavedTeam | null => {
  if (!data || typeof data !== 'object') return null;
  if (typeof data.id !== 'string') return null;
  if (typeof data.name !== 'string') return null;
  if (!Array.isArray(data.team)) return null;

  // SECURITY: Limit team size to prevent DoS
  const safeTeam = data.team
    .slice(0, UI_CONSTANTS.MAX_TEAM_SIZE)
    .map(validateTeamMember)
    .filter((m: TeamMember | null): m is TeamMember => m !== null);

  return {
    id: sanitizeString(data.id),
    name: sanitizeString(data.name),
    team: safeTeam,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
  };
};

export const getSavedTeam = (): TeamMember[] => {
  try {
    const stored = localStorage.getItem(TEAM_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // SECURITY: Limit team size to prevent DoS
        return parsed
          .slice(0, UI_CONSTANTS.MAX_TEAM_SIZE)
          .map(validateTeamMember)
          .filter((m): m is TeamMember => m !== null);
      }
    }
  } catch (error) {
    logger.warn('Error loading team from storage:', error);
  }
  return [];
};

export const saveTeam = (team: TeamMember[]): void => {
  try {
    localStorage.setItem(TEAM_KEY, JSON.stringify(team));
  } catch (error) {
    logger.warn('Error saving team to storage:', error);
  }
};

export const getSavedTeamList = (): SavedTeam[] => {
  try {
    const stored = localStorage.getItem(SAVED_TEAMS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map(validateSavedTeam).filter((t): t is SavedTeam => t !== null);
      }
    }
  } catch (error) {
    logger.warn('Error loading saved teams from storage:', error);
  }
  return [];
};

export const saveTeamList = (teams: SavedTeam[]): void => {
  try {
    // SECURITY: Enforce limit to prevent DoS
    const limitedTeams =
      teams.length > UI_CONSTANTS.MAX_SAVED_TEAMS
        ? teams.slice(0, UI_CONSTANTS.MAX_SAVED_TEAMS)
        : teams;
    localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(limitedTeams));
  } catch (error) {
    logger.warn('Error saving team list to storage:', error);
  }
};
