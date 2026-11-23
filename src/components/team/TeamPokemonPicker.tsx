import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PokemonListItem } from '../../types';
import TypeBadge from '../charts/TypeBadge';
import Loader from '../shared/Loader';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { playUISound } from '../../services/soundService';

const MAX_VISIBLE_RESULTS = 60;

interface TeamPokemonPickerProps {
  /** 1-based slot the chosen Pokémon will fill. */
  slotNumber: number;
  teamCapacity: number;
  /** IDs already on the team; they are omitted from the results. */
  teamIds: ReadonlySet<number>;
  pokemonList: PokemonListItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelect: (pokemon: PokemonListItem) => void;
  onCancel: () => void;
  theme: 'dark' | 'light';
  isCyberpunk?: boolean;
}

/**
 * In-context picker opened from an empty Team Builder slot. It is a nested
 * dialog: the team panel stays mounted underneath and regains focus when the
 * picker closes.
 */
const TeamPokemonPicker: React.FC<TeamPokemonPickerProps> = ({
  slotNumber,
  teamCapacity,
  teamIds,
  pokemonList,
  loading = false,
  error = null,
  onRetry,
  onSelect,
  onCancel,
  theme,
  isCyberpunk = false,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();
  const listboxId = useId();

  const isDark = theme === 'dark' || isCyberpunk;

  useFocusTrap({
    active: true,
    containerRef: dialogRef,
    initialFocusRef: inputRef,
    onEscape: onCancel,
  });

  // Keep the page behind the picker from scrolling while it is open. Restore
  // whatever the parent dialog had set so nested cleanup stays correct.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    const available = pokemonList.filter((pokemon) => !teamIds.has(pokemon.id));
    if (!normalizedQuery) return available.slice(0, MAX_VISIBLE_RESULTS);

    return available
      .filter((pokemon) =>
        (pokemon.nameLower ?? pokemon.name.toLowerCase()).includes(normalizedQuery)
      )
      .slice(0, MAX_VISIBLE_RESULTS);
  }, [pokemonList, teamIds, normalizedQuery]);

  // Reset the highlight whenever the query changes so Enter always targets a
  // visible option.
  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery]);

  const activeOptionIndex =
    results.length === 0 ? -1 : Math.min(Math.max(activeIndex, 0), results.length - 1);

  useEffect(() => {
    if (activeOptionIndex < 0) return;
    const activeOption = listRef.current?.querySelector<HTMLElement>(
      `[data-option-index="${activeOptionIndex}"]`
    );
    activeOption?.scrollIntoView?.({ block: 'nearest' });
  }, [activeOptionIndex]);

  const moveHighlight = (delta: number) => {
    if (results.length === 0) return;
    setActiveIndex((current) => {
      const base = Math.min(Math.max(current, 0), results.length - 1);
      return (base + delta + results.length) % results.length;
    });
  };

  const choose = (pokemon: PokemonListItem) => {
    playUISound('click');
    onSelect(pokemon);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === 'Enter' && activeOptionIndex >= 0) {
      const selected = results[activeOptionIndex];
      if (!selected) return;
      event.preventDefault();
      choose(selected);
    }
  };

  const showInitialLoading = loading && pokemonList.length === 0;
  const showDataError = !showInitialLoading && Boolean(error) && pokemonList.length === 0;
  const showEmptyDataset = !showInitialLoading && !showDataError && pokemonList.length === 0;

  const statusMessage = showInitialLoading
    ? 'Loading Pokémon data.'
    : showDataError
      ? 'Pokémon data could not be loaded.'
      : showEmptyDataset
        ? 'No Pokémon data is available.'
        : results.length === 0
          ? 'No Pokémon found.'
          : `${results.length} Pokémon found.`;

  const optionId = (pokemon: PokemonListItem) => `${listboxId}-option-${pokemon.id}`;

  const panelClass = isCyberpunk
    ? 'cyber-panel cyber-corners'
    : isDark
      ? 'border border-white/10 bg-slate-950 text-white'
      : 'border border-slate-200 bg-white text-slate-900';

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onCancel}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl shadow-2xl sm:max-h-[80vh] sm:max-w-lg sm:rounded-2xl ${panelClass}`}
      >
        <div
          className={`flex items-start justify-between gap-3 border-b px-4 py-3 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div>
            <h2 id={titleId} className="text-base font-bold">
              Add a Pokémon to slot {slotNumber}
            </h2>
            <p
              id={descriptionId}
              className={`mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Search and select a Pokémon for slot {slotNumber} of {teamCapacity}. Your team stays
              open behind this picker.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playUISound('click');
              onCancel();
            }}
            className={`shrink-0 rounded-lg p-2 transition-colors ${
              isDark
                ? 'text-slate-400 hover:bg-white/10 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-label="Cancel adding a Pokémon"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className={`border-b px-4 py-3 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <label htmlFor={inputId} className="sr-only">
            Search Pokémon
          </label>
          <div className="relative">
            <svg
              className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={results.length > 0 ? listboxId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={
                activeOptionIndex >= 0 ? optionId(results[activeOptionIndex]) : undefined
              }
              aria-label="Search Pokémon to add"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search Pokémon..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-colors ${
                isDark
                  ? 'border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/40'
                  : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30'
              }`}
            />
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            {statusMessage}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {showInitialLoading ? (
            <div className="px-4 py-10">
              <Loader size="h-10 w-10" message="Loading Pokémon data..." />
            </div>
          ) : showDataError || showEmptyDataset ? (
            <div role="alert" className="px-5 py-8 text-center">
              <p
                className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
              >
                {showDataError ? 'Pokémon data could not be loaded.' : 'No Pokémon data available.'}
              </p>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {showDataError && error
                  ? error
                  : 'The Pokédex list is empty, so there is nothing to add right now.'}
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={() => {
                    playUISound('click');
                    onRetry();
                    inputRef.current?.focus();
                  }}
                  className={`mt-4 rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${
                    isDark
                      ? 'border-primary-400/40 bg-primary-500/20 text-primary-200 hover:bg-primary-500/30'
                      : 'border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  Retry
                </button>
              )}
            </div>
          ) : results.length === 0 ? (
            <div role="status" className="px-5 py-8 text-center">
              <p
                className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
              >
                No Pokémon found.
              </p>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {query.trim()
                  ? `Nothing matches “${query.trim()}”. Try another name.`
                  : 'Every Pokémon in the list is already on your team.'}
              </p>
            </div>
          ) : (
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label="Pokémon search results"
              className="py-1"
            >
              {results.map((pokemon, index) => {
                const isActive = index === activeOptionIndex;
                return (
                  <li
                    key={pokemon.id}
                    id={optionId(pokemon)}
                    role="option"
                    aria-selected={isActive}
                    data-option-index={index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(pokemon)}
                    className={`mx-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      isActive
                        ? isDark
                          ? 'bg-primary-500/25 text-white'
                          : 'bg-primary-100 text-slate-900'
                        : isDark
                          ? 'text-slate-200 hover:bg-white/5'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <img
                      src={pokemon.imageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 pixelated"
                      loading="lazy"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold capitalize">
                      {pokemon.name}
                    </span>
                    <span className="flex shrink-0 gap-1">
                      {pokemon.types.map((type) => (
                        <TypeBadge key={type} type={type} size="sm" />
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          className={`flex items-center justify-between gap-3 border-t px-4 py-3 text-xs ${
            isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}
        >
          <span className="min-w-0 flex-1">
            {results.length > 0
              ? `Showing ${results.length} Pokémon. Use ↑/↓ and Enter to add.`
              : 'Press Escape to cancel.'}
          </span>
          <button
            type="button"
            onClick={() => {
              playUISound('click');
              onCancel();
            }}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              isDark
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TeamPokemonPicker;
