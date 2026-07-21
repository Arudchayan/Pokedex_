import type { Action, PokemonState, ReducerContext } from '../pokemonStoreTypes';
import {
  extractTeamCustomization,
  mergeTeamCustomization,
} from '../teamCustomization';

export function pushHistory(history: number[][], currentTeam: number[], maxHistory: number) {
  const next = [...history, currentTeam];
  if (next.length > maxHistory) next.shift();
  return next;
}

function pruneCustomizations(
  customizations: PokemonState['teamCustomizations'],
  teamIds: number[]
): PokemonState['teamCustomizations'] {
  const keep = new Set(teamIds);
  const next: PokemonState['teamCustomizations'] = {};
  for (const [key, value] of Object.entries(customizations)) {
    const id = Number(key);
    if (keep.has(id)) next[id] = value;
  }
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
      const customization = extractTeamCustomization(action.payload);
      return {
        team: [...state.team, id],
        teamCustomizations: customization
          ? { ...state.teamCustomizations, [id]: customization }
          : state.teamCustomizations,
        history: pushHistory(state.history, state.team, ctx.maxHistory),
        future: [],
      };
    }

    case 'REMOVE_FROM_TEAM': {
      const team = state.team.filter((tid) => tid !== action.payload);
      return {
        team,
        teamCustomizations: pruneCustomizations(state.teamCustomizations, team),
        history: pushHistory(state.history, state.team, ctx.maxHistory),
        future: [],
      };
    }

    case 'UPDATE_TEAM_MEMBER': {
      const { id, updates } = action.payload;
      if (!state.team.includes(id)) return state;
      return {
        teamCustomizations: {
          ...state.teamCustomizations,
          [id]: mergeTeamCustomization(state.teamCustomizations[id], updates),
        },
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
        teamCustomizations: {},
        history: pushHistory(state.history, state.team, ctx.maxHistory),
        future: [],
      };

    case 'SET_TEAM': {
      const limited = action.payload.slice(0, ctx.teamCapacity);
      const teamIds = limited.map((p) => p.id);
      const teamCustomizations: PokemonState['teamCustomizations'] = {};
      for (const member of limited) {
        const customization = extractTeamCustomization(member);
        if (customization) teamCustomizations[member.id] = customization;
      }
      const sameIds =
        teamIds.length === state.team.length && teamIds.every((id, i) => id === state.team[i]);
      const sameCustomizations =
        sameIds &&
        Object.keys(teamCustomizations).length === Object.keys(state.teamCustomizations).length &&
        Object.entries(teamCustomizations).every(
          ([id, value]) =>
            JSON.stringify(state.teamCustomizations[Number(id)] ?? null) === JSON.stringify(value)
        );
      if (sameIds && sameCustomizations) {
        return state;
      }
      return {
        team: teamIds,
        teamCustomizations,
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
