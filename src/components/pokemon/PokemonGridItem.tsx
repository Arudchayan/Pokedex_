import React, { memo } from 'react';
import { PokemonListItem } from '../../types';
import PokemonCard from './PokemonCard';

interface PokemonGridItemProps {
  pokemon: PokemonListItem;
  onSelect: (id: number) => void;
  onAddToTeam: (pokemon: PokemonListItem) => void;
  onRemoveFromTeam: (id: number) => void;
  isInTeam: boolean;
  teamIsFull: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onAddToComparison: (pokemon: PokemonListItem) => void;
  isInComparison: boolean;
  canAddToComparison: boolean;
  theme: string;
  isShiny: boolean;
  isCyberpunk?: boolean;
}

const PokemonGridItem: React.FC<PokemonGridItemProps> = ({
  pokemon,
  onSelect,
  onAddToTeam,
  onRemoveFromTeam,
  isInTeam,
  teamIsFull,
  isFavorite,
  onToggleFavorite,
  onAddToComparison,
  isInComparison,
  canAddToComparison,
  theme,
  isShiny,
  isCyberpunk = false,
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-pokedex-pokemon', JSON.stringify(pokemon));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className="relative group cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
    >
      <PokemonCard
        pokemon={pokemon}
        onSelect={onSelect}
        onAddToTeam={onAddToTeam}
        onRemoveFromTeam={onRemoveFromTeam}
        isInTeam={isInTeam}
        teamIsFull={teamIsFull}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        theme={theme}
        isShiny={isShiny}
        isCyberpunk={isCyberpunk}
      />
      {canAddToComparison && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToComparison(pokemon);
          }}
          disabled={isInComparison}
          className={`absolute bottom-2 right-2 p-2 rounded-lg transition-all z-10 ${
            isInComparison
              ? 'bg-green-500 text-white opacity-100 cursor-default'
              : 'bg-black/50 hover:bg-primary-500 text-white opacity-0 group-hover:opacity-100 focus:opacity-100'
          }`}
          title={isInComparison ? 'In Comparison' : 'Compare'}
          aria-label={
            isInComparison
              ? `${pokemon.name} is in comparison`
              : `Add ${pokemon.name} to comparison`
          }
        >
          {isInComparison ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default memo(PokemonGridItem);
