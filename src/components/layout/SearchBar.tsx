import React, { useState, useEffect } from 'react';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isCyberpunk?: boolean;
  theme?: 'dark' | 'light';
  id?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search for a Pokemon...',
  className,
  isCyberpunk = false,
  theme = 'dark',
  id,
  inputRef: externalRef,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const internalRef = React.useRef<HTMLInputElement>(null);
  const inputRef = externalRef || internalRef;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isInputActive = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      );

      if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync local state if prop changes externally (e.g. clear filters)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, onChange, value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= MAX_INPUT_LENGTH) {
          setLocalValue(newValue);
      }
  };

  const containerClass = className ? `relative ${className}` : 'relative w-full max-w-lg mx-auto';

  return (
    <div className={containerClass}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          className={`h-5 w-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        id={id}
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={handleChange}
        maxLength={MAX_INPUT_LENGTH}
        placeholder={isCyberpunk ? `${placeholder} [/]` : `${placeholder} (Press /)`}
        aria-label={placeholder}
        className={`block w-full rounded-md border py-2 pl-10 pr-10 transition focus:outline-none focus:ring-2 ${
          isCyberpunk
            ? 'cyber-input focus:ring-primary-500/50'
            : theme === 'dark'
              ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:ring-primary-500 focus:border-primary-500'
              : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-primary-500 focus:border-primary-500'
        }`}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear search"
          className={`absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1 ${
            theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Clear search"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
