import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSavedTeam, getSavedTeamList, saveTeam, saveTeamList, SavedTeam } from './teamStorage';
import { TeamMember } from '../types';
import { UI_CONSTANTS } from '../constants';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('teamStorage Security', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should sanitize XSS vectors in team member name', () => {
    const maliciousTeam = [
      {
        id: 1,
        name: '<script>alert("xss")</script>Pikachu',
        imageUrl: 'http://example.com/img.png',
        types: ['Electric'],
        flavorText: 'Mouse',
        selectedMoves: ['Thunderbolt'],
      },
    ];

    localStorageMock.setItem('pokedex_team', JSON.stringify(maliciousTeam));

    const team = getSavedTeam();
    expect(team).toHaveLength(1);
    // Sanitize removes <, >, " characters
    expect(team[0].name).toBe('scriptalert(xss)/scriptPikachu');
    expect(team[0].name).not.toContain('<script>');
    expect(team[0].name).not.toContain('"');
  });

  it('should ignore members with missing required fields (id)', () => {
    const invalidTeam = [
      {
        name: 'Pikachu', // Missing ID
        imageUrl: 'img.png',
      },
      {
        id: 2,
        name: 'Raichu',
        imageUrl: 'img.png',
      },
    ];

    localStorageMock.setItem('pokedex_team', JSON.stringify(invalidTeam));

    const team = getSavedTeam();
    expect(team).toHaveLength(1);
    expect(team[0].id).toBe(2);
  });

  it('should sanitize strings in nested arrays (types, moves)', () => {
    const maliciousTeam = [
      {
        id: 1,
        name: 'Pikachu',
        imageUrl: 'img.png',
        types: ['<img src=x onerror=alert(1)>'],
        selectedMoves: ['<a href="javascript:alert(1)">Click me</a>'],
      },
    ];

    localStorageMock.setItem('pokedex_team', JSON.stringify(maliciousTeam));

    const team = getSavedTeam();
    expect(team[0].types[0]).toBe('img src=x onerror=alert(1)');
    // Sanitized: javascript: is removed
    expect(team[0].selectedMoves?.[0]).toBe('a href=[blocked]alert(1)Click me/a');
  });

  it('should sanitize control characters (newlines) from team member inputs', () => {
    const maliciousTeam = [
      {
        id: 1,
        name: 'Pikachu\nAbility: Wonder Guard',
        imageUrl: 'img.png',
      },
    ];

    localStorageMock.setItem('pokedex_team', JSON.stringify(maliciousTeam));

    const team = getSavedTeam();
    expect(team).toHaveLength(1);
    expect(team[0].name).toBe('PikachuAbility: Wonder Guard');
  });

  it('should validate SavedTeam list structure and sanitize content', () => {
    const maliciousSavedTeams = [
      {
        id: 'uuid-1',
        name: '<b onmouseover=alert(1)>My Team</b>',
        updatedAt: 1234567890,
        team: [
          {
            id: 25,
            name: 'Pikachu',
            imageUrl: 'img.png',
          },
        ],
      },
      {
        id: 'uuid-2',
        name: 'Valid Team',
        // Missing team array
      },
    ];

    localStorageMock.setItem('pokedex_saved_teams', JSON.stringify(maliciousSavedTeams));

    const savedTeams = getSavedTeamList();
    expect(savedTeams).toHaveLength(1); // Second one rejected
    expect(savedTeams[0].name).toBe('b onmouseover=alert(1)My Team/b');
    expect(savedTeams[0].team).toHaveLength(1);
  });

  it('should handle corrupted JSON gracefully', () => {
    localStorageMock.setItem('pokedex_team', '{ invalid json ');
    const team = getSavedTeam();
    expect(team).toEqual([]);
  });

  it('should enforce team size limit to prevent DoS', () => {
    // Create a team with 20 members (exceeding limit of 12)
    const largeTeam = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Pokemon ${i}`,
      imageUrl: 'img.png',
    }));

    localStorageMock.setItem('pokedex_team', JSON.stringify(largeTeam));

    const team = getSavedTeam();
    expect(team.length).toBeLessThanOrEqual(UI_CONSTANTS.MAX_TEAM_SIZE);
  });

  it('should enforce team size limit in SavedTeams list', () => {
    const largeTeam = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Pokemon ${i}`,
      imageUrl: 'img.png',
    }));

    const savedTeams = [
      {
        id: '1',
        name: 'Huge Team',
        team: largeTeam,
        updatedAt: Date.now(),
      },
    ];

    localStorageMock.setItem('pokedex_saved_teams', JSON.stringify(savedTeams));

    const loadedTeams = getSavedTeamList();
    expect(loadedTeams[0].team.length).toBeLessThanOrEqual(UI_CONSTANTS.MAX_TEAM_SIZE);
  });
});
