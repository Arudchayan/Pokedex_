import { describe, it, expect } from 'vitest';
import { reducePokemonStoreTeam } from './team';
import type { PokemonState } from '../pokemonStoreTypes';
import type { PokemonListItem, TeamMember } from '../../types';

const basePokemon = (id: number, name: string): PokemonListItem => ({
  id,
  name,
  imageUrl: '',
  shinyImageUrl: '',
  types: ['normal'],
  flavorText: '',
  stats: [],
  abilities: [],
});

const emptyState = (): PokemonState =>
  ({
    masterPokemonList: [],
    loading: false,
    error: null,
    searchTerm: '',
    selectedGeneration: 'all',
    selectedTypes: [],
    flavorTextSearch: '',
    minStats: {},
    selectedAbility: '',
    isMonoType: false,
    minBST: 0,
    filteredPokemon: [],
    isFiltering: false,
    team: [],
    teamCustomizations: {},
    favorites: new Set(),
    history: [],
    future: [],
    comparisonList: [],
    sortBy: 'id',
    sortOrder: 'asc',
    theme: 'dark',
    accent: 'cyan',
    isShiny: false,
    achievements: {},
    gameStats: {},
    savedTeams: [],
  }) as PokemonState;

const ctx = { teamCapacity: 6, maxComparison: 4, maxHistory: 20 };

describe('reducePokemonStoreTeam customizations', () => {
  it('persists member customizations on UPDATE_TEAM_MEMBER', () => {
    const state: PokemonState = {
      ...emptyState(),
      team: [25],
    };

    const next = reducePokemonStoreTeam(
      state,
      {
        type: 'UPDATE_TEAM_MEMBER',
        payload: {
          id: 25,
          updates: {
            selectedMoves: ['Thunderbolt'],
            selectedNature: 'Timid',
            evs: { speed: 252 },
          },
        },
      },
      ctx
    );

    expect(next).toMatchObject({
      teamCustomizations: {
        25: {
          selectedMoves: ['Thunderbolt'],
          selectedNature: 'Timid',
          evs: { speed: 252 },
        },
      },
    });
  });

  it('captures customizations from SET_TEAM payloads', () => {
    const member: TeamMember = {
      ...basePokemon(6, 'charizard'),
      selectedAbility: 'Solar Power',
      selectedItem: 'Charcoal',
    };

    const next = reducePokemonStoreTeam(
      emptyState(),
      { type: 'SET_TEAM', payload: [member] },
      ctx
    );

    expect(next).toMatchObject({
      team: [6],
      teamCustomizations: {
        6: {
          selectedAbility: 'Solar Power',
          selectedItem: 'Charcoal',
        },
      },
    });
  });

  it('prunes customizations when a member is removed', () => {
    const state: PokemonState = {
      ...emptyState(),
      team: [1, 4],
      teamCustomizations: {
        1: { selectedNature: 'Adamant' },
        4: { selectedNature: 'Modest' },
      },
    };

    const next = reducePokemonStoreTeam(state, { type: 'REMOVE_FROM_TEAM', payload: 1 }, ctx);

    expect(next).toMatchObject({
      team: [4],
      teamCustomizations: {
        4: { selectedNature: 'Modest' },
      },
    });
    expect(next && 'teamCustomizations' in next ? next.teamCustomizations?.[1] : undefined).toBe(
      undefined
    );
  });

  it('dedupes species ids when setting a team', () => {
    const memberA: TeamMember = {
      ...basePokemon(25, 'pikachu'),
      selectedNature: 'Timid',
    };
    const memberB: TeamMember = {
      ...basePokemon(25, 'pikachu'),
      selectedNature: 'Jolly',
    };

    const next = reducePokemonStoreTeam(
      emptyState(),
      { type: 'SET_TEAM', payload: [memberA, memberB] },
      ctx
    );

    expect(next).toMatchObject({
      team: [25],
      teamCustomizations: {
        25: { selectedNature: 'Timid' },
      },
    });
  });
});
