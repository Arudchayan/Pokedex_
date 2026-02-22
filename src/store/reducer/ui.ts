import type { Action, PokemonState, ReducerContext } from '../pokemonStoreTypes';

export function reducePokemonStoreUI(
  state: PokemonState,
  action: Action,
  _ctx: ReducerContext
): Partial<PokemonState> | PokemonState | undefined {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return { theme: state.theme === 'dark' ? 'light' : 'dark' };

    case 'SET_THEME':
      return { theme: action.payload };

    case 'SET_ACCENT':
      return { accent: action.payload };

    case 'TOGGLE_SHINY':
      return { isShiny: !state.isShiny };

    default:
      return undefined;
  }
}

