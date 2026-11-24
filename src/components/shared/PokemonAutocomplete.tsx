import React, { useId, useMemo, useState } from 'react';
import { PokemonListItem } from '../../types';
import TypeBadge from '../charts/TypeBadge';
import { formFieldClasses, type FormFieldTheme } from './formFieldClasses';

export interface PokemonAutocompleteProps {
  pokemonList: PokemonListItem[];
  theme: FormFieldTheme;
  onSelect: (pokemon: PokemonListItem) => void;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  inputId?: string;
  limit?: number;
  /** Disables the field while the shared species list is unavailable. */
  disabled?: boolean;
  /** Hides the visible label but keeps it available to assistive technology. */
  hideLabel?: boolean;
  /** Extra classes for the wrapper (calculators align this differently). */
  containerClassName?: string;
}

/**
 * Search input + listbox for picking a Pokémon from a master list.
 * Used by all four calculators; reports empty matches inline instead of
 * silently rendering nothing.
 */
const PokemonAutocomplete: React.FC<PokemonAutocompleteProps> = ({
  pokemonList,
  theme,
  onSelect,
  label = 'Select Pokemon',
  placeholder = 'Search Pokemon...',
  autoFocus = false,
  inputId,
  limit = 5,
  disabled = false,
  hideLabel = false,
  containerClassName = 'relative z-20 max-w-md mx-auto mt-10',
}) => {
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const listboxId = `${id}-listbox`;
  const statusId = `${id}-status`;

  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = search.trim();

  const filteredList = useMemo(() => {
    if (!query) return [];
    const searchLower = query.toLowerCase();
    return pokemonList
      .filter((p) => (p.nameLower || p.name.toLowerCase()).includes(searchLower))
      .slice(0, limit);
  }, [query, pokemonList, limit]);

  const showDropdown = !disabled && isOpen && filteredList.length > 0;
  const showNoMatches = !disabled && isOpen && query.length > 0 && filteredList.length === 0;

  const select = (pokemon: PokemonListItem) => {
    onSelect(pokemon);
    setSearch('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!filteredList.length) return;
      setIsOpen(true);
      setActiveIndex((index) => (index + 1) % filteredList.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!filteredList.length) return;
      setIsOpen(true);
      setActiveIndex((index) => (index <= 0 ? filteredList.length - 1 : index - 1));
    } else if (event.key === 'Enter') {
      if (showDropdown && activeIndex >= 0) {
        event.preventDefault();
        select(filteredList[activeIndex]);
      } else if (showNoMatches) {
        event.preventDefault();
      }
    } else if (event.key === 'Escape') {
      if (showDropdown || showNoMatches) {
        event.preventDefault();
        event.stopPropagation();
      }
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className={containerClassName}>
      <label
        htmlFor={id}
        className={
          hideLabel
            ? 'sr-only'
            : `block text-sm font-bold mb-2 uppercase tracking-wider ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`
        }
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          showDropdown && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        aria-describedby={showNoMatches ? statusId : undefined}
        aria-invalid={showNoMatches || undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-3 rounded border ${formFieldClasses(theme)}`}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (query) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
      />

      {showNoMatches && (
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className={`mt-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
        >
          No Pokémon match “{query}”. Try a different name.
        </p>
      )}

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`${label} results`}
          className={`absolute top-full left-0 w-full z-10 rounded-b-xl shadow-xl max-h-60 overflow-y-auto mt-1 border ${
            theme === 'dark'
              ? 'bg-slate-800 border-white/10 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {filteredList.map((p, index) => (
            <button
              key={p.id}
              id={`${id}-option-${index}`}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              tabIndex={-1}
              className={`w-full p-3 text-left flex items-center gap-3 transition-colors ${
                theme === 'dark'
                  ? `text-slate-100 hover:bg-slate-700 ${
                      activeIndex === index ? 'bg-slate-700 ring-1 ring-inset ring-slate-400' : ''
                    }`
                  : `text-slate-900 hover:bg-slate-100 ${
                      activeIndex === index ? 'bg-slate-100 ring-1 ring-inset ring-slate-500' : ''
                    }`
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => select(p)}
            >
              <img src={p.imageUrl} className="w-10 h-10" alt="" />
              <span className="font-bold">{p.name}</span>
              <span className="flex gap-1 ml-auto">
                {p.types.map((t) => (
                  <TypeBadge key={t} type={t} size="sm" />
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PokemonAutocomplete;
