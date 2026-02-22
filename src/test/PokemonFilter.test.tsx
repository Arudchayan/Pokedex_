import { describe, it, expect } from 'vitest';
import { filterPokemonList } from '../domain/pokemonList';
import { PokemonListItem } from '../types';

const samplePokemon: PokemonListItem[] = [
  {
    id: 1,
    name: 'bulbasaur',
    imageUrl: '',
    shinyImageUrl: '',
    types: ['grass', 'poison'],
    flavorText: 'A strange seed was planted on its back at birth.',
    stats: [
      { name: 'hp', value: 45 },
      { name: 'attack', value: 49 },
    ],
    abilities: ['overgrow', 'chlorophyll'],
  },
  {
    id: 4,
    name: 'charmander',
    imageUrl: '',
    shinyImageUrl: '',
    types: ['fire'],
    flavorText: 'Obviously prefers hot places.',
    stats: [
      { name: 'hp', value: 39 },
      { name: 'attack', value: 52 },
    ],
    abilities: ['blaze', 'solar-power'],
  },
  {
    id: 152,
    name: 'chikorita',
    imageUrl: '',
    shinyImageUrl: '',
    types: ['grass'],
    flavorText: 'A sweet aroma gently wafts from the leaf on its head.',
    stats: [
      { name: 'hp', value: 45 },
      { name: 'attack', value: 49 },
    ],
    abilities: ['overgrow', 'leaf-guard'],
  },
];

describe('filterPokemonList', () => {
  it('keeps generation/type filters stable', () => {
    const filtered = filterPokemonList(samplePokemon, {
      searchTerm: '',
      selectedGeneration: 'Generation I',
      selectedTypes: ['grass'],
      flavorTextSearch: '',
      minStats: {},
      selectedAbility: '',
    });

    expect(filtered.map((pokemon) => pokemon.id)).toMatchSnapshot();
  });

  it('keeps combined search/stat/ability filters stable', () => {
    const filtered = filterPokemonList(samplePokemon, {
      searchTerm: 'saur',
      selectedGeneration: 'Generation I',
      selectedTypes: ['grass'],
      flavorTextSearch: 'seed',
      minStats: { attack: 40 },
      selectedAbility: 'over',
    });

    expect(filtered.map((pokemon) => pokemon.name)).toMatchSnapshot();
  });
});
