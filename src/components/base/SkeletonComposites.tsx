import React from 'react';
import { Skeleton } from './Skeleton';

// ---------------------------------------------------------------------------
// PokemonCardSkeleton
// ---------------------------------------------------------------------------

/**
 * Skeleton matching the PokemonCard layout:
 * aspect-square container → image area → name → type badges.
 */
export const PokemonCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    role="status"
    aria-label="Loading..."
    className={`rounded-2xl overflow-hidden border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-white/10 ${className ?? ''}`}
  >
    {/* Image area – 60 % of height */}
    <div className="aspect-[1/0.6] w-full">
      <Skeleton
        animation="wave"
        className="w-full h-full !rounded-none"
      />
    </div>

    {/* Text / badges area */}
    <div className="p-4 space-y-3">
      {/* Pokemon number */}
      <Skeleton animation="wave" width="30%" height="0.75rem" rounded="md" />

      {/* Pokemon name */}
      <Skeleton animation="wave" width="66%" height="1.25rem" rounded="md" />

      {/* Type badges */}
      <div className="flex gap-2">
        <Skeleton animation="wave" width="3.5rem" height="1.25rem" rounded="full" />
        <Skeleton animation="wave" width="3.5rem" height="1.25rem" rounded="full" />
      </div>
    </div>
  </div>
);

PokemonCardSkeleton.displayName = 'PokemonCardSkeleton';

// ---------------------------------------------------------------------------
// PokemonDetailSkeleton
// ---------------------------------------------------------------------------

/**
 * Skeleton matching the PokemonDetailView modal layout.
 * Two-column on lg: left has image + text, right has title, badges, stats, info.
 */
export const PokemonDetailSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    role="status"
    aria-label="Loading..."
    className={`rounded-2xl overflow-hidden border bg-white dark:bg-black/40 border-slate-200 dark:border-white/20 p-6 sm:p-8 ${className ?? ''}`}
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ---- Left column ---- */}
      <div className="flex flex-col gap-6">
        {/* Large image placeholder */}
        <Skeleton
          animation="wave"
          className="w-full aspect-square"
          rounded="xl"
        />

        {/* Flavor text lines */}
        <div className="space-y-2">
          <Skeleton animation="wave" width="90%" height="0.875rem" rounded="md" />
          <Skeleton animation="wave" width="75%" height="0.875rem" rounded="md" />
        </div>
      </div>

      {/* ---- Right column ---- */}
      <div className="flex flex-col gap-6">
        {/* Title */}
        <Skeleton animation="wave" width="55%" height="1.75rem" rounded="md" />

        {/* Type badge pills */}
        <div className="flex gap-2">
          <Skeleton animation="wave" width="4.5rem" height="1.5rem" rounded="full" />
          <Skeleton animation="wave" width="4.5rem" height="1.5rem" rounded="full" />
        </div>

        {/* Stat bars (6 stats) */}
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton animation="wave" width="3.5rem" height="0.75rem" rounded="md" />
              <Skeleton animation="wave" className="flex-1" height="0.625rem" rounded="full" />
            </div>
          ))}
        </div>

        {/* Section header */}
        <Skeleton animation="wave" width="40%" height="1rem" rounded="md" />

        {/* Info text lines */}
        <div className="space-y-2">
          <Skeleton animation="wave" width="100%" height="0.875rem" rounded="md" />
          <Skeleton animation="wave" width="85%" height="0.875rem" rounded="md" />
          <Skeleton animation="wave" width="70%" height="0.875rem" rounded="md" />
        </div>
      </div>
    </div>
  </div>
);

PokemonDetailSkeleton.displayName = 'PokemonDetailSkeleton';

// ---------------------------------------------------------------------------
// CalculatorSkeleton
// ---------------------------------------------------------------------------

/** Reusable card column used inside CalculatorSkeleton. */
const CalcCardPlaceholder: React.FC = () => (
  <div className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
    {/* Avatar */}
    <div className="flex justify-center">
      <Skeleton animation="wave" width="3.5rem" height="3.5rem" rounded="full" />
    </div>

    {/* Two text lines */}
    <Skeleton animation="wave" width="70%" height="0.875rem" rounded="md" />
    <Skeleton animation="wave" width="50%" height="0.75rem" rounded="md" />

    {/* Three input bars */}
    <div className="space-y-2 pt-1">
      <Skeleton animation="wave" width="100%" height="1.75rem" rounded="md" />
      <Skeleton animation="wave" width="100%" height="1.75rem" rounded="md" />
      <Skeleton animation="wave" width="100%" height="1.75rem" rounded="md" />
    </div>
  </div>
);

/**
 * Generic calculator modal skeleton (damage calc / catch calc).
 * Title bar → two side-by-side cards → result bar.
 */
export const CalculatorSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    role="status"
    aria-label="Loading..."
    className={`rounded-2xl overflow-hidden border bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 p-6 space-y-6 ${className ?? ''}`}
  >
    {/* Title bar */}
    <Skeleton animation="wave" width="45%" height="1.5rem" rounded="md" />

    {/* Two side-by-side cards */}
    <div className="flex flex-col sm:flex-row gap-4">
      <CalcCardPlaceholder />
      <CalcCardPlaceholder />
    </div>

    {/* Result section */}
    <div className="pt-2">
      <Skeleton animation="wave" width="100%" height="2.5rem" rounded="lg" />
    </div>
  </div>
);

CalculatorSkeleton.displayName = 'CalculatorSkeleton';

// ---------------------------------------------------------------------------
// PokemonGridSkeleton
// ---------------------------------------------------------------------------

export interface PokemonGridSkeletonProps {
  /** Number of card skeletons to render. @default 12 */
  count?: number;
}

/**
 * Renders a responsive grid of PokemonCardSkeleton placeholders.
 */
export const PokemonGridSkeleton: React.FC<PokemonGridSkeletonProps> = ({ count = 12 }) => (
  <div
    role="status"
    aria-label="Loading..."
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
  >
    {Array.from({ length: count }).map((_, i) => (
      <PokemonCardSkeleton key={i} />
    ))}
  </div>
);

PokemonGridSkeleton.displayName = 'PokemonGridSkeleton';
