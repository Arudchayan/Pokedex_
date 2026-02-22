import type { Action, PokemonState, ReducerContext } from '../pokemonStoreTypes';
import { MAX_POKEMON_ID } from '../../constants';

const MAX_FAVORITES = 5000;

const isSafeFavoriteId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= MAX_POKEMON_ID;

const sanitizeFavorites = (favorites: Set<number>): Set<number> => {
  const safe = new Set<number>();
  for (const favorite of favorites) {
    if (!isSafeFavoriteId(favorite)) continue;
    safe.add(favorite);
    if (safe.size >= MAX_FAVORITES) break;
  }
  return safe;
};

export function reducePokemonStoreFavorites(
  state: PokemonState,
  action: Action,
  _ctx: ReducerContext
): Partial<PokemonState> | PokemonState | undefined {
  switch (action.type) {
    case 'SET_FAVORITES':
      return { favorites: sanitizeFavorites(action.payload) };

    case 'TOGGLE_FAVORITE': {
      if (!isSafeFavoriteId(action.payload)) return state;
      const favorites = new Set(state.favorites);
      if (favorites.has(action.payload)) favorites.delete(action.payload);
      else {
        if (favorites.size >= MAX_FAVORITES) return state;
        favorites.add(action.payload);
      }
      return { favorites };
    }

    default:
      return undefined;
  }
}
