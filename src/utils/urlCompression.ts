import LZString from 'lz-string';
import { PokemonListItem, TeamMember } from '../types';
import { sanitizeString, MAX_DECOMPRESSED_LENGTH, MAX_COMPRESSED_LENGTH } from './securityUtils';
import { UI_CONSTANTS } from '../constants';

interface CompressedTeamMember {
  id: number;
  m?: string[]; // moves (names)
  a?: string; // ability
  n?: string; // nature
  i?: string; // item
  e?: number[]; // EVs [hp, atk, def, spa, spd, spe]
  v?: number[]; // IVs [hp, atk, def, spa, spd, spe] (only if not 31)
  s?: boolean; // shiny (derived from url check if possible, but better to flag explicitly)
}

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
const MAX_EV = 252;
const MAX_IV = 31;
const MIN_IV = 0;

export const compressTeam = (team: TeamMember[]): string => {
  if (!team || team.length === 0) return '';

  const simplifiedTeam: CompressedTeamMember[] = team.map((member) => {
    const data: CompressedTeamMember = { id: member.id };

    if (member.selectedMoves && member.selectedMoves.length > 0) {
      data.m = member.selectedMoves;
    }

    if (member.selectedAbility) {
      data.a = member.selectedAbility;
    }

    if (member.selectedNature) {
      data.n = member.selectedNature;
    }

    if (member.selectedItem) {
      data.i = member.selectedItem;
    }

    // Compress EVs: only store if not 0
    // Stored as fixed array of 6 integers to save space compared to object keys
    if (member.evs) {
      const evValues = STAT_ORDER.map((stat) => {
        const raw = member.evs?.[stat];
        return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 && raw <= MAX_EV
          ? Math.round(raw)
          : 0;
      });
      if (evValues.some((v) => v > 0)) {
        data.e = evValues;
      }
    }

    // Compress IVs: only store if not 31 (default)
    if (member.ivs) {
      const ivValues = STAT_ORDER.map((stat) => {
        const raw = member.ivs?.[stat];
        return typeof raw === 'number' && Number.isFinite(raw) && raw >= MIN_IV && raw <= MAX_IV
          ? Math.round(raw)
          : MAX_IV;
      });
      if (ivValues.some((v) => v !== 31)) {
        data.v = ivValues;
      }
    }

    // Check shiny status via URL
    if (member.imageUrl && member.shinyImageUrl && member.imageUrl === member.shinyImageUrl) {
      data.s = true;
    }

    return data;
  });

  const jsonString = JSON.stringify(simplifiedTeam);
  return LZString.compressToEncodedURIComponent(jsonString);
};

export const decompressTeam = (compressed: string, masterList: PokemonListItem[]): TeamMember[] => {
  if (!compressed || !masterList || masterList.length === 0) return [];

  // SECURITY: Limit compressed size to prevent DoS before decompression
  if (compressed.length > MAX_COMPRESSED_LENGTH) {
    console.warn('Compressed team data too large');
    return [];
  }

  try {
    const jsonString = LZString.decompressFromEncodedURIComponent(compressed);
    if (!jsonString) return [];

    // SECURITY: Limit decompressed size to prevent DoS (decompression bomb)
    if (jsonString.length > MAX_DECOMPRESSED_LENGTH) {
      console.warn('Decompressed team data too large');
      return [];
    }

    const simplifiedTeam: CompressedTeamMember[] = JSON.parse(jsonString);
    if (!Array.isArray(simplifiedTeam)) return [];

    if (simplifiedTeam.length > UI_CONSTANTS.MAX_TEAM_SIZE) {
      return [];
    }

    const team: TeamMember[] = [];

    // SECURITY: Limit the number of team members to prevent DoS
    const safeTeam = simplifiedTeam.slice(0, UI_CONSTANTS.MAX_TEAM_SIZE);

    safeTeam.forEach((data) => {
      const original = masterList.find((p) => p.id === data.id);
      if (!original) return;

      // Clone basic Pokemon data
      // SECURITY: Sanitize all string inputs to prevent XSS
      const member: TeamMember = {
        ...original,
        selectedMoves: data.m ? data.m.map((m) => sanitizeString(m)) : [],
        selectedAbility: sanitizeString(data.a),
        selectedNature: sanitizeString(data.n),
        selectedItem: sanitizeString(data.i),
        evs: {},
        ivs: {},
      };

      // Handle Shiny
      if (data.s) {
        member.imageUrl = member.shinyImageUrl;
      }

      // Decompress EVs
      if (data.e && Array.isArray(data.e) && data.e.length === 6) {
        data.e.forEach((val, index) => {
          if (Number.isInteger(val) && val > 0 && val <= MAX_EV) {
            if (!member.evs) member.evs = {};
            member.evs[STAT_ORDER[index]] = val;
          }
        });
      }

      // Decompress IVs
      if (data.v && Array.isArray(data.v) && data.v.length === 6) {
        data.v.forEach((val, index) => {
          if (Number.isInteger(val) && val >= MIN_IV && val <= MAX_IV && val !== MAX_IV) {
            if (!member.ivs) member.ivs = {};
            member.ivs[STAT_ORDER[index]] = val;
          }
        });
      }

      team.push(member);
    });

    return team;
  } catch (e) {
    console.error('Failed to decompress team URL', e);
    return [];
  }
};
