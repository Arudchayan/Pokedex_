import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAllMoves, fetchAllItems } from './pokeapiService';

// Mock console.error/warn to avoid noise
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('pokeapiService data validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    consoleSpy.mockClear();
    consoleWarnSpy.mockClear();

    // Mock fetch to return valid empty data structure by default
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          pokemon_v2_move: [],
          pokemon_v2_item: []
        }
      }),
    } as any);
  });

  it('fetchAllMoves: filters invalid items and sanitizes partially valid ones', async () => {
    // Inject invalid data via mock API
    const invalidData = [
      { id: 'not-a-number', name: 'valid-name' }, // Invalid ID -> Filtered out
      { id: 2 }, // Missing name -> Filtered out
      { id: 3, name: 'valid', power: 'huge' } // Invalid power -> Sanitized to null
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          pokemon_v2_move: invalidData
        }
      }),
    } as any);

    const moves = await fetchAllMoves();

    // Expect only the valid item, with sanitized fields
    expect(moves).toHaveLength(1);
    expect(moves[0]).toEqual({
        id: 3,
        name: 'valid',
        type: 'normal', // Defaulted
        category: 'status', // Defaulted
        power: null, // Sanitized from 'huge'
        accuracy: null, // Defaulted
        pp: 0 // Defaulted
    });
  });

  it('fetchAllItems: filters invalid items from API response', async () => {
    const invalidData = [
      { id: 'bad', name: 'potion' }, // Invalid ID
      { id: 1, cost: 'expensive' }, // Missing name
      {
        id: 999,
        name: 'fresh-potion',
        cost: 200,
        pokemon_v2_itemflavortexts: [{ flavor_text: 'Freshly brewed' }]
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          pokemon_v2_item: invalidData
        }
      }),
    } as any);

    const items = await fetchAllItems();

    // Should return only the valid item
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('fresh-potion');
    expect(items[0].flavorText).toBe('Freshly brewed');
  });
});
