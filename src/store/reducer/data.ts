import { applyFilters, applySort, type PokemonFilterOptions } from '../../domain/pokemonList';
import type { Action, PokemonState, ReducerContext } from '../pokemonStoreTypes';

function selectFilterOptions(state: PokemonState): PokemonFilterOptions {
  return {
    searchTerm: state.searchTerm,
    selectedGeneration: state.selectedGeneration,
    selectedTypes: state.selectedTypes,
    flavorTextSearch: state.flavorTextSearch,
    minStats: state.minStats,
    selectedAbility: state.selectedAbility,
    isMonoType: state.isMonoType,
    minBST: state.minBST,
  };
}

export function reducePokemonStoreData(
  state: PokemonState,
  action: Action,
  _ctx: ReducerContext
): Partial<PokemonState> | PokemonState | undefined {
  switch (action.type) {
    case 'SET_POKEMON_LIST': {
      // Ensure filteredPokemon is populated immediately after the list loads.
      // The worker/effect layer can still refine updates afterwards, but this avoids
      // an empty list when fast data resolution happens before subscriptions attach.
      const masterPokemonList = action.payload;
      const filters = selectFilterOptions(state);
      const relevantFavorites = state.sortBy === 'favorite' ? state.favorites : new Set<number>();
      const filtered = applyFilters(masterPokemonList, filters);
      const sorted = applySort(filtered, state.sortBy, state.sortOrder, relevantFavorites);
      return { masterPokemonList, filteredPokemon: sorted, isFiltering: false };
    }

    case 'SET_LOADING':
      return { loading: action.payload };

    case 'SET_ERROR':
      return { error: action.payload };

    default:
      return undefined;
  }
}
