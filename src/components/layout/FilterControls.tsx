import React, { useMemo, useState } from 'react';
import { GENERATIONS, TYPE_COLORS } from '../../constants';
import { usePokemon } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';

interface FilterControlsProps {
  selectedGeneration: string;
  onGenerationChange: (generation: string) => void;
  selectedTypes: string[];
  onTypeToggle: (type: string) => void;
  flavorTextSearch: string;
  onFlavorTextChange: (value: string) => void;
  onClearFilters?: () => void;
  className?: string;
}

type SectionId = 'generation' | 'types' | 'flavor' | 'advanced';

const SectionToggle: React.FC<{
  label: string;
  isOpen: boolean;
  description?: string;
  onToggle: () => void;
  theme: 'dark' | 'light';
  controlsId: string;
}> = ({ label, isOpen, description, onToggle, theme, controlsId }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex w-full items-center justify-between py-3 text-left text-sm font-semibold transition ${theme === 'dark' ? 'text-white hover:text-primary-300' : 'text-slate-800 hover:text-primary-600'}`}
    aria-expanded={isOpen}
    aria-controls={controlsId}
  >
    <span>{label}</span>
    <span
      className={`flex items-center gap-2 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
    >
      {description}
      <svg
        className={`h-3 w-3 transform transition ${isOpen ? 'rotate-180' : ''}`}
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  </button>
);

