import { describe, expect, it } from 'vitest';
import {
  buildPersistenceData,
  isPersistenceData,
  parsePersistenceBackup,
  PERSISTENCE_VERSION,
} from '../utils/persistenceSchema';
import { PokemonListItem } from '../types';

describe('persistenceSchema', () => {
  const sampleTeam: PokemonListItem[] = [
    {
      id: 25,
      name: 'pikachu',
      imageUrl: 'image-url',
      shinyImageUrl: 'shiny-url',
      types: ['electric'],
      flavorText: 'mouse pokemon',
      isShiny: true,
    },
  ];

  it('serializes and validates persistence data', () => {
    const data = buildPersistenceData({
      team: sampleTeam,
      favorites: new Set([25, 133]),
      theme: 'dark',
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    expect(data.version).toBe(PERSISTENCE_VERSION);

    const roundTripped = JSON.parse(JSON.stringify(data));
    expect(isPersistenceData(roundTripped)).toBe(true);
  });

  it('rejects invalid persistence shapes', () => {
    const invalidData = {
      team: [{ id: 'bad-id' }],
      favorites: ['1', '2'],
      theme: 'dark',
      timestamp: '2024-01-01T00:00:00.000Z',
      version: PERSISTENCE_VERSION,
    };

    expect(isPersistenceData(invalidData)).toBe(false);
  });

  describe('parsePersistenceBackup', () => {
    const validBackup = () => ({
      ...buildPersistenceData({
        team: sampleTeam,
        favorites: [25, 1337, 0],
        savedTeams: [
          { id: 'team-1', name: 'Team One', team: [sampleTeam[0]], updatedAt: 1 },
          { id: 'team-1', name: 'Duplicate', team: [], updatedAt: 2 },
        ],
        theme: 'light' as const,
        timestamp: '2024-01-01T00:00:00.000Z',
      }),
      unknownKey: 'ignored',
    });

    it('parses a valid backup and ignores unknown keys', () => {
      const result = parsePersistenceBackup(JSON.stringify(validBackup()));

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.backup.team.map((member) => member.id)).toEqual([25]);
      expect(result.backup.team[0]?.isShiny).toBe(true);
      expect(result.backup.favorites).toEqual([25]);
      expect(result.backup.savedTeams).toHaveLength(1);
      expect(result.backup.savedTeams[0]?.team[0]?.isShiny).toBe(true);
      expect(result.backup.theme).toBe('light');
      expect(result.backup).not.toHaveProperty('unknownKey');
    });

    it('reports invalid JSON with a specific message', () => {
      const result = parsePersistenceBackup('{ not json ');

      expect(result).toEqual({
        ok: false,
        error: 'Invalid JSON. Check for missing quotes, commas, or braces.',
      });
    });

    it('reports an unsupported schema version', () => {
      const result = parsePersistenceBackup(JSON.stringify({ ...validBackup(), version: '2.0' }));

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain('Unsupported backup version "2.0"');
    });

    it('reports malformed shapes without returning a payload', () => {
      const result = parsePersistenceBackup(
        JSON.stringify({ ...validBackup(), team: 'not-an-array' })
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain('does not match the expected schema');
    });

    it('rejects unsafe team IDs and non-finite saved-team timestamps', () => {
      const unsafeTeamId = { ...validBackup(), team: [{ ...sampleTeam[0], id: 0 }] };
      expect(isPersistenceData(unsafeTeamId)).toBe(false);

      const unsafeSavedTeam = {
        ...validBackup(),
        savedTeams: [{ id: 'team-1', name: 'Team One', team: [], updatedAt: Number.NaN }],
      };
      expect(isPersistenceData(unsafeSavedTeam)).toBe(false);
    });
  });
});
