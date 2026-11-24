import React, { useEffect, useState } from 'react';

interface PokemonDatasetStatusProps {
  /** True while the shared species list is still loading. */
  loading: boolean;
  /** Error reported by the shared species query, if any. */
  error: string | null;
  /** Whether any species are available to search. */
  hasData: boolean;
  /** Re-runs the shared species query. */
  onRetry: () => void;
}

/**
 * Status shown above a calculator picker when the shared species list cannot be
 * used. Keeping it outside the picker avoids announcing the same error twice
 * when a calculator has two pickers.
 */
const PokemonDatasetStatus: React.FC<PokemonDatasetStatusProps> = ({
  loading,
  error,
  hasData,
  onRetry,
}) => {
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!loading || hasData) {
      setTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(timer);
  }, [loading, hasData, attempt]);

  if (hasData) return null;

  if (loading && !timedOut) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mb-4 rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
      >
        Loading Pokémon data…
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {error ??
            (timedOut
              ? 'Pokémon data is taking longer than expected.'
              : 'Pokémon data is unavailable.')}{' '}
          Calculators need the species list before they can run.
        </span>
        <button
          type="button"
          onClick={() => {
            setTimedOut(false);
            setAttempt((value) => value + 1);
            onRetry();
          }}
          className="rounded-md px-2 py-1 text-xs font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default PokemonDatasetStatus;
