import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get, clear } from 'idb-keyval';
import {
  fetchEncounterLocations,
  getEncounterCacheMaxEntries,
} from './pokeapiService';

describe('pokeapiService encounter cache LRU', () => {
  beforeEach(async () => {
    await clear();
    vi.useFakeTimers();
    global.fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
      const pokemonId = body?.variables?.pokemonId ?? 1;
      return {
        ok: true,
        json: async () => ({
          data: {
            pokemon_v2_encounter: [
              {
                min_level: 5,
                max_level: 10,
                pokemon_v2_encounterslots: [
                  {
                    rarity: 20,
                    pokemon_v2_encountermethod: { name: 'walk' },
                  },
                ],
                pokemon_v2_version: { name: 'red' },
                pokemon_v2_locationarea: {
                  pokemon_v2_location: { name: 'route-1' },
                },
              },
            ],
          },
        }),
        // Keep pokemonId referenced so mocks stay realistic
        headers: { get: () => String(pokemonId) },
      } as any;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const flushIdleCacheWrites = async () => {
    await vi.runAllTimersAsync();
  };

  it('evicts least-recently-used encounter entries when over maxEntries', async () => {
    const limit = getEncounterCacheMaxEntries();

    for (let id = 1; id <= limit; id++) {
      await fetchEncounterLocations(id);
      await flushIdleCacheWrites();
    }

    // Touch id 1 so it becomes most recently used
    await fetchEncounterLocations(1);
    await flushIdleCacheWrites();

    // Insert one more to force eviction of the least-recent (id 2)
    await fetchEncounterLocations(limit + 1);
    await flushIdleCacheWrites();

    expect(await get('pokemon_encounters_1')).toBeTruthy();
    expect(await get('pokemon_encounters_2')).toBeUndefined();
    expect(await get('pokemon_encounters_2_ts')).toBeUndefined();
    expect(await get(`pokemon_encounters_${limit + 1}`)).toBeTruthy();

    const lru = (await get('pokemon_encounters_lru')) as number[];
    expect(lru).toHaveLength(limit);
    expect(lru).toContain(1);
    expect(lru).toContain(limit + 1);
    expect(lru).not.toContain(2);
  });

  it('refreshes LRU order on cache hit without growing past max', async () => {
    const limit = getEncounterCacheMaxEntries();

    for (let id = 1; id <= limit; id++) {
      await fetchEncounterLocations(id);
      await flushIdleCacheWrites();
    }

    // Cache hit on 1
    await fetchEncounterLocations(1);
    await flushIdleCacheWrites();

    const lru = (await get('pokemon_encounters_lru')) as number[];
    expect(lru).toHaveLength(limit);
    expect(lru[lru.length - 1]).toBe(1);

    // Stale cleanup sanity: no orphaned ts without data for evicted keys after next write
    await fetchEncounterLocations(limit + 2);
    await flushIdleCacheWrites();
    expect(await get('pokemon_encounters_lru')).toHaveLength(limit);
  });
});
