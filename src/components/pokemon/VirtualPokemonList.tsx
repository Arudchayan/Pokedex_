import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { PokemonListItem } from '../../types';
import PokemonGridItem from './PokemonGridItem';
import PokemonListRow from './PokemonListRow';
import PaginationControls from '../layout/PaginationControls';
import { POKEMON_PER_PAGE } from '../../constants';

interface VirtualPokemonListProps {
  pokemonList: PokemonListItem[];
  viewMode: 'grid' | 'list';
  onSelect: (id: number) => void;
  teamIds: Set<number>;
  teamIsFull: boolean;
  favorites: Set<number>;
  comparisonList: number[];
  MAX_COMPARISON: number;
  onAddToTeam: (pokemon: PokemonListItem) => void;
  onRemoveFromTeam: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onAddToComparison: (pokemon: PokemonListItem) => void;
  theme: string;
  isShiny: boolean;
  isCyberpunk?: boolean;
  isPaginationEnabled?: boolean;
}

const GRID_ROW_HEIGHT = 360;
const GRID_ROW_HEIGHT_MOBILE = 260;
const LIST_ROW_HEIGHT = 140;

const getGridColumns = (width: number) => {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 2;
};

const useGridColumns = () => {
  const [columns, setColumns] = useState(() =>
    typeof window === 'undefined' ? 4 : getGridColumns(window.innerWidth)
  );

  useEffect(() => {
    const handleResize = () => setColumns(getGridColumns(window.innerWidth));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return columns;
};

const VirtualPokemonList: React.FC<VirtualPokemonListProps> = ({
  pokemonList,
  viewMode,
  onSelect,
  teamIds,
  teamIsFull,
  favorites,
  comparisonList,
  MAX_COMPARISON,
  onAddToTeam,
  onRemoveFromTeam,
  onToggleFavorite,
  onAddToComparison,
  theme,
  isShiny,
  isCyberpunk = false,
  isPaginationEnabled = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const gridColumns = useGridColumns();
  const columns = viewMode === 'grid' ? gridColumns : 1;
  const isVirtualized = !isPaginationEnabled;

  const paginatedPokemon = useMemo(() => {
    if (!isPaginationEnabled || !pokemonList) return pokemonList || [];
    const start = (currentPage - 1) * POKEMON_PER_PAGE;
    return pokemonList.slice(start, start + POKEMON_PER_PAGE);
  }, [pokemonList, currentPage, isPaginationEnabled]);

  const itemsToRender = isPaginationEnabled ? paginatedPokemon : pokemonList || [];
  const totalPages = Math.max(1, Math.ceil((pokemonList?.length || 0) / POKEMON_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [pokemonList, isPaginationEnabled]);

  const rowCount = useMemo(() => {
    if (!isVirtualized) return 0;
    if (viewMode === 'grid') {
      return Math.ceil((pokemonList?.length || 0) / columns);
    }
    return pokemonList?.length || 0;
  }, [isVirtualized, viewMode, pokemonList?.length, columns]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => (viewMode === 'grid' ? (isMobile ? GRID_ROW_HEIGHT_MOBILE : GRID_ROW_HEIGHT) : LIST_ROW_HEIGHT),
    overscan: 6,
  });

  const virtualItems = isVirtualized ? virtualizer.getVirtualItems() : [];
  const totalSize = isVirtualized ? virtualizer.getTotalSize() : 0;

  // --- Keyboard navigation ---
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusingProgrammaticallyRef = useRef(false);
  const activeList = isVirtualized ? pokemonList : itemsToRender;

  // Reset focus when the visible list changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [pokemonList?.length, currentPage, isPaginationEnabled]);

  // After focusedIndex changes, scroll the virtualizer and focus the card
  useEffect(() => {
    if (focusedIndex < 0 || focusedIndex >= activeList.length) return;

    if (isVirtualized) {
      const targetRow = viewMode === 'grid' ? Math.floor(focusedIndex / columns) : focusedIndex;
      virtualizer.scrollToIndex(targetRow, { align: 'auto' });
    }

    const timer = setTimeout(() => {
      const pokemonId = activeList[focusedIndex]?.id;
      if (pokemonId == null) return;
      const el = containerRef.current?.querySelector<HTMLElement>(
        `[data-poke-id="${pokemonId}"] [role="button"]`
      );
      if (el && document.activeElement !== el) {
        focusingProgrammaticallyRef.current = true;
        el.focus({ preventScroll: true });
        focusingProgrammaticallyRef.current = false;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [focusedIndex]);

  /** Sync focusedIndex when a card receives focus via click / tab */
  const handleContainerFocus = useCallback(
    (e: React.FocusEvent) => {
      if (focusingProgrammaticallyRef.current) return;
      const pokeIdEl = (e.target as HTMLElement).closest<HTMLElement>('[data-poke-id]');
      if (pokeIdEl) {
        const pokeId = Number(pokeIdEl.dataset.pokeId);
        const idx = activeList.findIndex((p) => p.id === pokeId);
        if (idx >= 0) setFocusedIndex(idx);
      }
    },
    [activeList]
  );

  /** Arrow / Home / End keyboard navigation */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const total = activeList.length;
      if (total === 0) return;

      let next = focusedIndex;

      switch (e.key) {
        case 'ArrowRight':
          next = focusedIndex < 0 ? 0 : Math.min(focusedIndex + 1, total - 1);
          break;
        case 'ArrowLeft':
          next = focusedIndex < 0 ? 0 : Math.max(focusedIndex - 1, 0);
          break;
        case 'ArrowDown':
          next = focusedIndex < 0 ? 0 : Math.min(focusedIndex + columns, total - 1);
          break;
        case 'ArrowUp':
          next = focusedIndex < 0 ? 0 : Math.max(focusedIndex - columns, 0);
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = total - 1;
          break;
        default:
          return; // let other keys propagate normally
      }

      e.preventDefault();
      setFocusedIndex(next);
    },
    [activeList.length, focusedIndex, columns]
  );

  const renderGridRow = (
    rowIndex: number,
    virtualRow: ReturnType<typeof virtualizer.getVirtualItems>[0]
  ) => {
    const start = rowIndex * columns;
    const rowPokemon = (pokemonList || []).slice(start, start + columns);
    if (rowPokemon.length === 0) return null;

    return (
      <div
        key={`grid-row-${rowIndex}`}
        data-index={virtualRow.index}
        ref={virtualizer.measureElement}
        style={{
          position: 'absolute',
          top: virtualRow.start,
          left: 0,
          width: '100%',
          paddingBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: '1.5rem',
          }}
        >
          {rowPokemon.map((pokemon) => (
            <div key={pokemon.id} data-poke-id={pokemon.id}>
              <PokemonGridItem
                pokemon={pokemon}
                onSelect={onSelect}
                onAddToTeam={onAddToTeam}
                onRemoveFromTeam={onRemoveFromTeam}
                isInTeam={teamIds.has(pokemon.id)}
                teamIsFull={teamIsFull}
                isFavorite={favorites.has(pokemon.id)}
                onToggleFavorite={onToggleFavorite}
                onAddToComparison={onAddToComparison}
                isInComparison={comparisonList.includes(pokemon.id)}
                canAddToComparison={comparisonList.length < MAX_COMPARISON}
                theme={theme}
                isShiny={isShiny}
                isCyberpunk={isCyberpunk}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderListRow = (virtualRow: ReturnType<typeof virtualizer.getVirtualItems>[0]) => {
    const pokemon = (pokemonList || [])[virtualRow.index];
    if (!pokemon) return null;

    return (
      <div
        key={`list-row-${pokemon.id}`}
        data-index={virtualRow.index}
        data-poke-id={pokemon.id}
        ref={virtualizer.measureElement}
        style={{
          position: 'absolute',
          top: virtualRow.start,
          left: 0,
          width: '100%',
          paddingBottom: '0.75rem',
        }}
      >
        <PokemonListRow
          pokemon={pokemon}
          onSelect={onSelect}
          onAddToTeam={onAddToTeam}
          onRemoveFromTeam={onRemoveFromTeam}
          isInTeam={teamIds.has(pokemon.id)}
          teamIsFull={teamIsFull}
          isFavorite={favorites.has(pokemon.id)}
          onToggleFavorite={onToggleFavorite}
          onAddToComparison={onAddToComparison}
          isInComparison={comparisonList.includes(pokemon.id)}
          comparisonIsFull={comparisonList.length >= MAX_COMPARISON}
          theme={theme}
        />
      </div>
    );
  };

  return (
    <>
      <div id="pokemon-list-top" className="scroll-mt-32"></div>
      <div
        ref={containerRef}
        tabIndex={0}
        role="grid"
        aria-label="Pokemon list"
        onKeyDown={handleKeyDown}
        onFocusCapture={handleContainerFocus}
        className="outline-none"
      >
        {isVirtualized ? (
          <div className="relative w-full" style={{ height: `${totalSize}px` }}>
            {viewMode === 'grid'
              ? virtualItems.map((virtualRow) => renderGridRow(virtualRow.index, virtualRow))
              : virtualItems.map((virtualRow) => renderListRow(virtualRow))}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
            {itemsToRender.map((pokemon) => (
              <div key={pokemon.id} data-poke-id={pokemon.id}>
                <PokemonGridItem
                  pokemon={pokemon}
                  onSelect={onSelect}
                  onAddToTeam={onAddToTeam}
                  onRemoveFromTeam={onRemoveFromTeam}
                  isInTeam={teamIds.has(pokemon.id)}
                  teamIsFull={teamIsFull}
                  isFavorite={favorites.has(pokemon.id)}
                  onToggleFavorite={onToggleFavorite}
                  onAddToComparison={onAddToComparison}
                  isInComparison={comparisonList.includes(pokemon.id)}
                  canAddToComparison={comparisonList.length < MAX_COMPARISON}
                  theme={theme}
                  isShiny={isShiny}
                  isCyberpunk={isCyberpunk}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {itemsToRender.map((pokemon) => (
              <div key={pokemon.id} data-poke-id={pokemon.id}>
                <PokemonListRow
                  pokemon={pokemon}
                  onSelect={onSelect}
                  onAddToTeam={onAddToTeam}
                  onRemoveFromTeam={onRemoveFromTeam}
                  isInTeam={teamIds.has(pokemon.id)}
                  teamIsFull={teamIsFull}
                  isFavorite={favorites.has(pokemon.id)}
                  onToggleFavorite={onToggleFavorite}
                  onAddToComparison={onAddToComparison}
                  isInComparison={comparisonList.includes(pokemon.id)}
                  comparisonIsFull={comparisonList.length >= MAX_COMPARISON}
                  theme={theme}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {isPaginationEnabled && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          theme={theme}
        />
      )}
    </>
  );
};

export default React.memo(VirtualPokemonList);
