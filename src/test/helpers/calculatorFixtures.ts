import type { PokemonDetails, PokemonListItem } from '../../types';

const baseDetails = {
  imageUrl: 'pikachu.png',
  shinyImageUrl: 'pikachu-shiny.png',
  detailImageUrl: 'pikachu-large.png',
  shinyDetailImageUrl: 'pikachu-large-shiny.png',
  flavorText: 'Pika pika.',
  height: 4,
  weight: 60,
  color: 'yellow',
  habitat: 'forest',
  baseHappiness: 50,
  genus: 'Mouse Pokémon',
  weaknesses: ['ground'],
  growthRate: 'medium',
  shape: 'quadruped',
  moves: [],
  forms: [],
  evolutionChain: [],
} satisfies Partial<PokemonDetails>;

export const pikachuDetails: PokemonDetails = {
  ...baseDetails,
  id: 25,
  name: 'Pikachu',
  types: ['electric'],
  stats: [
    { name: 'hp', value: 35 },
    { name: 'attack', value: 55 },
    { name: 'defense', value: 40 },
    { name: 'special-attack', value: 50 },
    { name: 'special-defense', value: 50 },
    { name: 'speed', value: 90 },
  ],
  abilities: [{ name: 'static' }],
  captureRate: 190,
  genderRate: 4,
  eggGroups: ['field', 'fairy'],
};

export const bulbasaurDetails: PokemonDetails = {
  ...baseDetails,
  id: 1,
  name: 'Bulbasaur',
  types: ['grass', 'poison'],
  stats: [
    { name: 'hp', value: 45 },
    { name: 'attack', value: 49 },
    { name: 'defense', value: 49 },
    { name: 'special-attack', value: 65 },
    { name: 'special-defense', value: 65 },
    { name: 'speed', value: 45 },
  ],
  abilities: [{ name: 'overgrow' }],
  captureRate: 45,
  genderRate: 1,
  eggGroups: ['monster', 'grass'],
  evolutionChain: [{ id: 1, name: 'Bulbasaur', imageUrl: '', evolvesFromId: null }],
};

export const charmanderDetails: PokemonDetails = {
  ...baseDetails,
  id: 4,
  name: 'Charmander',
  types: ['fire'],
  stats: [
    { name: 'hp', value: 39 },
    { name: 'attack', value: 52 },
    { name: 'defense', value: 43 },
    { name: 'special-attack', value: 60 },
    { name: 'special-defense', value: 50 },
    { name: 'speed', value: 65 },
  ],
  abilities: [{ name: 'blaze' }],
  captureRate: 45,
  genderRate: 1,
  eggGroups: ['monster', 'dragon'],
  evolutionChain: [{ id: 4, name: 'Charmander', imageUrl: '', evolvesFromId: null }],
};

export const tackleMove = {
  name: 'tackle',
  type: 'normal',
  power: 40,
  accuracy: 100,
  pp: 35,
  damageClass: 'physical',
  learnMethod: 'level-up',
  level: 1,
};

export const masterPokemonList: PokemonListItem[] = [
  {
    id: 25,
    name: 'Pikachu',
    nameLower: 'pikachu',
    imageUrl: 'pikachu.png',
    shinyImageUrl: 'pikachu-shiny.png',
    types: ['electric'],
    flavorText: 'Pika pika.',
    stats: pikachuDetails.stats,
    abilities: ['static'],
  },
  {
    id: 1,
    name: 'Bulbasaur',
    nameLower: 'bulbasaur',
    imageUrl: 'bulbasaur.png',
    shinyImageUrl: 'bulbasaur-shiny.png',
    types: ['grass', 'poison'],
    flavorText: 'Bulba.',
    stats: bulbasaurDetails.stats,
    abilities: ['overgrow'],
  },
  {
    id: 4,
    name: 'Charmander',
    nameLower: 'charmander',
    imageUrl: 'charmander.png',
    shinyImageUrl: 'charmander-shiny.png',
    types: ['fire'],
    flavorText: 'Char.',
    stats: charmanderDetails.stats,
    abilities: ['blaze'],
  },
];

export const detailsById: Record<number, PokemonDetails> = {
  1: bulbasaurDetails,
  4: charmanderDetails,
  25: pikachuDetails,
};
