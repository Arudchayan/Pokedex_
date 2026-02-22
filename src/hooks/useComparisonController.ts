import { useCallback, useEffect, useRef } from 'react';
import { usePokemonStore } from '../store/usePokemonStore';
import { useToast } from '../context/ToastContext';
import { playUISound } from '../services/soundService';
import type { PokemonListItem } from '../types';
import { env } from '../config/env';

export const useComparisonController = () => {
  const { addToast } = useToast();
  const MAX_COMPARISON = env.maxComparison;

  // comparisonList is now number[] (ID array)
  const comparisonList = usePokemonStore((s) => s.comparisonList);

  // Ref for stable callback that shouldn't re-bind on every comparison mutation.
  const comparisonListRef = useRef(comparisonList);

  useEffect(() => {
    comparisonListRef.current = comparisonList;
  }, [comparisonList]);

  const handleAddToComparison = useCallback(
    (pokemon: PokemonListItem) => {
      const currentComparison = comparisonListRef.current;
      if (currentComparison.length >= MAX_COMPARISON) {
        addToast(`Comparison list is full (max ${MAX_COMPARISON}).`, 'error');
        return;
      }
      if (currentComparison.includes(pokemon.id)) {
        addToast('Already in comparison.', 'warning');
        return;
      }
      usePokemonStore.getState().addToComparison(pokemon);
      playUISound('success');
      addToast(`Added ${pokemon.name} to comparison`, 'success');
    },
    [MAX_COMPARISON, addToast]
  );

  const handleRemoveFromComparison = useCallback(
    (id: number) => {
      usePokemonStore.getState().removeFromComparison(id);
      addToast('Removed from comparison', 'info');
    },
    [addToast]
  );

  return {
    handleAddToComparison,
    handleRemoveFromComparison,
  };
};

export type ComparisonController = ReturnType<typeof useComparisonController>;
