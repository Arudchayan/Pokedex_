export interface PokemonListItem {
  id: number;
  name: string;
  imageUrl: string;
  shinyImageUrl: string;
  types: string[];
  flavorText: string;
  stats: PokemonStat[];
  abilities: string[];
  bst?: number;
  // Performance optimizations: pre-computed lowercased values
  nameLower?: string;
  flavorTextLower?: string;
  abilitiesLower?: string[];
}

export interface TeamMember extends PokemonListItem {
  selectedMoves?: string[];
  selectedAbility?: string;
  selectedNature?: string;
  selectedItem?: string;
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
  isShiny?: boolean;
}

export interface Item {
  id: number;
  name: string;
  imageUrl: string;
  cost?: number;
  flavorText?: string;
  nameLower?: string;
}

export interface PokemonStat {
  name: string;
  value: number;
}

export interface PokemonAbility {
  name: string;
}

export interface Evolution {
  id: number;
  name: string;
  imageUrl: string;
  trigger?: string;
  minLevel?: number;
  item?: string;
  heldItem?: string;
  timeOfDay?: string;
  knownMove?: string;
  minHappiness?: number;
  location?: string;
  evolvesFromId?: number | null;
}

export interface PokemonMove {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  damageClass: string;
  learnMethod: string;
  level: number;
  priority?: number;
}

export interface SpriteSet {
  default: string;
  shiny?: string;
}

export interface PokemonForm {
  id: number;
  name: string;
  formName: string;
  isDefault: boolean;
  types: string[];
  imageUrl: string;
  shinyImageUrl: string;
  height: number;
  weight: number;
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  genSprites?: Record<string, SpriteSet>;
}

export interface PokemonDetails extends Omit<PokemonListItem, 'abilities'> {
  height: number; // in decimetres
  weight: number; // in hectograms
  abilities: PokemonAbility[];
  evolutionChain: Evolution[];
  color: string;
  habitat: string | null;
  captureRate: number;
  baseHappiness: number;
  genderRate: number; // Chance of being female in 1/8ths. -1 for genderless.
  genus: string;
  weaknesses: string[];
  eggGroups: string[];
  growthRate: string;
  shape: string;
  moves: PokemonMove[];
  detailImageUrl: string;
  shinyDetailImageUrl: string;
  forms: PokemonForm[];
  genSprites?: Record<string, SpriteSet>;
}
