export const POKEAPI_GRAPHQL_URL =
  import.meta.env.VITE_POKEAPI_GRAPHQL_URL || 'https://beta.pokeapi.co/graphql/v1beta';
export const POKEMON_PER_PAGE = 24;
export const MAX_POKEMON_ID = 1025;

// Timeout constants (in milliseconds)
export const TIMEOUT_DELAYS = {
  BATTLE_TEAM_GENERATION: 8000, // 8 seconds for battle team generation timeout
  DELETE_CONFIRMATION: 3000, // 3 seconds for delete confirmation auto-hide
  STATUS_MESSAGE: 2000, // 2 seconds for status message display (copy, share, etc.)
} as const;

// UI Constants
export const UI_CONSTANTS = {
  MAX_TRAINER_NAME_LENGTH: 12,
  TRAINER_ID_MIN: 0,
  TRAINER_ID_MAX: 99999,
  TRAINER_ID_PADDING: 5,
  DEFAULT_MONEY: 999999,
  CANVAS_SCALE: 2, // For high-resolution image generation
  MAX_TEAM_SIZE: 12, // Maximum team size for URL compression
  MAX_SAVED_TEAMS: 50, // Limit number of saved teams to prevent DoS
} as const;

// Animation & Transition Constants
export const ANIMATION_DURATIONS = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500,
} as const;

export const GENERATIONS: { [key: string]: { range: [number, number] } } = {
  'Generation I': { range: [1, 151] },
  'Generation II': { range: [152, 251] },
  'Generation III': { range: [252, 386] },
  'Generation IV': { range: [387, 493] },
  'Generation V': { range: [494, 649] },
  'Generation VI': { range: [650, 721] },
  'Generation VII': { range: [722, 809] },
  'Generation VIII': { range: [810, 905] },
  'Generation IX': { range: [906, MAX_POKEMON_ID] },
};

export const TYPE_COLORS: { [key: string]: string } = {
  normal: 'bg-gray-400 text-black',
  fire: 'bg-red-500 text-white',
  water: 'bg-blue-500 text-white',
  electric: 'bg-yellow-400 text-black',
  grass: 'bg-green-500 text-white',
  ice: 'bg-cyan-300 text-black',
  fighting: 'bg-orange-700 text-white',
  poison: 'bg-purple-600 text-white',
  ground: 'bg-yellow-600 text-white',
  flying: 'bg-indigo-400 text-white',
  psychic: 'bg-pink-500 text-white',
  bug: 'bg-lime-500 text-white',
  rock: 'bg-stone-500 text-white',
  ghost: 'bg-violet-700 text-white',
  dragon: 'bg-indigo-700 text-white',
  dark: 'bg-gray-700 text-white',
  steel: 'bg-slate-500 text-white',
  fairy: 'bg-pink-300 text-black',
};

export const TYPE_COLORS_HEX: { [key: string]: string } = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

export const STAT_COLORS: { [key: string]: { bar: string; bg: string } } = {
  hp: { bar: 'bg-red-500', bg: 'bg-red-500/20' },
  attack: { bar: 'bg-orange-500', bg: 'bg-orange-500/20' },
  defense: { bar: 'bg-yellow-500', bg: 'bg-yellow-500/20' },
  'special-attack': { bar: 'bg-blue-500', bg: 'bg-blue-500/20' },
  'special-defense': { bar: 'bg-green-500', bg: 'bg-green-500/20' },
  speed: { bar: 'bg-pink-500', bg: 'bg-pink-500/20' },
};

