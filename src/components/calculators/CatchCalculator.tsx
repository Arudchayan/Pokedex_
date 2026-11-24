import React, { useState, useEffect, useMemo } from 'react';
import { PokemonDetails } from '../../types';
import {
  BALL_TYPES,
  STATUS_CONDITIONS,
  calculateCatchProbability,
  getBallMultiplier,
} from '../../utils/catchUtils';
import { useQueryClient } from '@tanstack/react-query';
import { usePokemon } from '../../context/PokemonContext';
import { fetchPokemonDetailsQuery } from '../../services/pokemonDetailsQuery';
import Loader from '../shared/Loader';
import Modal from '../base/Modal';
import CalculatorActionButton from './CalculatorActionButton';
import PokemonAutocomplete from '../shared/PokemonAutocomplete';
import PokemonDatasetStatus from './PokemonDatasetStatus';

interface CatchCalculatorProps {
  onClose: () => void;
  initialPokemonId?: number | null;
}

const CatchCalculator: React.FC<CatchCalculatorProps> = ({ onClose, initialPokemonId }) => {
  const {
    masterPokemonList,
    theme,
    loading: datasetLoading,
    error: datasetError,
    reload,
  } = usePokemon();
  const queryClient = useQueryClient();

  // Selection State
  const [selectedId, setSelectedId] = useState<number | null>(initialPokemonId || null);
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Calculator State
  const [selectedBall, setSelectedBall] = useState<keyof typeof BALL_TYPES>('POKE_BALL');
  const [selectedStatus, setSelectedStatus] = useState<keyof typeof STATUS_CONDITIONS>('NONE');
  const [hpPercent, setHpPercent] = useState(100);
  const [isNight, setIsNight] = useState(false);
  const [turn, setTurn] = useState(1);

  // Fetch Pokemon Data
  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchPokemonDetailsQuery(queryClient, selectedId)
      .then((details) => {
        if (cancelled) return;
        if (!details) {
          setLoadError(`Could not load Pokémon #${selectedId}.`);
          return;
        }
        setPokemon(details);
        setHasCalculated(false);
        // Reset calculator state on new pokemon
        setHpPercent(100);
        setSelectedStatus('NONE');
        setTurn(1);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error(error);
        setLoadError('Failed to load Pokémon data. Check your connection and try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, queryClient, retryTick]);

  // Derived
  const probability = useMemo(() => {
    if (!pokemon) return 0;

    // Determine effective multiplier
    const ballMultiplier = getBallMultiplier(selectedBall, pokemon.types, isNight, turn);
    const statusMultiplier = STATUS_CONDITIONS[selectedStatus].multiplier;
    const isMaster = selectedBall === 'MASTER_BALL';

    return calculateCatchProbability({
      captureRate: pokemon.captureRate || 45, // Default to 45 if missing
      ballMultiplier,
      statusMultiplier,
      hpPercent,
      isMasterBall: isMaster,
    });
  }, [selectedBall, selectedStatus, hpPercent, isNight, turn, pokemon]);

  const probabilityColor = useMemo(() => {
    if (probability >= 90) return 'text-green-700 dark:text-green-400';
    if (probability >= 50) return 'text-yellow-700 dark:text-yellow-400';
    if (probability >= 20) return 'text-orange-700 dark:text-orange-400';
    return 'text-red-700 dark:text-red-400';
  }, [probability]);

  const resetCalculator = () => {
    setPokemon(null);
    setSelectedId(null);
    setLoading(false);
    setLoadError(null);
    setHasCalculated(false);
    setSelectedBall('POKE_BALL');
    setSelectedStatus('NONE');
    setHpPercent(100);
    setIsNight(false);
    setTurn(1);
  };

  const canCalculate = Boolean(pokemon && !loading);

  return (
    <Modal isOpen={true} onClose={onClose} title="Catch Calculator" size="md">
      <PokemonDatasetStatus
        loading={datasetLoading}
        error={datasetError}
        hasData={masterPokemonList.length > 0}
        onRetry={() => void reload()}
      />

      {!pokemon ? (
        <>
          <p className="mx-auto mb-4 max-w-md text-center text-sm text-slate-600 dark:text-slate-400">
            Select a Pokémon to estimate its catch rate. You can then choose a ball, status and HP
            level.
          </p>
          <PokemonAutocomplete
            pokemonList={masterPokemonList}
            theme={theme}
            onSelect={(p) => {
              setLoadError(null);
              setSelectedId(p.id);
            }}
            autoFocus
            disabled={!masterPokemonList.length}
          />
          {loading && (
            <div className="mt-4 flex justify-center">
              <Loader message="Loading Pokémon..." />
            </div>
          )}
          {loadError && (
            <div
              role="alert"
              className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => setRetryTick((tick) => tick + 1)}
                className="rounded-md px-2 py-1 text-xs font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Controls */}
            <div className="space-y-6">
              {/* Pokemon Info */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-black/5 border border-white/5 relative group">
                <img
                  src={pokemon.imageUrl}
                  alt={pokemon.name}
                  className="w-16 h-16 object-contain"
                />
                <div className="flex-1">
                  <h3 className="font-bold capitalize">{pokemon.name}</h3>
                  <p className="text-sm text-slate-500">Base Capture Rate: {pokemon.captureRate}</p>
                </div>
                <button
                  onClick={() => {
                    setPokemon(null);
                    setSelectedId(null);
                    setLoadError(null);
                    setHasCalculated(false);
                  }}
                  className="px-2 py-1 text-xs border rounded opacity-60 hover:opacity-100 transition-opacity"
                >
                  Change
                </button>
              </div>

              {/* HP Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label
                    htmlFor="catch-hp"
                    className="text-sm font-bold uppercase tracking-wider text-slate-500"
                  >
                    Target HP
                  </label>
                  <span
                    className={`font-mono font-bold ${hpPercent < 30 ? 'text-red-500' : 'text-green-500'}`}
                  >
                    {hpPercent}%
                  </span>
                </div>
                <input
                  id="catch-hp"
                  type="range"
                  min="1"
                  max="100"
                  value={hpPercent}
                  onChange={(e) => setHpPercent(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  aria-label="Target HP percentage"
                />
                <div className="w-full h-4 bg-gray-700 rounded-full mt-2 overflow-hidden border border-white/10">
                  <div
                    className={`h-full transition-all duration-300 ${hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${hpPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Ball Selector */}
              <div>
                <label
                  htmlFor="catch-ball"
                  className="text-sm font-bold uppercase tracking-wider text-slate-500 block mb-2"
                >
                  Poke Ball
                </label>
                <select
                  id="catch-ball"
                  className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors appearance-none cursor-pointer ${theme === 'dark' ? 'bg-black/20 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  value={selectedBall}
                  onChange={(e) => setSelectedBall(e.target.value as keyof typeof BALL_TYPES)}
                >
                  {Object.entries(BALL_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name} (x{value.multiplier})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Status Condition
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STATUS_CONDITIONS).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={selectedStatus === key}
                      onClick={() => setSelectedStatus(key as keyof typeof STATUS_CONDITIONS)}
                      className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                        selectedStatus === key
                          ? `${value.color.replace('text-', 'bg-')}/20 ${value.color} border-current`
                          : 'border-transparent bg-black/5 hover:bg-black/10 text-slate-500'
                      }`}
                    >
                      {value.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <section
              aria-labelledby="catch-result-heading"
              aria-live="polite"
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-black/5 to-black/10 border border-white/5 relative overflow-hidden"
            >
              {/* Visual Decor */}
              <div className="absolute top-0 right-0 p-32 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 p-32 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

              <div className="relative z-10 text-center space-y-2">
                <h3
                  id="catch-result-heading"
                  className="text-slate-600 font-bold uppercase tracking-widest text-sm dark:text-slate-400"
                >
                  Capture Probability
                </h3>
                <div
                  className={`text-7xl font-black tracking-tighter transition-colors duration-500 ${hasCalculated ? probabilityColor : 'text-slate-500'}`}
                >
                  {hasCalculated ? `${probability.toFixed(1)}%` : '—'}
                </div>
                <p
                  className="text-xs text-slate-600 max-w-[200px] mx-auto dark:text-slate-400"
                  role={hasCalculated ? undefined : 'status'}
                >
                  {hasCalculated
                    ? 'Estimated chance per throw based on current conditions.'
                    : 'Set the conditions, then calculate to see the estimated chance.'}
                </p>
              </div>

              {/* Contextual Tips */}
              <div className="mt-8 w-full space-y-3">
                {selectedBall === 'NET_BALL' &&
                  !pokemon.types.includes('water') &&
                  !pokemon.types.includes('bug') && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <p className="text-xs text-yellow-200">
                        Net Ball is only effective on Water or Bug types (x3.5). Currently acting as
                        a Poke Ball (x1).
                      </p>
                    </div>
                  )}
                {selectedBall === 'DUSK_BALL' && (
                  <label className="flex items-center gap-3 p-3 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={isNight}
                      onChange={(e) => setIsNight(e.target.checked)}
                      className="rounded text-primary-500 focus:ring-primary-500 bg-transparent border-slate-500"
                    />
                    <div className="text-sm">
                      <span className="font-bold block">Night or Cave?</span>
                      <span className="text-xs text-slate-400">Increases catch rate to x3.0</span>
                    </div>
                  </label>
                )}
                {selectedBall === 'QUICK_BALL' && (
                  <label className="flex items-center gap-3 p-3 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={turn === 1}
                      onChange={(e) => setTurn(e.target.checked ? 1 : 2)}
                      className="rounded text-primary-500 focus:ring-primary-500 bg-transparent border-slate-500"
                    />
                    <div className="text-sm">
                      <span className="font-bold block">First Turn?</span>
                      <span className="text-xs text-slate-400">Increases catch rate to x5.0!</span>
                    </div>
                  </label>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {!pokemon
            ? 'Select a Pokémon to enable calculation.'
            : hasCalculated
              ? 'Probability updates as you change the conditions.'
              : 'Pick a ball, status and HP level, then calculate.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <CalculatorActionButton onClick={() => setHasCalculated(true)} disabled={!canCalculate}>
            {hasCalculated ? 'Recalculate Catch Rate' : 'Calculate Catch Rate'}
          </CalculatorActionButton>
          <CalculatorActionButton variant="secondary" onClick={resetCalculator}>
            Reset
          </CalculatorActionButton>
        </div>
      </div>
    </Modal>
  );
};

export default CatchCalculator;
