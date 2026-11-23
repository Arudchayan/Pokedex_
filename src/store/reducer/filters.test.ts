import { describe, it, expect } from 'vitest';
import { reducePokemonStoreFilters } from './filters';
import type { PokemonState } from '../pokemonStoreTypes';

const emptyState = (): PokemonState => ({
  masterPokemonList: [],
  loading: false,
  error: null,
  searchTerm: '',
  selectedGeneration: 'all',
  selectedTypes: [],
  flavorTextSearch: '',
  minStats: {},
  selectedAbility: '',
  isMonoType: false,
  minBST: 0,
  filteredPokemon: [],
  isFiltering: false,
  team: [],
  teamCustomizations: {},
  favorites: new Set(),
  history: [],
  future: [],
  comparisonList: [],
  sortBy: 'id',
  sortOrder: 'asc',
  theme: 'dark',
  accent: 'cyan',
  isShiny: false,
  achievements: {},
  gameStats: {},
  savedTeams: [],
});

const ctx = { teamCapacity: 6, maxComparison: 4, maxHistory: 20 };

const applyMinStat = (stat: string, value: number) =>
  reducePokemonStoreFilters(
    emptyState(),
    { type: 'SET_MIN_STAT', payload: { stat, value } },
    ctx
  ) as Partial<PokemonState>;

describe('SET_MIN_STAT legal stat bounds', () => {
  it('clamps values above 255 to 255', () => {
    expect(applyMinStat('hp', 9999)).toEqual({ minStats: { hp: 255 } });
    expect(applyMinStat('hp', 256)).toEqual({ minStats: { hp: 255 } });
  });

  it('keeps in-range values untouched', () => {
    expect(applyMinStat('hp', 255)).toEqual({ minStats: { hp: 255 } });
    expect(applyMinStat('attack', 42)).toEqual({ minStats: { attack: 42 } });
  });

  it('removes the filter for negative or non-finite values', () => {
    expect(applyMinStat('hp', -5)).toEqual({ minStats: {} });
    expect(applyMinStat('hp', Number.NaN)).toEqual({ minStats: {} });
    expect(applyMinStat('hp', Number.POSITIVE_INFINITY)).toEqual({ minStats: {} });
  });

  it('applies the same bounds to every stat', () => {
    const stats = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
    for (const stat of stats) {
      expect(applyMinStat(stat, 9999)).toEqual({ minStats: { [stat]: 255 } });
    }
  });
});
