import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchAllPokemons } from './pokeapiService';

// Mock global fetch
const mockFetchResponse = (data: unknown) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data }),
  });
};

const makePokemon = (overrides: Record<string, unknown>) => ({
  id: 1,
  name: 'bulbasaur',
  pokemon_v2_pokemonsprites: [
    {
      sprites: JSON.stringify({
        front_default: 'http://example.com/sprite.png',
        other: {
            'official-artwork': { front_default: 'http://example.com/art.png' }
        }
      }),
    },
  ],
  pokemon_v2_pokemontypes: [{ pokemon_v2_type: { name: 'grass' } }],
  pokemon_v2_pokemonspecy: {
      pokemon_v2_pokemonspeciesflavortexts: [{ flavor_text: 'A seed pokemon.' }]
  },
  pokemon_v2_pokemonstats: [
    { base_stat: 45, pokemon_v2_stat: { name: 'hp' } },
  ],
  pokemon_v2_pokemonabilities: [
    { pokemon_v2_ability: { name: 'overgrow' } },
  ],
  ...overrides,
});

describe('fetchAllPokemons Performance', () => {
  let parseSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    parseSpy = vi.spyOn(JSON, 'parse');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('constructs URLs correctly', async () => {
    const pokemonList = [
      makePokemon({ id: 1, name: 'bulbasaur' }), // Standard
      makePokemon({ id: 25, name: 'pikachu', pokemon_v2_pokemonsprites: [] }), // No sprites
      makePokemon({ id: 150, name: 'mewtwo', pokemon_v2_pokemonsprites: [{ sprites: '{invalid-json}' }] }) // Invalid JSON
    ];

    mockFetchResponse({ pokemon_v2_pokemon: pokemonList });

    const result = await fetchAllPokemons();

    expect(result).toHaveLength(3);

    // 1. Bulbasaur (Has sprites) -> Expect Showdown URL
    expect(result[0].imageUrl).toBe('https://play.pokemonshowdown.com/sprites/ani/bulbasaur.gif');

    // 2. Pikachu (No sprites) -> Expect Generic URL
    expect(result[1].imageUrl).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png');

    // 3. Mewtwo (Invalid JSON sprites)
    // CURRENT BEHAVIOR: extractSpriteUrls fails parsing -> returns fallback image (poke-ball.png) which then might fall back to generic?
    // Wait, extractSpriteUrls returns fallbackImage if !sprites.
    // imageUrl = showdownUrl || genericSprite.
    // If extractSpriteUrls returns fallbackImage as showdownUrl, then imageUrl is fallbackImage.
    // Let's see what happens in the run.
  });

  it('should avoid JSON.parse on sprite strings', async () => {
    const spriteJson = JSON.stringify({ front_default: 'foo' });
    const pokemonList = Array(100).fill(null).map((_, i) => makePokemon({
        id: i + 1,
        name: `mon-${i}`,
        pokemon_v2_pokemonsprites: [{ sprites: spriteJson }]
    }));

    mockFetchResponse({ pokemon_v2_pokemon: pokemonList });

    // Reset spy to ignore the setup calls if any (none expected)
    parseSpy.mockClear();

    await fetchAllPokemons();

    // Vitest/Vite internals may call JSON.parse (e.g., sourcemap parsing depending on flags).
    // What we care about here is that the app does NOT parse the sprite JSON string per entry.
    const spriteParseCalls = parseSpy.mock.calls.filter(([arg]) => arg === spriteJson);
    expect(spriteParseCalls).toHaveLength(0);
  });
});
