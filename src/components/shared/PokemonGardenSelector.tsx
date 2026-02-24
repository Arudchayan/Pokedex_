import React, { useState, useMemo } from 'react';
import { resolveEntryForSpecies, spriteUrlFor } from '../../pets/walkersPack';
import Input from '../base/Input';

interface PokemonGardenSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder?: string;
}

const PokemonGardenSelector: React.FC<PokemonGardenSelectorProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Search Pokemon...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    return options.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  const toggleSelection = (pokemon: string) => {
    if (value.includes(pokemon)) {
      onChange(value.filter((v) => v !== pokemon));
    } else {
      onChange([...value, pokemon]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange([...filteredOptions]);
  };

  // Base URL for sprites (using the same as walkers)
  const baseUrl = 'https://raw.githubusercontent.com/Arudchayan/vscode-pokemon/main';

  return (
    <div className="grid gap-4">
      {/* Search Input */}
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        clearable
        onClear={() => setSearchTerm('')}
        prefix={
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
      />

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectAll}
          disabled={filteredOptions.length === 0}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Select All {filteredOptions.length > 0 && `(${filteredOptions.length})`}
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={value.length === 0}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Clear All {value.length > 0 && `(${value.length})`}
        </button>
      </div>

      {/* Pokemon Garden Grid */}
      <div
        className="rounded-lg border border-white/10 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm p-4 overflow-y-auto"
        style={{ maxHeight: '500px' }}
      >
        {filteredOptions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="font-medium">No Pokemon found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {filteredOptions.map((pokemon) => {
              const isSelected = value.includes(pokemon);
              const entry = resolveEntryForSpecies(pokemon);
              const spriteUrl = entry ? spriteUrlFor(baseUrl, entry, 'walk') : '';

              return (
                <button
                  key={pokemon}
                  type="button"
                  onClick={() => toggleSelection(pokemon)}
                  className={`group relative aspect-square rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30 scale-105'
                      : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5 hover:scale-105'
                  }`}
                  title={pokemon}
                >
                  {/* Pokemon Sprite */}
                  <div className="w-full h-full flex items-center justify-center p-2">
                    {entry ? (
                      <img
                        src={spriteUrl}
                        alt={pokemon}
                        className="w-full h-full object-contain pixelated"
                        loading="lazy"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                    )}
                  </div>

                  {/* Selection Checkmark */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Pokemon Name Tooltip on Hover */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2">
                    <p className="text-xs font-bold text-white capitalize text-center truncate">
                      {pokemon}
                    </p>
                  </div>

                  {/* Glow effect on selected */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-400/10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-slate-400 flex items-center justify-between">
        <span>
          {value.length === 0
            ? 'Click Pokemon to select them for your garden'
            : `${value.length} Pokemon selected`}
        </span>
        {filteredOptions.length > 0 && searchTerm && (
          <span className="text-slate-500">
            Showing {filteredOptions.length} of {options.length}
          </span>
        )}
      </p>
    </div>
  );
};

export default PokemonGardenSelector;
