import { describe, expect, it } from 'vitest';
import {
  buildPersistenceData,
  isPersistenceData,
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
});
