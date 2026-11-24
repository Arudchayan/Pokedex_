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
  pokemonsprites: [
    {
      sprites: JSON.stringify({
        front_default: 'http://example.com/sprite.png',
        other: {
          'official-artwork': { front_default: 'http://example.com/art.png' },
        },
      }),
    },
  ],
  pokemontypes: [{ type: { name: 'grass' } }],
  pokemonspecy: {
    pokemonspeciesflavortexts: [{ flavor_text: 'A seed pokemon.' }],
  },
  pokemonstats: [{ base_stat: 45, stat: { name: 'hp' } }],
  pokemonabilities: [{ ability: { name: 'overgrow' } }],
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
      makePokemon({ id: 25, name: 'pikachu', pokemonsprites: [] }), // No sprites
      makePokemon({
        id: 150,
        name: 'mewtwo',
        pokemonsprites: [{ sprites: '{invalid-json}' }],
      }), // Invalid JSON
    ];

    mockFetchResponse({ pokemon: pokemonList });

    const result = await fetchAllPokemons();

    expect(result).toHaveLength(3);

    // Catalog list always uses static PokeAPI sprites (not animated Showdown GIFs)
    expect(result[0].imageUrl).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png'
    );
    expect(result[0].shinyImageUrl).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png'
    );

    expect(result[1].imageUrl).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
    );

    expect(result[2].imageUrl).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png'
    );
  });

  it('should avoid JSON.parse on sprite strings', async () => {
    const spriteJson = JSON.stringify({ front_default: 'foo' });
    const pokemonList = Array(100)
      .fill(null)
      .map((_, i) =>
        makePokemon({
          id: i + 1,
          name: `mon-${i}`,
          pokemonsprites: [{ sprites: spriteJson }],
        })
      );

    mockFetchResponse({ pokemon: pokemonList });

    // Reset spy to ignore the setup calls if any (none expected)
    parseSpy.mockClear();

    await fetchAllPokemons();

    // Vitest/Vite internals may call JSON.parse (e.g., sourcemap parsing depending on flags).
    // What we care about here is that the app does NOT parse the sprite JSON string per entry.
    const spriteParseCalls = parseSpy.mock.calls.filter(([arg]) => arg === spriteJson);
    expect(spriteParseCalls).toHaveLength(0);
  });
});
