import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePokemonStore } from '../store/usePokemonStore';
import { useToast } from '../context/ToastContext';
import type { PokemonListItem, TeamMember } from '../types';
import { env } from '../config/env';

export const useTeamController = () => {
  const { addToast } = useToast();
  const TEAM_CAPACITY = env.teamCapacity;

  // team is now number[] (ID array)
  const team = usePokemonStore((s) => s.team);
  const filteredPokemon = usePokemonStore((s) => s.filteredPokemon);

  // Refs for stable callbacks that shouldn't re-bind on every list mutation.
  const teamRef = useRef(team);
  const filteredPokemonRef = useRef(filteredPokemon);

  useEffect(() => {
    teamRef.current = team;
  }, [team]);

  useEffect(() => {
    filteredPokemonRef.current = filteredPokemon;
  }, [filteredPokemon]);

  // Derived state — team is already an ID array, wrap in a Set for O(1) lookups.
  const teamIds = useMemo(() => new Set(team), [team]);
  const teamIsFull = team.length >= TEAM_CAPACITY;

  const handleAddToTeam = useCallback(
    (pokemon: PokemonListItem) => {
      const currentTeam = teamRef.current;
      if (currentTeam.length >= TEAM_CAPACITY) {
        addToast('Team is full!', 'error');
        return;
      }
      if (currentTeam.includes(pokemon.id)) {
        addToast(`${pokemon.name} is already in the team.`, 'warning');
        return;
      }
      usePokemonStore.getState().addToTeam(pokemon);
      addToast(`Added ${pokemon.name} to team!`, 'success');
    },
    [TEAM_CAPACITY, addToast]
  );

  const handleRemoveFromTeam = useCallback(
    (id: number) => {
      usePokemonStore.getState().removeFromTeam(id);
      addToast('Removed from team', 'info');
    },
    [addToast]
  );

  const handleClearTeam = useCallback(() => {
    usePokemonStore.getState().clearTeam();
    addToast('Team cleared', 'info');
  }, [addToast]);

  const handleUpdateTeamMember = useCallback((id: number, updates: Partial<TeamMember>) => {
    usePokemonStore.getState().updateTeamMember(id, updates);
  }, []);

  const handleLoadTeam = useCallback((loadedTeam: TeamMember[]) => {
    usePokemonStore.getState().setTeam(loadedTeam);
  }, []);

  const handleRandomizeTeam = useCallback(() => {
    const emptySlots = TEAM_CAPACITY - team.length;
    if (emptySlots <= 0) return;

    const currentFiltered = filteredPokemonRef.current;
    const teamSet = new Set(team);
    const available = currentFiltered.filter((p) => !teamSet.has(p.id));
    if (available.length === 0) return;

    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, emptySlots);
    selected.forEach((pokemon) => {
      usePokemonStore.getState().addToTeam(pokemon);
    });
  }, [TEAM_CAPACITY, team]);

  const handleReorderTeam = useCallback((fromIndex: number, toIndex: number) => {
    usePokemonStore.getState().reorderTeam(fromIndex, toIndex);
  }, []);

  return {
    teamIds,
    teamIsFull,
    handleAddToTeam,
    handleRemoveFromTeam,
    handleClearTeam,
    handleUpdateTeamMember,
    handleLoadTeam,
    handleRandomizeTeam,
    handleReorderTeam,
  };
};

export type TeamController = ReturnType<typeof useTeamController>;
