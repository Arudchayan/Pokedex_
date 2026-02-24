import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAllPokemons, fetchAllMoves, fetchAllItems } from './pokeapiService';

describe('pokeapiService fresh data validation', () => {
  let consoleWarnSpy: any;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    // Mock console.warn to avoid noise and check calls
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('fetchAllPokemons: filters out invalid entries from API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          pokemon_v2_pokemon: [
            {
              id: 1,
              name: 'valid',
              pokemon_v2_pokemonsprites: [{ id: 1 }],
              pokemon_v2_pokemontypes: [],
              pokemon_v2_pokemonstats: [],
              pokemon_v2_pokemonabilities: [],
            },
            { id: 'bad', name: 'invalid-id' },
            { id: 2, name: null }, // Invalid name
            { id: 3, name: 'missing-arrays' }, // Missing arrays
          ],
        },
      }),
    } as any);

    const pokemons = await fetchAllPokemons();
    expect(pokemons).toHaveLength(1);
    expect(pokemons[0].id).toBe(1);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
  });

  it('fetchAllMoves: filters out invalid entries from API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          pokemon_v2_move: [
            { id: 1, name: 'valid', power: 100 },
            { id: 'bad', name: 'invalid-id' },
            { id: 2, name: 'invalid-power', power: 'huge' }, // Invalid power -> sanitized to null, but entry kept as valid Move (power becomes null)
          ],
        },
      }),
    } as any);

    const moves = await fetchAllMoves();
    expect(moves).toHaveLength(2);
    expect(moves[0].id).toBe(1);
    expect(moves[1].id).toBe(2);
    expect(moves[1].power).toBeNull();
  });

  it('fetchAllItems: filters out invalid entries from API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          pokemon_v2_item: [
            { id: 1, name: 'valid', cost: 100, pokemon_v2_itemflavortexts: [] },
            { id: 'bad', name: 'invalid-id' }, // This will have undefined flavortexts
          ],
        },
      }),
    } as any);

    const items = await fetchAllItems();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(1);
  });
});
