import React, { memo, useState, useEffect, useRef } from 'react';
import { PokemonListItem } from '../../types';
import TypeBadge from '../charts/TypeBadge';
import { TYPE_COLORS_HEX } from '../../constants';
import { playPokemonCry } from '../../services/soundService';

interface PokemonListRowProps {
  pokemon: PokemonListItem;
  onSelect: (id: number) => void;
  onAddToTeam?: (pokemon: PokemonListItem) => void;
  onRemoveFromTeam?: (id: number) => void;
  isInTeam?: boolean;
  teamIsFull?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  onAddToComparison?: (pokemon: PokemonListItem) => void;
  isInComparison?: boolean;
  comparisonIsFull?: boolean;
  theme: string;
}

const PokemonListRow: React.FC<PokemonListRowProps> = ({
  pokemon,
  onSelect,
  onAddToTeam,
  onRemoveFromTeam,
  isInTeam = false,
  teamIsFull = false,
  isFavorite = false,
  onToggleFavorite,
  onAddToComparison,
  isInComparison,
  comparisonIsFull,
  theme
}) => {
  const [imgError, setImgError] = useState(false);
  const cryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setImgError(false);
  }, [pokemon.id]);

  useEffect(() => {
    return () => {
        if (cryTimeoutRef.current) {
            clearTimeout(cryTimeoutRef.current);
        }
    };
  }, []);

  const handleAddToTeam = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onAddToTeam && !isInTeam && !teamIsFull) {
      onAddToTeam(pokemon);
    }
  };

  const handleRemoveFromTeam = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onRemoveFromTeam && isInTeam) {
      onRemoveFromTeam(pokemon.id);
    }
  };

  const handleToggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(pokemon.id);
    }
  };

    const handleAddToComparison = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (onAddToComparison && !isInComparison && !comparisonIsFull) {
            onAddToComparison(pokemon);
        }
    };

  const handleMouseEnter = () => {
      // Clear existing timeout
      if (cryTimeoutRef.current) {
          clearTimeout(cryTimeoutRef.current);
      }
      // Debounce cry playback
      cryTimeoutRef.current = setTimeout(() => {
          playPokemonCry(pokemon.id);
      }, 200);
  }

  const handleMouseLeave = () => {
      // Cancel pending cry if mouse leaves early
      if (cryTimeoutRef.current) {
          clearTimeout(cryTimeoutRef.current);
          cryTimeoutRef.current = null;
      }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-pokedex-pokemon', JSON.stringify(pokemon));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(pokemon.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View details for ${pokemon.name}`}
      draggable
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      onClick={() => onSelect(pokemon.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex items-center gap-4 rounded-lg border p-2 transition-all hover:scale-[1.01] cursor-grab active:cursor-grabbing ${
        theme === 'dark'
          ? 'border-white/10 bg-white/5 hover:bg-white/10'
          : 'border-slate-200 bg-white hover:shadow-md'
      } ${isInTeam ? 'ring-1 ring-primary-500 border-primary-500/50' : ''}`}
    >
       {/* Favorite Button (Top Left absolute or inline?) - Inline for Row is better or absolute left */}
       <div className="relative flex-shrink-0">
            <img
                src={(() => {
                  const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
                  if (imgError) return fallback;
                  return pokemon.imageUrl || fallback;
                })()}
                onError={() => setImgError(true)}
                alt={pokemon.name}
                className="h-16 w-16 object-contain pixelated"
                loading="lazy"
            />
       </div>

       <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
            {/* ID & Name */}
            <div className="col-span-4 sm:col-span-3">
                <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    #{String(pokemon.id).padStart(4, '0')}
                </p>
                <h3 className={`font-bold capitalize truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    {pokemon.name}
                </h3>
            </div>

            {/* Types */}
            <div className="col-span-4 sm:col-span-3 flex gap-1 flex-wrap">
                {pokemon.types.map((type) => (
                    <TypeBadge key={type} type={type} />
                ))}
            </div>

            {/* Base Stats Preview (Optional - maybe just Total) */}
            <div className="hidden sm:col-span-3 sm:flex gap-2 items-center">
                 {/* Simple Stat Bar for HP or Speed maybe? Let's do HP/Atk/Spd mini */}
                 <div className="flex flex-col gap-1 w-full">
                    {pokemon.stats?.slice(0, 3).map(stat => (
                        <div key={stat.name} className="flex items-center gap-2 text-[10px]">
                            <span className={`w-8 uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stat.name === 'special-attack' ? 'SpA' : stat.name === 'special-defense' ? 'SpD' : stat.name.substring(0,3)}</span>
                            <div className={`h-1 flex-1 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}>
                                <div
                                    className="h-full rounded-full bg-slate-400"
                                    style={{ width: `${Math.min(stat.value, 100)}%`}}
                                />
                            </div>
                        </div>
                    ))}
                 </div>
            </div>

            {/* Actions */}
            <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2">
                 {onToggleFavorite && (
                    <button
                        type="button"
                        onClick={handleToggleFavorite}
                        className={`p-2 rounded-full transition-colors ${
                             isFavorite
                                ? 'text-yellow-400'
                                : theme === 'dark' ? 'text-slate-600 hover:text-yellow-400' : 'text-slate-300 hover:text-yellow-500'
                        }`}
                        title="Toggle Favorite"
                        aria-label={isFavorite ? `Remove ${pokemon.name} from favorites` : `Add ${pokemon.name} to favorites`}
                    >
                         <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                           {isFavorite ? (
                             <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                           ) : (
                             <path stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                           )}
                         </svg>
                    </button>
                )}

                {onAddToComparison && !isInComparison && !comparisonIsFull && (
                    <button
                        type="button"
                        onClick={handleAddToComparison}
                        className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark'
                             ? 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20'
                             : 'bg-primary-300/10 text-primary-600 hover:bg-primary-300/20'
                        }`}
                        title="Compare"
                        aria-label={`Add ${pokemon.name} to comparison`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </button>
                )}

                {(onAddToTeam || onRemoveFromTeam) && (
                    <button
                        type="button"
                        onClick={isInTeam ? handleRemoveFromTeam : handleAddToTeam}
                        disabled={!isInTeam && teamIsFull}
                        className={`rounded-md border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                            isInTeam
                                ? 'border-red-500/50 text-red-500 hover:bg-red-500/10'
                                : theme === 'dark'
                                    ? 'border-primary-500/50 text-primary-400 hover:bg-primary-500/10'
                                    : 'border-primary-600 text-primary-600 hover:bg-primary-300/10'
                        } ${(!isInTeam && teamIsFull) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isInTeam ? 'Remove' : 'Add'}
                    </button>
                )}
            </div>
       </div>
    </div>
  );
};

export default memo(PokemonListRow);
