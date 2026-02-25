import type { Action, PokemonState, ReducerContext } from '../pokemonStoreTypes';

export function reducePokemonStoreSorting(
  _state: PokemonState,
  action: Action,
  _ctx: ReducerContext
): Partial<PokemonState> | PokemonState | undefined {
  switch (action.type) {
    case 'SET_SORT':
      return { sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };

    case 'SET_POKEDEX':
      return { selectedPokedex: action.payload };

    default:
      return undefined;
  }
}
