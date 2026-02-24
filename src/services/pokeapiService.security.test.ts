import { beforeEach, describe, expect, it, vi } from 'vitest';
import { set, clear } from 'idb-keyval';
import { fetchAllMoves, fetchAllItems } from './pokeapiService';

// Mock console.error to avoid noise in test output
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('pokeapiService security', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clear();
    vi.restoreAllMocks();
    consoleSpy.mockClear();

    // Mock fetch to return valid empty data structure
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          pokemon_v2_move: [],
          pokemon_v2_item: [],
        },
      }),
    } as any);
  });

  it('fetchAllMoves: handles malformed JSON in localStorage safely', async () => {
    await set('pokedex_moves', '{invalid-json');

    // This should recover by clearing cache and fetching fresh data
    const moves = await fetchAllMoves();
    expect(Array.isArray(moves)).toBe(true);
    // Should have tried to fetch since cache was invalid
    expect(global.fetch).toHaveBeenCalled();
  });

  it('fetchAllMoves: handles invalid schema (not an array) in localStorage safely', async () => {
    await set('pokedex_moves', { some: 'object' });

    // This should recover by clearing cache and fetching fresh data
    const moves = await fetchAllMoves();
    expect(Array.isArray(moves)).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('fetchAllItems: handles malformed JSON in localStorage safely', async () => {
    await set('pokedex_items', '{invalid-json');

    const items = await fetchAllItems();
    expect(Array.isArray(items)).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });
});
