import React, { useState, useEffect, useRef } from 'react';
import Badge from '../base/Badge';
import Input from '../base/Input';

interface PokemonMultiSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    options: string[];
    placeholder?: string;
    maxHeight?: string;
    maxSelections?: number;
}

const PokemonMultiSelect: React.FC<PokemonMultiSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Search Pokemon...',
    maxHeight = '320px',
    maxSelections = 100,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on search term
    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSelection = (option: string) => {
        if (value.includes(option)) {
            onChange(value.filter((v) => v !== option));
        } else {
            // Only allow adding if we haven't reached the max limit
            if (value.length < maxSelections) {
                onChange([...value, option]);
            }
        }
    };

    const removeSelection = (option: string) => {
        onChange(value.filter((v) => v !== option));
    };

    const clearAll = () => {
        onChange([]);
    };

    const selectAll = () => {
        // Only select up to maxSelections
        onChange([...filteredOptions.slice(0, maxSelections)]);
    };

    return (
        <div ref={containerRef} className="grid gap-3">
            {/* Search Input */}
            <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsOpen(true)}
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

            {/* Selected Pokemon Badges */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-white/10 bg-black/20">
                    {value.map((pokemon) => (
                        <Badge
                            key={pokemon}
                            variant="soft"
                            size="md"
                            removable
                            onRemove={() => removeSelection(pokemon)}
                            className="capitalize"
                        >
                            {pokemon}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={selectAll}
                    disabled={filteredOptions.length === 0 || value.length >= maxSelections}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    Select All {filteredOptions.length > 0 && `(${Math.min(filteredOptions.length, maxSelections - value.length)})`}
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

            {/* Dropdown List */}
            {isOpen && (
                <div
                    className="rounded-lg border border-white/10 bg-slate-800/95 backdrop-blur-sm overflow-hidden shadow-xl"
                    style={{ maxHeight }}
                >
                    <div className="overflow-y-auto" style={{ maxHeight }}>
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-400">
                                No Pokemon found
                            </div>
                        ) : (
                            <div className="grid gap-0.5 p-1">
                                {filteredOptions.map((option) => {
                                    const isSelected = value.includes(option);
                                    const isMaxReached = value.length >= maxSelections && !isSelected;
                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => toggleSelection(option)}
                                            disabled={isMaxReached}
                                            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-left transition ${isSelected
                                                ? 'bg-primary-500/20 text-primary-200 border border-primary-400/30'
                                                : isMaxReached
                                                    ? 'text-slate-500 cursor-not-allowed opacity-50'
                                                    : 'text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="capitalize font-medium">{option}</span>
                                            {isSelected && (
                                                <svg
                                                    className="w-5 h-5 text-primary-400 flex-shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Helper Text */}
            <p className={`text-xs ${value.length >= maxSelections ? 'text-amber-400' : 'text-slate-400'}`}>
                {value.length === 0
                    ? `Search and click to select Pokemon (max ${maxSelections})`
                    : value.length >= maxSelections
                        ? `Maximum limit reached: ${value.length}/${maxSelections} Pokemon selected`
                        : `${value.length}/${maxSelections} Pokemon selected`}
            </p>
        </div>
    );
};

export default PokemonMultiSelect;
