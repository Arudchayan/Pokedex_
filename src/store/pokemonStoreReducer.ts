import type { Action, PokemonState, ReducerContext } from './pokemonStoreTypes';
import { reducePokemonStoreData } from './reducer/data';
import { reducePokemonStoreFilters } from './reducer/filters';
import { reducePokemonStoreTeam } from './reducer/team';
import { reducePokemonStoreFavorites } from './reducer/favorites';
import { reducePokemonStoreComparison } from './reducer/comparison';
import { reducePokemonStoreSorting } from './reducer/sorting';
import { reducePokemonStoreUI } from './reducer/ui';
import { reducePokemonStorePersistence } from './reducer/persistence';

export { pushHistory } from './reducer/team';

export function reducePokemonStore(
  state: PokemonState,
  action: Action,
  ctx: ReducerContext
): Partial<PokemonState> | PokemonState {
  return (
    reducePokemonStoreData(state, action, ctx) ??
    reducePokemonStoreFilters(state, action, ctx) ??
    reducePokemonStoreTeam(state, action, ctx) ??
    reducePokemonStoreFavorites(state, action, ctx) ??
    reducePokemonStoreComparison(state, action, ctx) ??
    reducePokemonStoreSorting(state, action, ctx) ??
    reducePokemonStoreUI(state, action, ctx) ??
    reducePokemonStorePersistence(state, action, ctx) ??
    state
  );
}
