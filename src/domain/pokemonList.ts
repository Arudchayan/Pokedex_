import { PokemonListItem } from '../types';
import { GENERATIONS } from '../constants';
import { SortOption } from '../types/sorting';

export interface PokemonFilterOptions {
  searchTerm: string;
  selectedGeneration: string;
  selectedTypes: string[];
  flavorTextSearch: string;
  minStats: Record<string, number>;
  selectedAbility: string;
  isMonoType?: boolean;
  minBST?: number;
}

export const applyFilters = (
  pokemonList: PokemonListItem[],
  options: PokemonFilterOptions
): PokemonListItem[] => {
  const searchTerm = options.searchTerm.trim().toLowerCase();
  const flavorSearch = options.flavorTextSearch.trim().toLowerCase();
  const abilitySearch = options.selectedAbility.trim().toLowerCase();
  const generationRange =
    options.selectedGeneration !== 'all' ? GENERATIONS[options.selectedGeneration] : undefined;

  // Pre-calculate filter conditions to avoid redundant checks inside the loop
  const hasMinStats = Object.keys(options.minStats).length > 0;
  const minStatsEntries = hasMinStats ? Object.entries(options.minStats) : [];
  const hasSelectedTypes = options.selectedTypes.length > 0;
  const hasMinBST = options.minBST && options.minBST > 0;

  return pokemonList.filter((pokemon) => {
    // Optimization: Use pre-computed lowercase name if available
    const nameLower = pokemon.nameLower || pokemon.name.toLowerCase();
    if (searchTerm && !nameLower.includes(searchTerm)) {
      return false;
    }

    if (generationRange) {
      const [minId, maxId] = generationRange.range;
      if (pokemon.id < minId || pokemon.id > maxId) {
        return false;
      }
    }

    if (hasSelectedTypes) {
      const hasAllTypes = options.selectedTypes.every((type) => pokemon.types.includes(type));
      if (!hasAllTypes) {
        return false;
      }
    }

    if (options.isMonoType && pokemon.types.length > 1) {
      return false;
    }

    if (hasMinBST) {
      const bst = pokemon.bst ?? pokemon.stats.reduce((sum, stat) => sum + stat.value, 0);
      if (bst < options.minBST!) {
        return false;
      }
    }

    // Optimization: Use pre-computed lowercase flavor text if available
    const flavorLower = pokemon.flavorTextLower || pokemon.flavorText.toLowerCase();
    if (flavorSearch && !flavorLower.includes(flavorSearch)) {
      return false;
    }

    if (hasMinStats) {
      const meetsStats = minStatsEntries.every(([statName, minValue]) => {
        const statValue = pokemon.stats.find((entry) => entry.name === statName)?.value;
        return statValue !== undefined ? statValue >= minValue : false;
      });
      if (!meetsStats) {
        return false;
      }
    }

    if (abilitySearch) {
      // Optimization: Use pre-computed lowercase abilities if available
      if (pokemon.abilitiesLower) {
        if (!pokemon.abilitiesLower.some((a) => a.includes(abilitySearch))) {
          return false;
        }
      } else {
        const matchesAbility = pokemon.abilities.some((ability) =>
          ability.toLowerCase().includes(abilitySearch)
        );
        if (!matchesAbility) {
          return false;
        }
      }
    }

    return true;
  });
};

type RegionalDexMap = Map<number, number> | { [id: number]: number };

export const applySort = (
  pokemonList: PokemonListItem[],
  sortBy: SortOption,
  sortOrder: 'asc' | 'desc',
  favorites: Set<number>,
  regionalDexMap?: RegionalDexMap
): PokemonListItem[] => {
  const sorted = [...pokemonList].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'id':
        comparison = a.id - b.id;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = (a.types[0] ?? '').localeCompare(b.types[0] ?? '');
        break;
      case 'favorite': {
        const aFav = favorites.has(a.id) ? 1 : 0;
        const bFav = favorites.has(b.id) ? 1 : 0;
        comparison = bFav - aFav;
        break;
      }
      case 'regional-dex': {
        if (!regionalDexMap) {
          comparison = a.id - b.id;
          break;
        }
        const getDex = (id: number) =>
          regionalDexMap instanceof Map
            ? (regionalDexMap.get(id) ?? Infinity)
            : (regionalDexMap[id] ?? Infinity);
        const aDex = getDex(a.id);
        const bDex = getDex(b.id);
        comparison = aDex - bDex;
        break;
      }
      case 'bst': {
        const aBST = a.bst ?? a.stats.reduce((acc, s) => acc + s.value, 0);
        const bBST = b.bst ?? b.stats.reduce((acc, s) => acc + s.value, 0);
        comparison = aBST - bBST;
        break;
      }
      case 'hp':
      case 'attack':
      case 'defense':
      case 'special-attack':
      case 'special-defense':
      case 'speed': {
        const aStat = a.stats.find((s) => s.name === sortBy)?.value ?? 0;
        const bStat = b.stats.find((s) => s.name === sortBy)?.value ?? 0;
        comparison = aStat - bStat;
        break;
      }
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

export const filterPokemonList = (pokemonList: PokemonListItem[], options: PokemonFilterOptions) =>
  applyFilters(pokemonList, options);
