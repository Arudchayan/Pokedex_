import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clear, set } from 'idb-keyval';
import { fetchAllMoves, fetchAllItems } from './pokeapiService';

// Mock console.error/warn to avoid noise
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('pokeapiService data validation', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clear();
    vi.restoreAllMocks();
    consoleSpy.mockClear();
    consoleWarnSpy.mockClear();

    // Mock fetch to return valid empty data structure by default
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          move: [],
          item: [],
        },
      }),
    } as any);
  });

  it('fetchAllMoves: filters invalid items and sanitizes partially valid ones', async () => {
    // Inject invalid data via mock API
    const invalidData = [
      { id: 'not-a-number', name: 'valid-name' }, // Invalid ID -> Filtered out
      { id: 2 }, // Missing name -> Filtered out
      { id: 3, name: 'valid', power: 'huge' }, // Invalid power -> Sanitized to null
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          move: invalidData,
        },
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
      pp: 0, // Defaulted
    });
  });

  it('fetchAllItems: filters invalid items from API response', async () => {
    const invalidData = [
      { id: 'bad', name: 'potion' }, // Invalid ID
      { id: 1, itemprices: [{ purchase_price: 'expensive' }] }, // Missing name
      {
        id: 999,
        name: 'fresh-potion',
        itemprices: [{ purchase_price: 200 }],
        itemflavortexts: [{ flavor_text: 'Freshly brewed' }],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          item: invalidData,
        },
      }),
    } as any);

    const items = await fetchAllItems();

    // Should return only the valid item
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('fresh-potion');
    expect(items[0].cost).toBe(200);
    expect(items[0].flavorText).toBe('Freshly brewed');
  });

  it('fetchAllItems: keeps holdable items without a purchase price (cost 0)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          item: [
            {
              id: 211,
              name: 'leftovers',
              itemprices: [],
              itemflavortexts: [{ flavor_text: 'Slowly restores HP.' }],
            },
            {
              id: 2,
              name: 'ultra-ball',
              itemprices: [{ purchase_price: 1200 }],
              itemflavortexts: [],
            },
          ],
        },
      }),
    } as any);

    const items = await fetchAllItems();

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ name: 'leftovers', cost: 0 });
    expect(items[1]).toMatchObject({ name: 'ultra-ball', cost: 1200 });
  });

  it('fetchAllItems: ignores the legacy v1 items cache', async () => {
    const staleV1Item = {
      id: 999,
      name: 'stale-v1-item',
      cost: 0,
      flavorText: 'Cached before the item pool fix.',
      imageUrl:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/stale-v1-item.png',
      nameLower: 'stale-v1-item',
    };
    await set('pokedex_items', [staleV1Item]);
    await set('pokedex_items_timestamp', Date.now());

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          item: [
            {
              id: 211,
              name: 'leftovers',
              itemprices: [],
              itemflavortexts: [{ flavor_text: 'Slowly restores HP.' }],
            },
          ],
        },
      }),
    } as any);

    const items = await fetchAllItems();

    expect(global.fetch).toHaveBeenCalled();
    expect(items.map((item) => item.name)).toEqual(['leftovers']);
  });
});