const FilterControls: React.FC<FilterControlsProps> = ({
  selectedGeneration,
  onGenerationChange,
  selectedTypes,
  onTypeToggle,
  flavorTextSearch,
  onFlavorTextChange,
  onClearFilters,
  className,
}) => {
  const { minStats, selectedAbility, isMonoType, minBST, theme } = usePokemon();
  const [expandedSections, setExpandedSections] = useState<Record<SectionId, boolean>>({
    generation: true,
    types: true,
    flavor: false,
    advanced: false,
  });

  const toggleSection = (section: SectionId) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleStatChange = (stat: string, value: string) => {
    // Input length safety check
    if (value.length > 5) return;

    const numValue = parseInt(value, 10);
    usePokemonStore.getState().setMinStat(stat, isNaN(numValue) ? 0 : numValue);
  };

  const handleFlavorTextChange = (value: string) => {
    if (value.length <= MAX_INPUT_LENGTH) {
      onFlavorTextChange(value);
    }
  };

  const handleAbilityChange = (value: string) => {
    if (value.length <= MAX_INPUT_LENGTH) {
      usePokemonStore.getState().setAbility(value);
    }
  };

  const activeChips = useMemo(() => {
    const chips: { label: string; value: string; onRemove: () => void }[] = [];
    if (selectedGeneration !== 'all') {
      chips.push({
        label: 'Generation',
        value: selectedGeneration,
        onRemove: () => onGenerationChange('all'),
      });
    }
    selectedTypes.forEach((type) => {
      chips.push({
        label: 'Type',
        value: type,
        onRemove: () => onTypeToggle(type),
      });
    });
    if (flavorTextSearch.trim()) {
      chips.push({
        label: 'Flavor',
        value: flavorTextSearch.trim(),
        onRemove: () => onFlavorTextChange(''),
      });
    }
    Object.entries(minStats).forEach(([stat, value]) => {
      chips.push({
        label: 'Stat',
        value: `${stat.replace('-', ' ')} ≥ ${value}`,
        onRemove: () => usePokemonStore.getState().setMinStat(stat, 0),
      });
    });
    if (selectedAbility) {
      chips.push({
        label: 'Ability',
        value: selectedAbility,
        onRemove: () => usePokemonStore.getState().setAbility(''),
      });
    }
    if (isMonoType) {
      chips.push({
        label: 'Type',
        value: 'Mono-type',
        onRemove: () => usePokemonStore.getState().toggleMonoType(),
      });
    }
    if (minBST > 0) {
      chips.push({
        label: 'BST',
        value: `>= ${minBST}`,
        onRemove: () => usePokemonStore.getState().setMinBST(0),
      });
    }
    return chips;
  }, [
    flavorTextSearch,
    selectedGeneration,
    selectedTypes,
    minStats,
    selectedAbility,
    isMonoType,
    minBST,
    onGenerationChange,
    onTypeToggle,
    onFlavorTextChange,
  ]);

  const hasActiveFilters = activeChips.length > 0;
  const allTypes = useMemo(() => Object.keys(TYPE_COLORS), []);

  const containerClass =
    className ??
    `rounded-2xl border p-6 shadow-2xl backdrop-blur-lg ${
      theme === 'dark'
        ? 'border-white/10 bg-slate-950/80 shadow-black/40'
        : 'border-slate-200 bg-white/80 shadow-slate-200/50'
    }`;

  return (
    <section className={containerClass} aria-label="Filters">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
          >
            Refine
          </p>
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Filters
          </h2>
        </div>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${
              theme === 'dark'
                ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 focus:ring-white/30'
                : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 focus:ring-slate-300'
            }`}
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 3l6 6M9 3L3 9" />
            </svg>
            Clear
          </button>
        )}
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {activeChips.length === 0 ? (
          <span
            className={`text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
          >
            No filters applied
          </span>
        ) : (
          activeChips.map((chip) => (
            <div
              key={`${chip.label}-${chip.value}`}
              className={`inline-flex items-center gap-2 rounded-full border pl-3 pr-1 py-1 text-xs font-semibold animate-[chipIn_0.2s_ease-out] ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/10 text-slate-100'
                  : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              <span
                className={`text-[10px] uppercase tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
              >
                {chip.label}
              </span>
              <span>{chip.value}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                title={`Remove ${chip.label} filter`}
                className={`ml-1 rounded-full p-0.5 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500`}
                aria-label={`Remove ${chip.label} filter: ${chip.value}`}
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 3l6 6M9 3L3 9" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <div
        className={`flex flex-col divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-slate-200'}`}
      >
        <article>
          <SectionToggle
            label="Generation"
            isOpen={expandedSections.generation}
            description={selectedGeneration === 'all' ? 'All' : selectedGeneration}
            onToggle={() => toggleSection('generation')}
            theme={theme}
            controlsId="filter-section-generation"
          />
          {expandedSections.generation && (
            <div className="pb-4" id="filter-section-generation">
              <label htmlFor="generation-select" className="sr-only">
                Select generation
              </label>
              <select
                id="generation-select"
                value={selectedGeneration}
                onChange={(event) => onGenerationChange(event.target.value)}
                className={`w-full rounded-md border py-2 px-3 text-sm shadow-inner transition focus:outline-none focus:ring-2 focus:ring-primary-500/60 ${
                  theme === 'dark'
                    ? 'border-white/10 bg-slate-900 text-white shadow-black/20'
                    : 'border-slate-300 bg-white text-slate-900 shadow-slate-200/50'
                }`}
              >
                <option value="all">All generations</option>
                {Object.keys(GENERATIONS).map((generation) => (
                  <option key={generation} value={generation}>
                    {generation}
                  </option>
                ))}
              </select>
            </div>
          )}
        </article>

        <article>
          <SectionToggle
            label="Types"
            isOpen={expandedSections.types}
            description={selectedTypes.length > 0 ? `${selectedTypes.length} selected` : 'All'}
            onToggle={() => toggleSection('types')}
            theme={theme}
            controlsId="filter-section-types"
          />
          {expandedSections.types && (
            <div className="pb-4" id="filter-section-types">
              <div className="flex flex-wrap gap-2 mb-4">
                {allTypes.map((type) => {
                  const isSelected = selectedTypes.includes(type);
                  const baseClass = TYPE_COLORS[type] || 'bg-slate-500 text-white';
                  const stateClass = isSelected
                    ? `shadow-lg ring-2 ${theme === 'dark' ? 'shadow-black/40 ring-white/60' : 'shadow-slate-400/50 ring-slate-800/60'}`
                    : 'opacity-70 hover:opacity-100 hover:scale-105';
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onTypeToggle(type)}
                      className={`min-h-[40px] sm:min-h-[44px] w-[72px] sm:w-[90px] rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold capitalize transition flex items-center justify-center ${baseClass} ${stateClass}`}
                      aria-pressed={isSelected}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mono-type-toggle"
                  checked={isMonoType}
                  onChange={() => usePokemonStore.getState().toggleMonoType()}
                  className="rounded border-slate-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300/40 focus:ring-opacity-50"
                />
                <label
                  htmlFor="mono-type-toggle"
                  className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  Mono-type only (Single Type)
                </label>
              </div>
            </div>
          )}
        </article>

        <article>
          <SectionToggle
            label="Flavor text"
            isOpen={expandedSections.flavor}
            description={flavorTextSearch.trim().length > 0 ? 'Active' : 'Optional'}
            onToggle={() => toggleSection('flavor')}
            theme={theme}
            controlsId="filter-section-flavor"
          />
          {expandedSections.flavor && (
            <div className="pb-4" id="filter-section-flavor">
              <label htmlFor="flavor-text-search" className="sr-only">
                Filter by flavor text
              </label>
              <input
                id="flavor-text-search"
                type="text"
                value={flavorTextSearch}
                onChange={(event) => handleFlavorTextChange(event.target.value)}
                maxLength={MAX_INPUT_LENGTH}
                placeholder="e.g. volcano, gentle giant..."
                className={`w-full rounded-md border py-2 px-3 text-sm placeholder-slate-400 shadow-inner transition focus:outline-none focus:ring-2 focus:ring-primary-500/60 ${
                  theme === 'dark'
                    ? 'border-white/10 bg-slate-900 text-white shadow-black/20'
                    : 'border-slate-300 bg-white text-slate-900 shadow-slate-200/50'
                }`}
              />
            </div>
          )}
        </article>

        <article>
          <SectionToggle
            label="Advanced (Stats & Abilities)"
            isOpen={expandedSections.advanced}
            description={
              Object.keys(minStats).length > 0 || selectedAbility || minBST > 0
                ? 'Active'
                : 'Optional'
            }
            onToggle={() => toggleSection('advanced')}
            theme={theme}
            controlsId="filter-section-advanced"
          />
          {expandedSections.advanced && (
            <div className="pb-4 space-y-4" id="filter-section-advanced">
              {/* Ability Search */}
              <div>
                <label
                  htmlFor="ability-search"
                  className={`text-xs font-semibold capitalize mb-1 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
                >
                  Ability
                </label>
                <input
                  id="ability-search"
                  type="text"
                  value={selectedAbility}
                  onChange={(e) => handleAbilityChange(e.target.value)}
                  maxLength={MAX_INPUT_LENGTH}
                  placeholder="Search by Ability..."
                  className={`w-full rounded-md border py-2 px-3 text-sm placeholder-slate-400 shadow-inner transition focus:outline-none focus:ring-2 focus:ring-primary-500/60 ${
                    theme === 'dark'
                      ? 'border-white/10 bg-slate-900 text-white shadow-black/20'
                      : 'border-slate-300 bg-white text-slate-900 shadow-slate-200/50'
                  }`}
                />
              </div>

              {/* BST Filter */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bst-toggle"
                  checked={minBST >= 500}
                  onChange={(e) => usePokemonStore.getState().setMinBST(e.target.checked ? 500 : 0)}
                  className="rounded border-slate-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300/40 focus:ring-opacity-50"
                />
                <label
                  htmlFor="bst-toggle"
                  className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  High Stats Only (BST ≥ 500)
                </label>
              </div>

              {/* Stats */}
              <div>
                <label
                  className={`text-xs font-semibold capitalize mb-2 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
                >
                  Minimum Stats
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map(
                    (stat) => (
                      <div key={stat} className="flex flex-col gap-1">
                        <label
                          htmlFor={`min-stat-${stat}`}
                          className={`text-[10px] uppercase tracking-wide ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}
                        >
                          {stat.replace('-', ' ')}
                        </label>
                        <input
                          id={`min-stat-${stat}`}
                          type="number"
                          min="0"
                          max="255"
                          value={minStats[stat] || ''}
                          onChange={(e) => handleStatChange(stat, e.target.value)}
                          placeholder="0"
                          className={`w-full rounded-md border py-1 px-2 text-xs transition focus:outline-none focus:ring-1 focus:ring-primary-500/60 ${
                            theme === 'dark'
                              ? 'border-white/10 bg-slate-900 text-white'
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  );
};

export default FilterControls;
