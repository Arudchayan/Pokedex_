import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPokemonDetails, fetchAllPokemons } from './pokeapiService';

const mockFetchResponse = (data: unknown) => {
  (globalThis.fetch as ReturnType<typeof vi.fn>) = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
};

const makePokemon = (overrides: Record<string, unknown>) => ({
  id: 1,
  name: 'testmon',
  height: 7,
  weight: 69,
  is_default: false,
  pokemon_v2_pokemonsprites: [
    {
      sprites: JSON.stringify({
        front_default: 'front.png',
        front_shiny: 'front-shiny.png',
        other: {
          'official-artwork': {
            front_default: 'official.png',
            front_shiny: 'official-shiny.png',
          },
        },
        versions: {
          'generation-v': {
            'black-white': {
              animated: {
                front_default: 'anim.gif',
                front_shiny: 'anim-shiny.gif',
              },
            },
          },
        },
      }),
    },
  ],
  pokemon_v2_pokemontypes: [{ pokemon_v2_type: { name: 'grass' } }],
  pokemon_v2_pokemonstats: [
    { base_stat: 50, pokemon_v2_stat: { name: 'hp' } },
  ],
  pokemon_v2_pokemonabilities: [
    { pokemon_v2_ability: { name: 'overgrow' } },
  ],
  pokemon_v2_pokemonmoves: [],
  ...overrides,
});

const makeSpecies = (overrides: Record<string, unknown>) => ({
  id: 1,
  name: 'testmon',
  capture_rate: 45,
  base_happiness: 70,
  gender_rate: 4,
  pokemon_v2_pokemoncolor: { name: 'green' },
  pokemon_v2_pokemonhabitat: { name: 'forest' },
  pokemon_v2_pokemonspeciesnames: [{ genus: 'Seed Pokemon' }],
  pokemon_v2_growthrate: { name: 'medium-slow' },
  pokemon_v2_pokemonshape: { name: 'quadruped' },
  pokemon_v2_pokemonegggroups: [
    { pokemon_v2_egggroup: { name: 'monster' } },
  ],
  pokemon_v2_evolutionchain: {
    pokemon_v2_pokemonspecies: [],
  },
  pokemon_v2_pokemonspeciesflavortexts: [
    { flavor_text: 'A test pokemon.' },
  ],
  pokemon_v2_pokemons: [],
  ...overrides,
});

