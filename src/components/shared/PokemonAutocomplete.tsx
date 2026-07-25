import React, { useMemo, useState } from 'react';
import { PokemonListItem } from '../../types';
import TypeBadge from '../charts/TypeBadge';

export interface PokemonAutocompleteProps {
  pokemonList: PokemonListItem[];
  theme: string;
  onSelect: (pokemon: PokemonListItem) => void;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  inputId?: string;
  limit?: number;
}

/**
 * Search input + dropdown for picking a Pokémon from a master list.
 * Used by Catch/Stat calculators (identical previous copy-paste UI).
 */
const PokemonAutocomplete: React.FC<PokemonAutocompleteProps> = ({
  pokemonList,
  theme,
  onSelect,
  label = 'Select Pokemon',
  placeholder = 'Search Pokemon...',
  autoFocus = false,
  inputId = 'pokemon-search',
  limit = 5,
}) => {
  const [search, setSearch] = useState('');

  const filteredList = useMemo(() => {
    if (!search) return [];
    const searchLower = search.toLowerCase();
    return pokemonList
      .filter((p) => (p.nameLower || p.name.toLowerCase()).includes(searchLower))
      .slice(0, limit);
  }, [search, pokemonList, limit]);

  return (
    <div className="relative z-20 max-w-md mx-auto mt-10">
      <label
        htmlFor={inputId}
        className="block text-sm font-bold mb-2 uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        placeholder={placeholder}
        className={`w-full p-4 text-lg rounded-xl bg-transparent border focus:outline-none focus:border-primary-500 ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus={autoFocus}
      />
      {filteredList.length > 0 && (
        <div
          className={`absolute top-full left-0 w-full z-10 rounded-b-xl shadow-xl max-h-60 overflow-y-auto mt-1 border ${theme === 'dark' ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}
        >
          {filteredList.map((p) => (
            <div
              key={p.id}
              className="p-3 hover:bg-primary-500/20 cursor-pointer flex items-center gap-3 transition-colors"
              onClick={() => {
                onSelect(p);
                setSearch('');
              }}
            >
              <img src={p.imageUrl} className="w-10 h-10" alt="" />
              <span className="font-bold">{p.name}</span>
              <div className="flex gap-1 ml-auto">
                {p.types.map((t) => (
                  <TypeBadge key={t} type={t} size="sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PokemonAutocomplete;
