import { useCallback, useEffect, useRef, useState } from 'react';
import { playUISound, toggleAudio, isAudioEnabled } from '../services/soundService';
import { usePokemon } from '../context/PokemonContext';
import { usePokemonStore } from '../store/usePokemonStore';
import { useToast } from '../context/ToastContext';
import { useModalState } from '../hooks/useModalState';
import { useTeamController } from '../hooks/useTeamController';
import { useFilterController } from '../hooks/useFilterController';
import { useComparisonController } from '../hooks/useComparisonController';
import { env } from '../config/env';

export type ViewMode = 'grid' | 'list';

export const useAppController = () => {
  const {
    loading,
    error,
    searchTerm,
    selectedGeneration,
    selectedTypes,
    flavorTextSearch,
    team,
    teamPokemon,
    favorites,
    comparisonList,
    comparisonPokemon,
    sortBy,
    sortOrder,
    theme,
    isShiny,
    filteredPokemon,
    reload,
    isCyberpunk,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePokemon();

  const { addToast } = useToast();
  const modalState = useModalState();

  const TEAM_CAPACITY = env.teamCapacity;
  const MAX_COMPARISON = env.maxComparison;

  // Composed controllers
  const teamController = useTeamController();
  const filterController = useFilterController();
  const comparisonController = useComparisonController();

  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(isAudioEnabled());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isPaginationEnabled, setIsPaginationEnabled] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // For Virtualization, we pass the entire filtered list
  const virtualList = filteredPokemon;

  // Refs for stable callbacks that shouldn't re-bind on filter/list mutations.
  const filteredPokemonRef = useRef(filteredPokemon);
  const favoritesRef = useRef(favorites);

  useEffect(() => {
    filteredPokemonRef.current = filteredPokemon;
  }, [filteredPokemon]);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  const handleSelectPokemon = useCallback((id: number) => {
    setSelectedPokemonId(id);
    document.body.style.overflow = 'hidden';
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPokemonId(null);
    document.body.style.overflow = '';
  }, []);

  const handleNext = useCallback(() => {
    if (selectedPokemonId === null) return;
    const currentIndex = filteredPokemon.findIndex((pokemon) => pokemon.id === selectedPokemonId);
    if (currentIndex > -1 && currentIndex < filteredPokemon.length - 1) {
      setSelectedPokemonId(filteredPokemon[currentIndex + 1].id);
    }
  }, [selectedPokemonId, filteredPokemon]);

  const handlePrevious = useCallback(() => {
    if (selectedPokemonId === null) return;
    const currentIndex = filteredPokemon.findIndex((pokemon) => pokemon.id === selectedPokemonId);
    if (currentIndex > 0) {
      setSelectedPokemonId(filteredPokemon[currentIndex - 1].id);
    }
  }, [selectedPokemonId, filteredPokemon]);

  const handleToggleFavorite = useCallback(
    (id: number) => {
      const isFav = favoritesRef.current.has(id);
      usePokemonStore.getState().toggleFavorite(id);
      playUISound('click');
      addToast(isFav ? 'Removed from favorites' : 'Added to favorites', 'success');
    },
    [addToast]
  );

  const handleToggleAudio = useCallback(() => {
    const newState = toggleAudio();
    setAudioEnabled(newState);
    playUISound('click');
  }, []);

  const handleToggleShiny = useCallback(() => {
    usePokemonStore.getState().toggleShiny();
  }, []);

  const handleRandomPokemon = useCallback(() => {
    const currentFiltered = filteredPokemonRef.current;
    if (currentFiltered.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentFiltered.length);
      const randomPokemon = currentFiltered[randomIndex];
      handleSelectPokemon(randomPokemon.id);
      playUISound('whoosh');
    }
  }, [handleSelectPokemon]);

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  return {
    // Data + UI
    loading,
    error,
    searchTerm,
    selectedGeneration,
    selectedTypes,
    flavorTextSearch,
    team,
    teamPokemon,
    favorites,
    comparisonList,
    comparisonPokemon,
    sortBy,
    sortOrder,
    theme,
    isShiny,
    isCyberpunk,
    filteredPokemon,
    virtualList,

    // Derived config
    TEAM_CAPACITY,
    MAX_COMPARISON,

    // Commands
    reload,
    undo,
    redo,
    canUndo,
    canRedo,

    // Local UI state
    audioEnabled,
    viewMode,
    isPaginationEnabled,
    searchInputRef,
    setViewMode,
    setIsPaginationEnabled,

    // Detail view
    selectedPokemonId,
    setSelectedPokemonId,

    // Modal state
    ...modalState,

    // Handlers (local)
    handleSelectPokemon,
    handleCloseDetail,
    handleNext,
    handlePrevious,
    handleToggleFavorite,
    handleToggleAudio,
    handleToggleShiny,
    handleRandomPokemon,
    handleFocusSearch,

    // Composed controllers
    ...teamController,
    ...filterController,
    ...comparisonController,
  };
};

export type AppController = ReturnType<typeof useAppController>;
