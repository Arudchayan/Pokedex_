import { useCallback } from 'react';
import { usePokemonStore } from '../store/usePokemonStore';
import { useToast } from '../context/ToastContext';
import type { SortOption } from '../types/sorting';

export const useFilterController = () => {
  const { addToast } = useToast();

  const sortBy = usePokemonStore((s) => s.sortBy);
  const sortOrder = usePokemonStore((s) => s.sortOrder);

  const handleTypeToggle = useCallback(
    (type: string) => {
      usePokemonStore.getState().toggleType(type);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    usePokemonStore.getState().clearFilters();
    addToast('Filters cleared', 'info');
  }, [addToast]);

  const handleGenerationChange = useCallback(
    (val: string) => {
      usePokemonStore.getState().setGeneration(val);
    },
    []
  );

  const handleFlavorTextChange = useCallback(
    (val: string) => {
      usePokemonStore.getState().setFlavorTextSearch(val);
    },
    []
  );

  const handleSortChange = useCallback(
    (val: SortOption) => {
      usePokemonStore.getState().setSort(val, sortOrder);
    },
    [sortOrder]
  );

  const handleOrderChange = useCallback(
    (val: 'asc' | 'desc') => {
      usePokemonStore.getState().setSort(sortBy, val);
    },
    [sortBy]
  );

  const handleSearchChange = useCallback(
    (val: string) => {
      usePokemonStore.getState().setSearchTerm(val);
    },
    []
  );

  return {
    handleTypeToggle,
    handleClearFilters,
    handleGenerationChange,
    handleFlavorTextChange,
    handleSortChange,
    handleOrderChange,
    handleSearchChange,
  };
};

export type FilterController = ReturnType<typeof useFilterController>;
