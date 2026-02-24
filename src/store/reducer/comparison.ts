import type { Action, PokemonState, ReducerContext } from '../pokemonStoreTypes';

export function reducePokemonStoreComparison(
  state: PokemonState,
  action: Action,
  ctx: ReducerContext
): Partial<PokemonState> | PokemonState | undefined {
  switch (action.type) {
    case 'ADD_TO_COMPARISON': {
      const id = action.payload.id;
      if (state.comparisonList.length >= ctx.maxComparison || state.comparisonList.includes(id)) {
        return state;
      }
      return { comparisonList: [...state.comparisonList, id] };
    }

    case 'REMOVE_FROM_COMPARISON':
      return { comparisonList: state.comparisonList.filter((tid) => tid !== action.payload) };

    case 'CLEAR_COMPARISON':
      return { comparisonList: [] };

    case 'SET_COMPARISON_LIST': {
      const ids = Array.from(new Set(action.payload))
        .filter((id) => typeof id === 'number' && Number.isFinite(id))
        .slice(0, ctx.maxComparison);
      return { comparisonList: ids };
    }

    default:
      return undefined;
  }
}
