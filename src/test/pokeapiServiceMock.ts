import { vi } from 'vitest';
import type { PokemonDetails, PokemonListItem } from '../types';
import type { Item, Move } from '../services/pokeapiService';

const defaultPokemonList: PokemonListItem[] = [
  {
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    shinyImageUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png',
    flavorText: 'A strange seed was planted on its back at birth.',
    stats: [{ name: 'hp', value: 45 }],
    abilities: ['overgrow'],
  },
  {
    id: 4,
    name: 'charmander',
    types: ['fire'],
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
    shinyImageUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/4.png',
    flavorText: 'Obviously prefers hot places.',
    stats: [{ name: 'hp', value: 39 }],
    abilities: ['blaze'],
  },
];

const defaultPokemonDetails: PokemonDetails = {
  id: 1,
  name: 'bulbasaur',
  types: ['grass', 'poison'],
  imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  shinyImageUrl:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png',
  detailImageUrl:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
  shinyDetailImageUrl:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/1.png',
  flavorText: 'A strange seed was planted on its back at birth.',
  height: 7,
  weight: 69,
  stats: [{ name: 'hp', value: 45 }],
  abilities: [{ name: 'overgrow' }],
  evolutionChain: [
    { id: 1, name: 'bulbasaur', imageUrl: '', evolvesFromId: null },
    { id: 2, name: 'ivysaur', imageUrl: '', evolvesFromId: 1 },
  ],
  color: 'green',
  habitat: 'grassland',
  captureRate: 45,
  baseHappiness: 50,
  genderRate: 1,
  genus: 'Seed Pokémon',
  weaknesses: ['fire', 'flying'],
  eggGroups: ['monster', 'grass'],
  growthRate: 'medium-slow',
  shape: 'quadruped',
  moves: [
    {
      name: 'tackle',
      type: 'normal',
      power: 40,
      accuracy: 100,
      pp: 35,
      damageClass: 'physical',
      learnMethod: 'level-up',
      level: 1,
    },
  ],
  forms: [
    {
      id: 1,
      name: 'bulbasaur',
      formName: 'Default',
      isDefault: true,
      types: ['grass', 'poison'],
      imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
      shinyImageUrl:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png',
      height: 7,
      weight: 69,
      stats: [{ name: 'hp', value: 45 }],
      abilities: [{ name: 'overgrow' }],
    },
  ],
};

const defaultMoves: Move[] = [
  { id: 1, name: 'pound', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35 },
  {
    id: 2,
    name: 'karate-chop',
    type: 'fighting',
    category: 'physical',
    power: 50,
    accuracy: 100,
    pp: 25,
  },
];

const defaultItems: Item[] = [
  {
    id: 1,
    name: 'master-ball',
    cost: 0,
    flavorText: 'The best ball.',
    imageUrl: 'master-ball.png',
  },
  { id: 2, name: 'ultra-ball', cost: 1200, flavorText: 'A good ball.', imageUrl: 'ultra-ball.png' },
];

export const fetchAllPokemonsMock = vi.fn().mockResolvedValue(defaultPokemonList);
export const fetchPokemonDetailsMock = vi.fn().mockResolvedValue(defaultPokemonDetails);
export const fetchAllMovesMock = vi.fn().mockResolvedValue(defaultMoves);
export const fetchAllItemsMock = vi.fn().mockResolvedValue(defaultItems);

export type PokeapiServiceMockOverrides = Partial<{
  fetchAllPokemons: PokemonListItem[];
  fetchPokemonDetails: PokemonDetails | null;
  fetchAllMoves: Move[];
  fetchAllItems: Item[];
}>;

export const setPokeapiServiceMock = (overrides: PokeapiServiceMockOverrides = {}) => {
  fetchAllPokemonsMock.mockResolvedValue(overrides.fetchAllPokemons ?? defaultPokemonList);
  fetchPokemonDetailsMock.mockResolvedValue(overrides.fetchPokemonDetails ?? defaultPokemonDetails);
  fetchAllMovesMock.mockResolvedValue(overrides.fetchAllMoves ?? defaultMoves);
  fetchAllItemsMock.mockResolvedValue(overrides.fetchAllItems ?? defaultItems);
};

export const getPokeapiServiceMockImpl = () => ({
  fetchAllPokemons: (...args: any[]) => fetchAllPokemonsMock(...args),
  fetchPokemonDetails: (...args: any[]) => fetchPokemonDetailsMock(...args),
  fetchAllMoves: (...args: any[]) => fetchAllMovesMock(...args),
  fetchAllItems: (...args: any[]) => fetchAllItemsMock(...args),
});
