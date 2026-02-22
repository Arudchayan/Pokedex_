import type { Action, PokemonState, ReducerContext } from '../pokemonStoreTypes';

export function reducePokemonStoreFilters(
  state: PokemonState,
  action: Action,
  _ctx: ReducerContext
): Partial<PokemonState> | PokemonState | undefined {
  switch (action.type) {
    case 'SET_SEARCH_TERM':
      return { searchTerm: action.payload };

    case 'SET_GENERATION':
      return { selectedGeneration: action.payload };

    case 'TOGGLE_TYPE': {
      const type = action.payload;
      const selectedTypes = state.selectedTypes.includes(type)
        ? state.selectedTypes.filter((t) => t !== type)
        : [...state.selectedTypes, type];
      return { selectedTypes };
    }

    case 'SET_MIN_STAT': {
      const minStats = { ...state.minStats, [action.payload.stat]: action.payload.value };
      if (action.payload.value <= 0) delete minStats[action.payload.stat];
      return { minStats };
    }

    case 'SET_ABILITY':
      return { selectedAbility: action.payload };

    case 'TOGGLE_MONO_TYPE':
      return { isMonoType: !state.isMonoType };

    case 'SET_MIN_BST':
      return { minBST: action.payload };

    case 'CLEAR_FILTERS':
      return {
        selectedGeneration: 'all',
        selectedTypes: [],
        flavorTextSearch: '',
        minStats: {},
        selectedAbility: '',
        isMonoType: false,
        minBST: 0,
      };

    case 'SET_FLAVOR_TEXT_SEARCH':
      return { flavorTextSearch: action.payload };

    default:
      return undefined;
  }
}

