import FilterControls from '../components/layout/FilterControls';
import { PokemonGridSkeleton } from '../components/base/SkeletonComposites';
import SortingControls from '../components/layout/SortingControls';
import VirtualPokemonList from '../components/pokemon/VirtualPokemonList';
import TeamBuilder from '../components/team/TeamBuilder';
import type { AppController } from './useAppController';

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
    error,
    reload,
    virtualList,
    teamIds,
    teamIsFull,
    favorites,
    comparisonList,
    MAX_COMPARISON,
    TEAM_CAPACITY,
    filteredPokemon,
    teamPokemon,
    undo,
    redo,
    canUndo,
    canRedo,
    handleSelectPokemon,
    handleSortChange,
    handleOrderChange,
    handleGenerationChange,
    handleTypeToggle,
    handleFlavorTextChange,
    handleClearFilters,
    handleAddToTeam,
    handleRemoveFromTeam,
    handleToggleFavorite,
    handleAddToComparison,
    handleRemoveFromComparison,
    handleClearTeam,
    handleUpdateTeamMember,
    handleLoadTeam,
    handleRandomizeTeam,
    handleFocusSearch,
    handleReorderTeam,
  } = controller;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-7xl px-6 py-8 outline-none"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <section className="flex-1 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <SortingControls
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onOrderChange={handleOrderChange}
                theme={theme}
              />

              <div className="flex gap-4">
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

          {loading ? (
            <PokemonGridSkeleton count={12} />
          ) : error ? (
            <div
              className={`rounded-2xl border p-8 text-center ${
                theme === 'dark'
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : 'border-red-300 bg-red-50 text-red-700'
              }`}
            >
              <p className="text-2xl font-bold">Oops! Something went wrong.</p>
              <p className="mt-2">{error}</p>
              <button
                type="button"
                onClick={reload}
                className={`mt-6 rounded-full border px-6 py-2 text-sm font-semibold transition ${
                  theme === 'dark'
                    ? 'border-red-200/60 bg-red-500/20 text-red-100 hover:bg-red-500/30'
                    : 'border-red-300 bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Retry
              </button>
            </div>
          ) : (
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
                    Try adjusting your search criteria or clear all filters to see every Pokemon.
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
        </section>

        <div className="w-full lg:w-72 xl:w-80">
          <TeamBuilder
            team={teamPokemon}
            onRemove={handleRemoveFromTeam}
            onClear={handleClearTeam}
            onSelect={handleSelectPokemon}
            teamCapacity={TEAM_CAPACITY}
            theme={theme}
            onUpdateTeamMember={handleUpdateTeamMember}
            onLoadTeam={handleLoadTeam}
            onRandomize={handleRandomizeTeam}
            hasFilteredPokemon={filteredPokemon.length > 0}
            isCyberpunk={isCyberpunk}
            onAddPokemon={handleFocusSearch}
            onAddToTeam={handleAddToTeam}
            undo={undo}
            redo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onReorderTeam={handleReorderTeam}
          />
        </div>
      </div>
    </main>
  );
}
