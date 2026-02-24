import React, { useState, useRef, useEffect, memo } from 'react';
import { PokemonListItem } from '../../types';
import TypeBadge from '../charts/TypeBadge';
import { TYPE_COLORS_HEX } from '../../constants';
import { playPokemonCry, isAudioEnabled } from '../../services/soundService';
import { Skeleton } from '../base/Skeleton';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface PokemonCardProps {
  pokemon: PokemonListItem;
  onSelect: (id: number) => void;
  onAddToTeam?: (pokemon: PokemonListItem) => void;
  onRemoveFromTeam?: (id: number) => void;
  isInTeam?: boolean;
  teamIsFull?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  theme: string;
  isShiny: boolean;
  isCyberpunk?: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  onSelect,
  onAddToTeam,
  onRemoveFromTeam,
  isInTeam = false,
  teamIsFull = false,
  isFavorite = false,
  onToggleFavorite,
  theme,
  isShiny,
  isCyberpunk = false,
}) => {
  // Minimized state to reduce re-renders.
  // 'particles' state was removed in favor of CSS animations.
  // 'isHovered' is kept only for image source swapping and sound triggers.
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [tiltTransform, setTiltTransform] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const cryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const primaryType = pokemon.types[0];
  const typeColor = TYPE_COLORS_HEX[primaryType] || '#A8A878';

  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [pokemon.id]);

  useEffect(() => {
    return () => {
      if (cryTimeoutRef.current) {
        clearTimeout(cryTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 15;
    const rotateX = ((centerY - y) / centerY) * 15;

    setTiltTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
    );
  };

  const handleMouseEnter = () => {
    setIsHovered(true);

    // Debounce cry playback — only when audio is enabled
    if (isAudioEnabled()) {
      if (cryTimeoutRef.current) {
        clearTimeout(cryTimeoutRef.current);
      }
      cryTimeoutRef.current = setTimeout(() => {
        playPokemonCry(pokemon.id);
      }, 200);
    }

    if (!prefersReducedMotion) {
      setTiltTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.05)');
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);

    // Cancel pending cry if mouse leaves early
    if (cryTimeoutRef.current) {
      clearTimeout(cryTimeoutRef.current);
      cryTimeoutRef.current = null;
    }

    setTiltTransform('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(pokemon.id);
    }
  };

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

  const [heartAnimating, setHeartAnimating] = useState(false);

  const handleToggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onToggleFavorite) {
      // Trigger heart pop animation only when toggling ON
      if (!isFavorite) {
        setHeartAnimating(true);
      }
      onToggleFavorite(pokemon.id);
    }
  };

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${pokemon.name}`}
      onKeyDown={handleKeyDown}
      className={`group relative overflow-visible rounded-xl border cursor-pointer ${
        isCyberpunk
          ? 'cyber-card cyber-card-glow'
          : isInTeam
            ? 'border-primary-400/60 ring-2 ring-primary-400/60'
            : theme === 'dark'
              ? 'border-white/20'
              : 'border-slate-200'
      } ${isInTeam && isCyberpunk ? 'ring-2 ring-primary-400/60' : ''}`}
      style={
        {
          '--type-color': typeColor,
          transform: tiltTransform || undefined,
          transition: 'transform 0.1s ease-out',
        } as React.CSSProperties
      }
      onClick={() => onSelect(pokemon.id)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Favorite Button */}
      {onToggleFavorite && (
        <button
          onClick={handleToggleFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={
            isFavorite
              ? `Remove ${pokemon.name} from favorites`
              : `Add ${pokemon.name} to favorites`
          }
          className={`absolute top-3 right-3 z-10 p-1.5 rounded-full backdrop-blur-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            theme === 'dark'
              ? 'bg-black/40 hover:bg-black/60'
              : 'bg-white/60 hover:bg-white/80 shadow-sm'
          }`}
        >
          {isFavorite ? (
            <svg
              className={`w-5 h-5 text-yellow-400 fill-current ${heartAnimating && !prefersReducedMotion ? 'animate-[heartPop_0.4s_ease-out]' : ''}`}
              viewBox="0 0 24 24"
              onAnimationEnd={() => setHeartAnimating(false)}
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ) : (
            <svg
              className={`w-5 h-5 transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-yellow-400' : 'text-slate-400 hover:text-yellow-500'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
          )}
        </button>
      )}

      {/* Glow effect - Optimized to use CSS group-hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl pointer-events-none"
        style={{ backgroundColor: typeColor }}
      />

      {/* Card content */}
      <div
        className={`relative backdrop-blur-lg rounded-xl overflow-hidden ${
          isCyberpunk
            ? 'bg-transparent'
            : theme === 'dark'
              ? 'bg-black/20'
              : 'bg-white/80 shadow-sm'
        }`}
      >
        <div
          className={`p-4 flex justify-center items-center aspect-square relative bg-gradient-to-br ${
            isCyberpunk
              ? 'from-cyan-500/5 via-transparent to-pink-500/5'
              : theme === 'dark'
                ? 'from-white/5 to-transparent'
                : 'from-slate-100 to-transparent'
          }`}
        >
          {!imgLoaded && (
            <Skeleton
              width="100%"
              height="100%"
              rounded="lg"
              animation="wave"
              className="absolute inset-0"
            />
          )}
          <img
            src={(() => {
              const fallback =
                isShiny || isHovered
                  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`
                  : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;

              if (imgError) return fallback;

              const primary = isShiny || isHovered ? pokemon.shinyImageUrl : pokemon.imageUrl;
              return primary || fallback;
            })()}
            onError={() => setImgError(true)}
            onLoad={() => setImgLoaded(true)}
            alt={pokemon.name}
            className={`w-full h-full object-contain drop-shadow-2xl pixelated transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] ${!imgLoaded ? 'opacity-0' : 'opacity-100'}`}
            loading="lazy"
          />

          {/* Animated background pattern - Optimized to use CSS group-hover opacity */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
          </div>
        </div>

        <div
          className={`p-4 ${
            isCyberpunk
              ? 'bg-black/50 border-t border-cyan-500/20'
              : theme === 'dark'
                ? 'bg-black/30'
                : 'bg-white/50'
          }`}
        >
          <p
            className={`text-sm font-bold ${
              isCyberpunk
                ? 'cyber-text opacity-70'
                : theme === 'dark'
                  ? 'text-slate-300'
                  : 'text-slate-500'
            }`}
          >
            #{String(pokemon.id).padStart(4, '0')}
          </p>
          <h3
            className={`text-xl font-bold capitalize mb-2 truncate ${
              isCyberpunk ? 'cyber-text-pink' : theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            {pokemon.name}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
          {(onAddToTeam || onRemoveFromTeam) && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={isInTeam ? handleRemoveFromTeam : handleAddToTeam}
                disabled={!isInTeam && teamIsFull}
                className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-400/60 ${
                  isCyberpunk
                    ? isInTeam
                      ? 'cyber-btn border-red-400/60 !text-red-400 hover:!border-red-500 hover:!text-red-300'
                      : 'cyber-btn cyber-btn-primary disabled:cursor-not-allowed disabled:opacity-40'
                    : isInTeam
                      ? theme === 'dark'
                        ? 'border-red-400/60 bg-red-500/20 text-red-200 hover:bg-red-500/30 hover:shadow-lg hover:shadow-red-500/20'
                        : 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-lg hover:shadow-red-500/10'
                      : theme === 'dark'
                        ? 'border-primary-400/60 bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 hover:shadow-lg hover:shadow-primary-500/20 disabled:cursor-not-allowed disabled:opacity-40'
                        : 'border-primary-400/60 bg-primary-500/10 text-primary-600 hover:bg-primary-500/20 hover:shadow-lg hover:shadow-primary-500/10 disabled:cursor-not-allowed disabled:opacity-40'
                }`}
              >
                {isInTeam ? 'Remove' : teamIsFull ? 'Team full' : 'Add to team'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(PokemonCard);