export const ACCENT_COLORS = {
  cyan: {
    300: '103, 232, 249',
    400: '34, 211, 238',
    500: '6, 182, 212',
    600: '8, 145, 178',
  },
  emerald: {
    300: '110, 231, 183',
    400: '52, 211, 153',
    500: '16, 185, 129',
    600: '5, 150, 105',
  },
  violet: {
    300: '196, 181, 253',
    400: '167, 139, 250',
    500: '139, 92, 246',
    600: '124, 58, 237',
  },
  amber: {
    300: '252, 211, 77',
    400: '251, 191, 36',
    500: '245, 158, 11',
    600: '217, 119, 6',
  },
  rose: {
    300: '253, 164, 175',
    400: '251, 113, 133',
    500: '244, 63, 94',
    600: '225, 29, 72',
  },
  blue: {
    300: '147, 197, 253',
    400: '96, 165, 250',
    500: '59, 130, 246',
    600: '37, 99, 235',
  },
  // Cyberpunk Neon Colors
  neonPink: {
    300: '255, 119, 255',
    400: '255, 0, 255',
    500: '236, 0, 204',
    600: '180, 0, 158',
  },
  neonCyan: {
    300: '0, 255, 255',
    400: '0, 230, 255',
    500: '0, 200, 255',
    600: '0, 160, 220',
  },
  neonYellow: {
    300: '255, 255, 102',
    400: '255, 255, 0',
    500: '230, 230, 0',
    600: '200, 200, 0',
  },
  neonGreen: {
    300: '57, 255, 20',
    400: '0, 255, 65',
    500: '0, 220, 60',
    600: '0, 180, 50',
  },
  neonOrange: {
    300: '255, 165, 0',
    400: '255, 140, 0',
    500: '255, 100, 0',
    600: '220, 80, 0',
  },
  neonPurple: {
    300: '200, 80, 255',
    400: '170, 0, 255',
    500: '138, 43, 226',
    600: '110, 0, 200',
  },
} as const;

export type AccentColor = keyof typeof ACCENT_COLORS;

export const TYPE_RELATIONS: { [key: string]: { [key: string]: number } } = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export const EXPANDED_GAMES = {
  'pokemon-colosseum': {
    name: 'Pokémon Colosseum',
    generation: 3,
    hasShadowMoves: true,
    hasRegionalDex: false,
    spriteKey: 'Colosseum',
  },
  'pokemon-xd': {
    name: 'Pokémon XD: Gale of Darkness',
    generation: 3,
    hasShadowMoves: true,
    hasRegionalDex: false,
    spriteKey: 'XD',
  },
  'pokemon-stadium': {
    name: 'Pokémon Stadium',
    generation: 1,
    hasShadowMoves: false,
    hasRegionalDex: false,
    spriteKey: 'Stadium',
  },
  'legends-arceus': {
    name: 'Pokémon Legends: Arceus',
    generation: 8,
    hasShadowMoves: false,
    hasRegionalDex: true,
    spriteKey: 'Hisui',
  },
} as const;

export const NATURES: { [key: string]: { up?: string; down?: string } } = {
  Hardy: {},
  Lonely: { up: 'attack', down: 'defense' },
  Brave: { up: 'attack', down: 'speed' },
  Adamant: { up: 'attack', down: 'special-attack' },
  Naughty: { up: 'attack', down: 'special-defense' },
  Bold: { up: 'defense', down: 'attack' },
  Docile: {},
  Relaxed: { up: 'defense', down: 'speed' },
  Impish: { up: 'defense', down: 'special-attack' },
  Lax: { up: 'defense', down: 'special-defense' },
  Timid: { up: 'speed', down: 'attack' },
  Hasty: { up: 'speed', down: 'defense' },
  Serious: {},
  Jolly: { up: 'speed', down: 'special-attack' },
  Naive: { up: 'speed', down: 'special-defense' },
  Modest: { up: 'special-attack', down: 'attack' },
  Mild: { up: 'special-attack', down: 'defense' },
  Quiet: { up: 'special-attack', down: 'speed' },
  Bashful: {},
  Rash: { up: 'special-attack', down: 'special-defense' },
  Calm: { up: 'special-defense', down: 'attack' },
  Gentle: { up: 'special-defense', down: 'defense' },
  Sassy: { up: 'special-defense', down: 'speed' },
  Careful: { up: 'special-defense', down: 'special-attack' },
  Quirky: {},
};

export const BATTLE_ITEMS = [
  { name: 'None', multiplier: 1 },
  { name: 'Life Orb', multiplier: 1.3 },
  { name: 'Choice Band', multiplier: 1.5 }, // Applies to Attack
  { name: 'Choice Specs', multiplier: 1.5 }, // Applies to Sp. Atk
  { name: 'Expert Belt', multiplier: 1.2 }, // Only super effective
  { name: 'Muscle Band', multiplier: 1.1 }, // Physical
  { name: 'Wise Glasses', multiplier: 1.1 }, // Special
];
