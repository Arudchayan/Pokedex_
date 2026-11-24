import { useState, useEffect, useId, useRef, Suspense, lazy, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import FilterControls from '../components/layout/FilterControls';
import { PokemonGridSkeleton } from '../components/base/SkeletonComposites';
import SortingControls from '../components/layout/SortingControls';
import VirtualPokemonList from '../components/pokemon/VirtualPokemonList';
import MobileTeamSheet from '../components/team/MobileTeamSheet';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { AppController } from './useAppController';

const TeamBuilder = lazy(() => import('../components/team/TeamBuilder'));

type Props = {
  controller: AppController;
};

export default function AppMain({ controller }: Props) {
  const {
    theme,
    isCyberpunk,
    isShiny,
    sortBy,
    sortOrder,
    viewMode,
    isPaginationEnabled,
    setIsPaginationEnabled,
    setViewMode,
    selectedGeneration,
    selectedTypes,
    flavorTextSearch,
    loading,
    isRetrying,
    error,
    reload,
    virtualList,
    teamIds,
    teamIsFull,
    favorites,
    comparisonList,
    MAX_COMPARISON,
    TEAM_CAPACITY,
    masterPokemonList,
    filteredPokemon,
    teamPokemon,
    undo,
    redo,
    canUndo,
    canRedo,
    handleSelectPokemon,
    handleSortChange,
    handleOrderChange,
    selectedPokedex,
    handlePokedexChange,
    handleGenerationChange,
    handleTypeToggle,
    handleFlavorTextChange,
    handleClearFilters,
    handleAddToTeam,
    handleRemoveFromTeam,
    handleToggleFavorite,
    handleAddToComparison,
    handleRemoveFromComparison: _handleRemoveFromComparison,
    handleClearTeam,
    handleUpdateTeamMember,
    handleLoadTeam,
    handleRandomizeTeam,
    handleReorderTeam,
  } = controller;

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileFullBuilderOpen, setMobileFullBuilderOpen] = useState(false);
  const fullBuilderRef = useRef<HTMLDivElement>(null);
  const fullBuilderHeadingRef = useRef<HTMLHeadingElement>(null);
  const fullBuilderTitleId = useId();
  const mobileFiltersPanelId = `mobile-filters-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const mobileFilterCount =
    selectedTypes.length +
    (selectedGeneration !== 'all' ? 1 : 0) +
    (flavorTextSearch.trim() ? 1 : 0);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  // Below xl the results sit beside the filters, so window width overestimates
  // the available card width (3 columns at 1024 would leave ~100px cards).
  const isXlViewport = useMediaQuery('(min-width: 1280px)');

  useFocusTrap({
    active: mobileFullBuilderOpen,
    containerRef: fullBuilderRef,
    initialFocusRef: fullBuilderHeadingRef,
    onEscape: () => setMobileFullBuilderOpen(false),
  });

  useEffect(() => {
    if (isDesktop) setMobileFullBuilderOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!mobileFullBuilderOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFullBuilderOpen]);

  const handleTeamSelect = useCallback(
    (id: number) => {
      setMobileFullBuilderOpen(false);
      handleSelectPokemon(id);
    },
    [handleSelectPokemon]
  );

  const hasFilteredPokemon = filteredPokemon.length > 0;

  const teamBuilderProps = useMemo(
    () => ({
      team: teamPokemon,
      onRemove: handleRemoveFromTeam,
      onClear: handleClearTeam,
      onSelect: handleTeamSelect,
      teamCapacity: TEAM_CAPACITY,
      theme,
      onUpdateTeamMember: handleUpdateTeamMember,
      onLoadTeam: handleLoadTeam,
      onRandomize: handleRandomizeTeam,
      hasFilteredPokemon,
      isCyberpunk,
      availablePokemon: masterPokemonList,
      availablePokemonLoading: loading,
      availablePokemonError: error,
      onRetryAvailablePokemon: reload,
      onAddToTeam: handleAddToTeam,
      undo,
      redo,
      canUndo,
      canRedo,
      onReorderTeam: handleReorderTeam,
    }),
    [
      teamPokemon,
      handleRemoveFromTeam,
      handleClearTeam,
      handleTeamSelect,
      TEAM_CAPACITY,
      theme,
      handleUpdateTeamMember,
      handleLoadTeam,
      handleRandomizeTeam,
      hasFilteredPokemon,
      isCyberpunk,
      masterPokemonList,
      loading,
      error,
      reload,
      handleAddToTeam,
      undo,
      redo,
      canUndo,
      canRedo,
      handleReorderTeam,
    ]
  );

  const resultsRef = useRef<HTMLDivElement>(null);
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const focusAfterRetryRef = useRef(false);
  const retryWasInFlightRef = useRef(false);
  const retryOutcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [retryStatus, setRetryStatus] = useState('');
  const isInitialLoading = loading && !error;

  const handleRetry = () => {
    if (isRetrying) return;
    focusAfterRetryRef.current = true;
    void reload();
  };

  // Announce the retry start and its outcome through the existing single status
  // region. A failed initial load still stays silent there so the alert owns
  // that announcement (see #96).
  useEffect(() => {
    if (retryOutcomeTimerRef.current !== null) {
      clearTimeout(retryOutcomeTimerRef.current);
      retryOutcomeTimerRef.current = null;
    }

    if (isRetrying) {
      retryWasInFlightRef.current = true;
      setRetryStatus('Retrying Pokemon data...');
      return;
    }

    if (!retryWasInFlightRef.current) return;

    // Let the provider's success effect clear `error` before deciding the
    // outcome; effects in the parent run after this child effect.
    retryOutcomeTimerRef.current = setTimeout(() => {
      retryOutcomeTimerRef.current = null;
      retryWasInFlightRef.current = false;
      setRetryStatus(error ? `Retry failed. ${error}` : 'Pokemon data loaded.');
    }, 0);

    return () => {
      if (retryOutcomeTimerRef.current !== null) {
        clearTimeout(retryOutcomeTimerRef.current);
        retryOutcomeTimerRef.current = null;
      }
    };
  }, [isRetrying, error]);

  // Keep keyboard focus anchored to whichever state replaces the Retry button,
  // but only when focus was ours to begin with. If the user has moved on to
  // another control, leave it alone. Never focus a live region (role=status or
  // role=alert): those announce their own changes and focusing them can
  // duplicate the announcement.
  useEffect(() => {
    if (!focusAfterRetryRef.current) return;

    // Wait for the retry outcome to settle (the provider may clear the error
    // one commit after isRetrying flips) before deciding where focus belongs.
    if (!isRetrying && retryWasInFlightRef.current) return;

    const active = document.activeElement;
    const focusWasOurs =
      active === null ||
      active === document.body ||
      active === retryButtonRef.current ||
      (resultsRef.current?.contains(active) ?? false);

    // The Retry button is disabled while its cycle runs, so park focus on the
    // results region until the outcome is known.
    if (loading || isRetrying) {
      if (focusWasOurs) resultsRef.current?.focus();
      return;
    }

    focusAfterRetryRef.current = false;
    if (!focusWasOurs) return;

    if (error) {
      retryButtonRef.current?.focus();
    } else {
      resultsRef.current?.focus();
    }
  }, [loading, error, isRetrying, retryStatus]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-8 outline-none"
    >
      <div className="flex flex-col gap-4 sm:gap-8 lg:flex-row">
        <section className="min-w-0 flex-1">
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:gap-4 md:flex-row md:items-center">
              <SortingControls
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onOrderChange={handleOrderChange}
                theme={theme}
                selectedPokedex={selectedPokedex}
                onPokedexChange={handlePokedexChange}
              />

              <div className="flex gap-2 sm:gap-4">
                <div
                  className={`flex rounded-lg border p-1 ${
                    theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-200'
                  }`}
                  role="group"
                  aria-label="Pagination Mode"
                >
                  <button
                    type="button"
                    onClick={() => setIsPaginationEnabled(false)}
                    className={`rounded-md p-2 transition-colors ${
                      !isPaginationEnabled
                        ? theme === 'dark'
                          ? 'bg-white/10 text-white'
                          : 'bg-slate-100 text-slate-900'
                        : theme === 'dark'
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Infinite Scroll"
                    aria-label="Infinite Scroll"
                    aria-pressed={!isPaginationEnabled}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaginationEnabled(true)}
                    className={`rounded-md p-2 transition-colors ${
                      isPaginationEnabled
                        ? theme === 'dark'
                          ? 'bg-white/10 text-white'
                          : 'bg-slate-100 text-slate-900'
                        : theme === 'dark'
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Pagination"
                    aria-label="Pagination"
                    aria-pressed={isPaginationEnabled}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>
                </div>

                <div
                  className={`flex rounded-lg border p-1 ${
                    theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-200'
                  }`}
                  role="group"
                  aria-label="View Mode"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-md p-2 transition-colors ${
                      viewMode === 'grid'
                        ? theme === 'dark'
                          ? 'bg-white/10 text-white'
                          : 'bg-slate-100 text-slate-900'
                        : theme === 'dark'
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Grid View"
                    aria-label="Grid View"
                    aria-pressed={viewMode === 'grid'}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`rounded-md p-2 transition-colors ${
                      viewMode === 'list'
                        ? theme === 'dark'
                          ? 'bg-white/10 text-white'
                          : 'bg-slate-100 text-slate-900'
                        : theme === 'dark'
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="List View"
                    aria-label="List View"
                    aria-pressed={viewMode === 'list'}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/*
            Below the desktop filter breakpoint, filters sit beside the results so
            opening them never pushes the first row off screen.
          */}
          <div className="flex flex-col gap-4 sm:gap-8 md:max-xl:grid md:max-xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:max-xl:items-start md:max-xl:gap-6 lg:max-xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
            <div>
              {/* Filters disclosure below the desktop filter breakpoint */}
              <div className="xl:hidden">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen((open) => !open)}
                  aria-expanded={mobileFiltersOpen}
                  aria-controls={mobileFiltersPanelId}
                  aria-label={
                    mobileFilterCount > 0 ? `Filters (${mobileFilterCount} active)` : 'Filters'
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                    theme === 'dark'
                      ? 'border-white/10 bg-slate-950/80 text-slate-200 hover:bg-white/5'
                      : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    Filters
                    {mobileFilterCount > 0 && (
                      <span className="bg-primary-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {mobileFilterCount}
                      </span>
                    )}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {mobileFiltersOpen && (
                  <div className="mt-2">
                    <FilterControls
                      id={mobileFiltersPanelId}
                      selectedGeneration={selectedGeneration}
                      onGenerationChange={handleGenerationChange}
                      selectedTypes={selectedTypes}
                      onTypeToggle={handleTypeToggle}
                      flavorTextSearch={flavorTextSearch}
                      onFlavorTextChange={handleFlavorTextChange}
                      onClearFilters={handleClearFilters}
                    />
                  </div>
                )}
              </div>
              {/* Desktop filter controls - always visible from the wide desktop breakpoint up */}
              <div className="hidden xl:block">
                <FilterControls
                  selectedGeneration={selectedGeneration}
                  onGenerationChange={handleGenerationChange}
                  selectedTypes={selectedTypes}
                  onTypeToggle={handleTypeToggle}
                  flavorTextSearch={flavorTextSearch}
                  onFlavorTextChange={handleFlavorTextChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </div>

            <div className="min-w-0">
              {/*
                Status live region sits outside the aria-busy results region: assistive
                tech may defer announcements for updates inside a busy container.
              */}
              <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {isInitialLoading ? 'Loading Pokemon...' : retryStatus}
              </p>

              <div>
                <div
                  ref={resultsRef}
                  role="region"
                  aria-label="Pokemon results"
                  aria-busy={isInitialLoading || Boolean(isRetrying)}
                  tabIndex={-1}
                  className="outline-none"
                >
                  {isInitialLoading ? (
                    <PokemonGridSkeleton count={12} />
                  ) : error ? null : (
                    <>
                      <VirtualPokemonList
                        pokemonList={virtualList}
                        viewMode={viewMode}
                        onSelect={handleSelectPokemon}
                        teamIds={teamIds}
                        teamIsFull={teamIsFull}
                        favorites={favorites}
                        comparisonList={comparisonList}
                        MAX_COMPARISON={MAX_COMPARISON}
                        onAddToTeam={handleAddToTeam}
                        onRemoveFromTeam={handleRemoveFromTeam}
                        onToggleFavorite={handleToggleFavorite}
                        onAddToComparison={handleAddToComparison}
                        theme={theme}
                        isShiny={isShiny}
                        isCyberpunk={isCyberpunk}
                        isPaginationEnabled={isPaginationEnabled}
                        gridColumnsOverride={isXlViewport ? undefined : 2}
                      />

                      {filteredPokemon.length === 0 && (
                        <div
                          className={`rounded-2xl border py-16 text-center ${
                            theme === 'dark'
                              ? 'border-white/10 bg-white/5 text-slate-300'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          {/* Magnifying glass SVG illustration */}
                          <div
                            className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${
                              theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'
                            }`}
                          >
                            <svg
                              className={`h-10 w-10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 10.5H8.5m0 0l2-2m-2 2l2 2"
                                strokeWidth={1.5}
                              />
                            </svg>
                          </div>
                          <p
                            className={`text-xl font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                          >
                            No Pokemon match your filters
                          </p>
                          <p
                            className={`mt-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
                          >
                            Try adjusting your search criteria or clear all filters to see every
                            Pokemon.
                          </p>
                          <button
                            type="button"
                            onClick={handleClearFilters}
                            className={`mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                              theme === 'dark'
                                ? 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 border border-primary-500/30'
                                : 'bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200'
                            }`}
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Clear Filters
                          </button>
                        </div>
                      )}

                      <div
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className={`mt-8 rounded-xl border p-4 text-center ${
                          isCyberpunk
                            ? 'cyber-panel'
                            : theme === 'dark'
                              ? 'bg-black/20 border-white/10'
                              : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            isCyberpunk
                              ? 'cyber-text'
                              : theme === 'dark'
                                ? 'text-slate-400'
                                : 'text-slate-600'
                          }`}
                        >
                          {isCyberpunk ? 'PC Box:' : 'Showing'}{' '}
                          <span
                            className={`font-bold ${isCyberpunk ? 'cyber-text-pink' : 'text-primary-500'}`}
                          >
                            {filteredPokemon.length}
                          </span>{' '}
                          Pokemon {isCyberpunk ? 'found' : ''}
                          {favorites.size > 0 && (
                            <span className="ml-4">
                              -{' '}
                              <span
                                className={`font-bold ${isCyberpunk ? 'cyber-text-yellow' : 'text-yellow-500'}`}
                              >
                                {favorites.size}
                              </span>{' '}
                              {isCyberpunk ? 'Marked' : 'Favorites'}
                            </span>
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div
                    className={`rounded-2xl border p-8 text-center ${
                      theme === 'dark'
                        ? 'border-red-500/30 bg-red-500/10 text-red-200'
                        : 'border-red-300 bg-red-50 text-red-700'
                    }`}
                  >
                    <div role="alert">
                      <p className="text-2xl font-bold">Oops! Something went wrong.</p>
                      <p className="mt-2">{error}</p>
                    </div>
                    <button
                      ref={retryButtonRef}
                      type="button"
                      onClick={handleRetry}
                      disabled={isRetrying}
                      aria-busy={isRetrying}
                      className={`mt-6 inline-flex items-center gap-2 rounded-full border px-6 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70 ${
                        theme === 'dark'
                          ? 'border-red-200/60 bg-red-500/20 text-red-100 hover:bg-red-500/30'
                          : 'border-red-300 bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {isRetrying && (
                        <span
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                        />
                      )}
                      {isRetrying ? 'Retrying...' : 'Retry'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Desktop team builder sidebar - hidden on mobile */}
        <div className="hidden lg:block w-full lg:w-72 xl:w-80">
          <Suspense
            fallback={
              <div
                className={`rounded-2xl border p-4 text-sm ${
                  theme === 'dark'
                    ? 'border-white/10 bg-black/20 text-slate-400'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                Loading team builder…
              </div>
            }
          >
            <TeamBuilder {...teamBuilderProps} />
          </Suspense>
        </div>

        {/* Mobile team builder - FAB + bottom sheet */}
        <MobileTeamSheet
          team={teamPokemon}
          onRemove={handleRemoveFromTeam}
          onClear={handleClearTeam}
          onSelect={handleSelectPokemon}
          teamCapacity={TEAM_CAPACITY}
          theme={theme}
          isCyberpunk={isCyberpunk}
          availablePokemon={masterPokemonList}
          availablePokemonLoading={loading}
          availablePokemonError={error}
          onRetryAvailablePokemon={reload}
          onAddToTeam={handleAddToTeam}
          onOpenFullBuilder={() => setMobileFullBuilderOpen(true)}
        />

        {/* Full TeamBuilder as a mobile-only fullscreen modal */}
        {mobileFullBuilderOpen &&
          ReactDOM.createPortal(
            <div
              ref={fullBuilderRef}
              className="fixed inset-0 z-[1070] lg:hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby={fullBuilderTitleId}
              tabIndex={-1}
            >
              <div
                className={`flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0 ${
                  theme === 'dark' || isCyberpunk
                    ? 'bg-slate-950 border-white/10 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <h2
                  id={fullBuilderTitleId}
                  ref={fullBuilderHeadingRef}
                  tabIndex={-1}
                  className="text-base font-bold"
                >
                  Team Builder
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileFullBuilderOpen(false)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    theme === 'dark' || isCyberpunk
                      ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  aria-label="Close full team builder"
                >
                  Done
                </button>
              </div>
              <div
                className={`flex-1 overflow-y-auto overscroll-contain p-3 ${
                  theme === 'dark' || isCyberpunk ? 'bg-slate-950' : 'bg-slate-50'
                }`}
              >
                <Suspense
                  fallback={
                    <div
                      className={`rounded-2xl border p-4 text-sm ${
                        theme === 'dark'
                          ? 'border-white/10 bg-black/20 text-slate-400'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      Loading team builder…
                    </div>
                  }
                >
                  <TeamBuilder {...teamBuilderProps} />
                </Suspense>
              </div>
            </div>,
            document.body
          )}
      </div>
    </main>
  );
}
