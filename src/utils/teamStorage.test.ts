import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSavedTeam, getSavedTeamList, saveTeam, saveTeamList, SavedTeam } from './teamStorage';
import { TeamMember } from '../types';

describe('teamStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getSavedTeam', () => {
    it('returns empty array if nothing in localStorage', () => {
      expect(getSavedTeam()).toEqual([]);
    });

    it('returns parsed team if valid array', () => {
      const mockTeam = [{ id: 1, name: 'Bulbasaur' }] as TeamMember[];
      localStorage.setItem('pokedex_team', JSON.stringify(mockTeam));
      const result = getSavedTeam();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(mockTeam[0]);
    });

    it('returns empty array if localStorage contains non-array JSON (Object)', () => {
      // Vulnerability reproduction: currently this would return the object without validation
      localStorage.setItem('pokedex_team', JSON.stringify({ malicious: 'object' }));
      const result = getSavedTeam();

      // We expect our security fix to ensure this returns an empty array
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('returns empty array if localStorage contains non-array JSON (Number)', () => {
      localStorage.setItem('pokedex_team', '12345');
      const result = getSavedTeam();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('returns empty array if JSON parse fails', () => {
      localStorage.setItem('pokedex_team', 'invalid-json');
      expect(getSavedTeam()).toEqual([]);
    });
  });

  describe('getSavedTeamList', () => {
    it('returns empty array if nothing in localStorage', () => {
      expect(getSavedTeamList()).toEqual([]);
    });

    it('returns parsed list if valid array', () => {
      const mockList = [{ id: '1', name: 'My Team', team: [], updatedAt: 123 }] as SavedTeam[];
      localStorage.setItem('pokedex_saved_teams', JSON.stringify(mockList));
      const result = getSavedTeamList();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(mockList[0]);
    });

    it('returns empty array if localStorage contains non-array JSON', () => {
      localStorage.setItem('pokedex_saved_teams', JSON.stringify({ malicious: 'object' }));
      const result = getSavedTeamList();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });
});
