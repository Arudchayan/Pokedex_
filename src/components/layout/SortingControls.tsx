import React, { memo } from 'react';
import type { SortOption } from '../../types/sorting';

export type { SortOption } from '../../types/sorting';

interface SortingControlsProps {
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: SortOption) => void;
  onOrderChange: (order: 'asc' | 'desc') => void;
  theme: 'dark' | 'light';
  selectedPokedex?: string;
  onPokedexChange?: (pokedex: string) => void;
}

const SortingControls: React.FC<SortingControlsProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
  onOrderChange,
  theme,
  selectedPokedex = 'national',
  onPokedexChange,
}) => {
  const sortOptions: { value: SortOption; label: string; icon: string }[] = [
    { value: 'id', label: 'Pokedex #', icon: '#' },
    { value: 'name', label: 'Name', icon: 'A-Z' },
    { value: 'type', label: 'Type', icon: '◆' },
    { value: 'favorite', label: 'Favorites', icon: '★' },
  ];

  const statOptions: { value: SortOption; label: string }[] = [
    { value: 'bst', label: 'Base Stat Total' },
    { value: 'hp', label: 'HP' },
    { value: 'attack', label: 'Attack' },
    { value: 'defense', label: 'Defense' },
    { value: 'special-attack', label: 'Sp. Atk' },
    { value: 'special-defense', label: 'Sp. Def' },
    { value: 'speed', label: 'Speed' },
  ];

  const isStatSelected = statOptions.some((opt) => opt.value === sortBy);

  const dexOptions: { value: string; label: string }[] = [
    { value: 'national', label: 'National Dex' },
    { value: 'kanto', label: 'Kanto' },
    { value: 'original-johto', label: 'Johto' },
    { value: 'hoenn', label: 'Hoenn' },
    { value: 'original-sinnoh', label: 'Sinnoh' },
    { value: 'original-unova', label: 'Unova' },
    { value: 'kalos-central', label: 'Kalos' },
    { value: 'original-alola', label: 'Alola' },
    { value: 'galar', label: 'Galar' },
    { value: 'hisui', label: 'Hisui' },
    { value: 'paldea', label: 'Paldea' },
  ];

  const currentDexValue = sortBy === 'regional-dex' ? selectedPokedex : 'national';

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2" role="group" aria-labelledby="sort-label">
        <label
          id="sort-label"
          className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
        >
          Sort by:
        </label>
        <div className="flex gap-2 flex-wrap">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSortChange(option.value)}
              aria-pressed={sortBy === option.value}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                sortBy === option.value
                  ? 'bg-primary-500/30 text-primary-300 border border-primary-400/60 shadow-lg'
                  : theme === 'dark'
                    ? 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-700'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}

          <div className="relative">
            <select
              value={isStatSelected ? sortBy : ''}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort by Stat"
              className={`appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer ${
                isStatSelected
                  ? 'bg-primary-500/30 text-primary-300 border border-primary-400/60 shadow-lg'
                  : theme === 'dark'
                    ? 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-700'
              }`}
            >
              <option value="" disabled className={theme === 'dark' ? 'bg-slate-800' : 'bg-white'}>
                Stats...
              </option>
              {statOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className={
                    theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700'
                  }
                >
                  {option.label}
                </option>
              ))}
            </select>
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isStatSelected ? 'text-primary-300' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2" aria-label="Dex order">
          <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Dex:
          </span>
          <select
            value={currentDexValue}
            onChange={(e) => {
              const value = e.target.value;
              if (onPokedexChange) {
                onPokedexChange(value);
              }
              if (value === 'national') {
                onSortChange('id');
              } else {
                onSortChange('regional-dex');
              }
            }}
            className={`pl-3 pr-8 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer ${
              sortBy === 'regional-dex'
                ? 'bg-primary-500/30 text-primary-300 border border-primary-400/60 shadow-lg'
                : theme === 'dark'
                  ? 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-700'
            }`}
          >
            {dexOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className={theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700'}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
        type="button"
        onClick={() => onOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          theme === 'dark'
            ? 'bg-white/5 border border-white/10 hover:bg-white/10'
            : 'bg-slate-100 border border-slate-200 hover:bg-slate-200'
        }`}
        title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
        aria-label={`Switch to ${sortOrder === 'asc' ? 'descending' : 'ascending'} sort`}
      >
        {sortOrder === 'asc' ? (
          <svg
            className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 11l5-5m0 0l5 5m-5-5v12"
            />
          </svg>
        ) : (
          <svg
            className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 13l-5 5m0 0l-5-5m5 5V6"
            />
          </svg>
        )}
        </button>
      </div>
    </div>
  );
};

export default memo(SortingControls);
