import type { Action, PokemonState, ReducerContext } from '../pokemonStoreTypes';

export function pushHistory(history: number[][], currentTeam: number[], maxHistory: number) {
  const next = [...history, currentTeam];
  if (next.length > maxHistory) next.shift();
  return next;
}

export function reducePokemonStoreTeam(
  state: PokemonState,
  action: Action,
  ctx: ReducerContext
): Partial<PokemonState> | PokemonState | undefined {
  switch (action.type) {
    case 'ADD_TO_TEAM': {
      const id = action.payload.id;
      if (state.team.length >= ctx.teamCapacity || state.team.includes(id)) {
        return state;
      }
      return {
        team: [...state.team, id],
        history: pushHistory(state.history, state.team, ctx.maxHistory),
        future: [],
      };
    }

    case 'REMOVE_FROM_TEAM':
      return {
        team: state.team.filter((tid) => tid !== action.payload),
        history: pushHistory(state.history, state.team, ctx.maxHistory),
        future: [],
      };

    case 'UPDATE_TEAM_MEMBER': {
      // UPDATE_TEAM_MEMBER is a no-op for the ID array (TeamMember
      // customisations like EVs/IVs/moves are stored elsewhere).
      // We still push history so undo reverts the action that triggered this.
      return {
        history: pushHistory(state.history, state.team, ctx.maxHistory),
        future: [],
      };
    }

    case 'REORDER_TEAM': {
      const { fromIndex, toIndex } = action.payload;
      if (
        fromIndex < 0 ||
        fromIndex >= state.team.length ||
        toIndex < 0 ||
        toIndex >= state.team.length ||
        fromIndex === toIndex
      ) {
        return state;
      }
      const team = [...state.team];
      const [movedId] = team.splice(fromIndex, 1);
      team.splice(toIndex, 0, movedId);
      return {
        team,
        history: pushHistory(state.history, state.team, ctx.maxHistory),
        future: [],
      };
    }

    case 'CLEAR_TEAM':
      return {
        team: [],
        history: pushHistory(state.history, state.team, ctx.maxHistory),
        future: [],
      };

    case 'SET_TEAM': {
      const teamIds = action.payload.slice(0, ctx.teamCapacity).map((p) => p.id);
      // Cheap comparison for 0-6 numbers.
      if (teamIds.length === state.team.length && teamIds.every((id, i) => id === state.team[i])) {
        return state;
      }
      return {
        team: teamIds,
        history: pushHistory(state.history, state.team, ctx.maxHistory),
        future: [],
      };
    }

    case 'UNDO_TEAM': {
      if (state.history.length === 0) return state;
      const previousTeam = state.history[state.history.length - 1];
      return {
        team: previousTeam,
        history: state.history.slice(0, -1),
        future: [state.team, ...state.future],
      };
    }

    case 'REDO_TEAM': {
      if (state.future.length === 0) return state;
      const nextTeam = state.future[0];
      return {
        team: nextTeam,
        history: pushHistory(state.history, state.team, ctx.maxHistory),
        future: state.future.slice(1),
      };
    }

    default:
      return undefined;
  }
}
