import { describe, expect, it } from 'vitest';
import { isPersistenceData, PERSISTENCE_VERSION } from './persistenceSchema';
import { PokemonListItem } from '../types';

describe('persistence schema', () => {
  it('validates a serialized payload round-trip', () => {
    const samplePokemon: PokemonListItem = {
      id: 25,
      name: 'pikachu',
      imageUrl: 'https://example.com/pikachu.png',
      shinyImageUrl: 'https://example.com/pikachu-shiny.png',
      types: ['electric'],
      flavorText: 'Electric mouse Pokemon.',
      stats: [
        { name: 'hp', value: 35 },
        { name: 'attack', value: 55 },
      ],
      abilities: ['static'],
    };

    const payload = {
      team: [samplePokemon],
      favorites: [25, 1],
      theme: 'dark',
      timestamp: '2024-01-01T00:00:00.000Z',
      version: PERSISTENCE_VERSION,
    };

    const parsed = JSON.parse(JSON.stringify(payload));

    expect(isPersistenceData(parsed)).toBe(true);
  });

  it('rejects payloads that are missing required fields', () => {
    const invalidPayload = {
      team: [],
      favorites: [],
      theme: 'dark',
    };

    expect(isPersistenceData(invalidPayload)).toBe(false);
  });

  it('rejects payloads with invalid favorites', () => {
    const payload = {
      team: [],
      favorites: ['25'],
      theme: 'light',
      timestamp: '2024-01-01T00:00:00.000Z',
      version: PERSISTENCE_VERSION,
    };

    expect(isPersistenceData(payload)).toBe(false);
  });
});