describe('pokeapiService transformations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses generic URL construction independent of sprite data validity', async () => {
    const defaultPokemon = makePokemon({
      id: 25,
      name: 'pikachu',
      is_default: true,
      pokemon_v2_pokemonsprites: [{ sprites: '{not-json}' }],
    });

    const species = makeSpecies({
      name: 'pikachu',
      pokemon_v2_pokemons: [defaultPokemon],
    });

    mockFetchResponse({ pokemon_v2_pokemonspecies: [species] });

    const result = await fetchPokemonDetails(25);

    const genericOfficial = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png';
    const genericShinyOfficial = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/25.png';
    const showdown = 'https://play.pokemonshowdown.com/sprites/ani/pikachu.gif';
    const shinyShowdown = 'https://play.pokemonshowdown.com/sprites/ani-shiny/pikachu.gif';

    expect(result?.imageUrl).toBe(showdown);
    expect(result?.detailImageUrl).toBe(genericOfficial);
    expect(result?.shinyImageUrl).toBe(shinyShowdown);
    expect(result?.shinyDetailImageUrl).toBe(genericShinyOfficial);
  });

  it('selects the default form for stats and typing', async () => {
    const altForm = makePokemon({
      id: 10,
      name: 'testmon-alt',
      is_default: false,
      height: 4,
      weight: 40,
      pokemon_v2_pokemontypes: [{ pokemon_v2_type: { name: 'water' } }],
    });

    const defaultForm = makePokemon({
      id: 11,
      name: 'testmon-mega',
      is_default: true,
      height: 12,
      weight: 250,
      pokemon_v2_pokemontypes: [{ pokemon_v2_type: { name: 'fire' } }],
    });

    const species = makeSpecies({
      name: 'testmon',
      pokemon_v2_pokemons: [altForm, defaultForm],
    });

    mockFetchResponse({ pokemon_v2_pokemonspecies: [species] });

    const result = await fetchPokemonDetails(11);

    expect(result?.types).toEqual(['fire']);
    expect(result?.height).toBe(12);
    expect(result?.weight).toBe(250);
  });

  it('maps evolution chain entries and handles special trigger rules', async () => {
    const baseSpecies = {
      id: 100,
      name: 'base',
      evolves_from_species_id: null,
      pokemon_v2_pokemons: [
        { pokemon_v2_pokemonsprites: [{ sprites: undefined }] },
      ],
      pokemon_v2_pokemonevolutions: [
        {
          min_level: null,
          min_happiness: null,
          pokemon_v2_evolutiontrigger: { name: 'level-up' },
          pokemon_v2_item: null,
          pokemon_v2_move: null,
          time_of_day: null,
          pokemon_v2_location: null,
        },
      ],
    };

    const evolvedSpecies = {
      id: 101,
      name: 'evolved',
      evolves_from_species_id: 100,
      pokemon_v2_pokemons: [
        { pokemon_v2_pokemonsprites: [{ sprites: undefined }] },
      ],
      pokemon_v2_pokemonevolutions: [
        {
          min_level: null,
          min_happiness: null,
          pokemon_v2_evolutiontrigger: { name: 'level-up' },
          pokemon_v2_item: null,
          pokemon_v2_move: null,
          time_of_day: null,
          pokemon_v2_location: null,
        },
      ],
    };

    const defaultPokemon = makePokemon({
      id: 100,
      name: 'base',
      is_default: true,
    });

    const species = makeSpecies({
      name: 'base',
      pokemon_v2_pokemons: [defaultPokemon],
      pokemon_v2_evolutionchain: {
        pokemon_v2_pokemonspecies: [baseSpecies, evolvedSpecies],
      },
    });

    mockFetchResponse({ pokemon_v2_pokemonspecies: [species] });

    const result = await fetchPokemonDetails(100);

    expect(result?.evolutionChain).toHaveLength(2);
    expect(result?.evolutionChain[1]).toMatchObject({
      id: 101,
      name: 'evolved',
      trigger: 'Special Condition',
      evolvesFromId: 100,
    });
  });

  it('normalizes move names and learn methods', async () => {
    const defaultPokemon = makePokemon({
      id: 200,
      name: 'move-mon',
      is_default: true,
      pokemon_v2_pokemonmoves: [
        {
          level: 1,
          pokemon_v2_movelearnmethod: { name: 'level-up' },
          pokemon_v2_move: {
            name: 'solar-beam',
            power: 120,
            accuracy: 100,
            pp: 10,
            priority: null,
            pokemon_v2_type: { name: 'grass' },
            pokemon_v2_movedamageclass: null,
          },
        },
      ],
    });

    const species = makeSpecies({
      name: 'move-mon',
      pokemon_v2_pokemons: [defaultPokemon],
    });

    mockFetchResponse({ pokemon_v2_pokemonspecies: [species] });

    const result = await fetchPokemonDetails(200);

    expect(result?.moves[0]).toMatchObject({
      name: 'solar beam',
      learnMethod: 'level up',
      damageClass: 'status',
      priority: 0,
    });
  });

  it('cleans flavor text using the constant regex', async () => {
    const defaultPokemon = makePokemon({ id: 1, name: 'bulbasaur', is_default: true });
    const species = makeSpecies({
      name: 'bulbasaur',
      pokemon_v2_pokemons: [defaultPokemon],
      pokemon_v2_pokemonspeciesflavortexts: [
        { flavor_text: 'A strange\nseed was\fplanted on its\nback.' },
      ],
    });

    mockFetchResponse({ pokemon_v2_pokemonspecies: [species] });

    const result = await fetchPokemonDetails(1);
    expect(result?.flavorText).toBe('A strange seed was planted on its back.');
  });
});
