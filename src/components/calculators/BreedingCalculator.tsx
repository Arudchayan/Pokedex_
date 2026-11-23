import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePokemon } from '../../context/PokemonContext';
import { fetchPokemonDetailsQuery } from '../../services/pokemonDetailsQuery';
import { fetchPokemonMovesQuery } from '../../services/pokemonMovesQuery';
import { PokemonDetails } from '../../types';
import {
  calculateBreedingCompatibility,
  getPossibleGenders,
  Gender,
} from '../../utils/breedingLogic';
import TypeBadge from '../charts/TypeBadge';
import Loader from '../shared/Loader';
import Modal from '../base/Modal';
import CalculatorActionButton from './CalculatorActionButton';
import PokemonAutocomplete from '../shared/PokemonAutocomplete';
import PokemonDatasetStatus from './PokemonDatasetStatus';

interface BreedingCalculatorProps {
  onClose: () => void;
}

const BreedingCalculator: React.FC<BreedingCalculatorProps> = ({ onClose }) => {
  const {
    masterPokemonList,
    theme,
    loading: datasetLoading,
    error: datasetError,
    reload,
  } = usePokemon();
  const queryClient = useQueryClient();

  // Parent State
  const [parentA, setParentA] = useState<PokemonDetails | null>(null);
  const [genderA, setGenderA] = useState<Gender>('male');
  const [parentB, setParentB] = useState<PokemonDetails | null>(null);
  const [genderB, setGenderB] = useState<Gender>('female');

  // Parent lookup state
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [parentError, setParentError] = useState<{
    message: string;
    id: number;
    isA: boolean;
  } | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Offspring State
  const [offspringDetails, setOffspringDetails] = useState<PokemonDetails | null>(null);
  const [loadingOffspring, setLoadingOffspring] = useState(false);
  const [offspringError, setOffspringError] = useState<string | null>(null);
  const [offspringRetryTick, setOffspringRetryTick] = useState(0);

  // Options
  const [destinyKnot, setDestinyKnot] = useState(false);
  const [everstone, setEverstone] = useState(false);
  const [masudaMethod, setMasudaMethod] = useState(false);
  const [shinyCharm, setShinyCharm] = useState(false);

  // Load Parent Data
  const loadParent = async (id: number, isA: boolean) => {
    const setLoading = isA ? setLoadingA : setLoadingB;
    setLoading(true);
    setParentError(null);
    try {
      const details = await fetchPokemonDetailsQuery(queryClient, id);
      if (!details) {
        setParentError({
          message: `Could not load Pokémon #${id}.`,
          id,
          isA,
        });
        return;
      }

      const moves = await fetchPokemonMovesQuery(queryClient, details.id);
      const withMoves = { ...details, moves };
      if (isA) {
        setParentA(withMoves);
        const genders = getPossibleGenders(details.genderRate);
        setGenderA(genders[0]);
      } else {
        setParentB(withMoves);
        const genders = getPossibleGenders(details.genderRate);
        setGenderB(genders.length > 1 ? genders[1] : genders[0]); // Default to opposite if possible
      }
      setHasCalculated(false);
    } catch (error) {
      console.error(error);
      setParentError({
        message: 'Failed to load Pokémon data. Check your connection and try again.',
        id,
        isA,
      });
    } finally {
      setLoading(false);
    }
  };

  // Result Calculation
  const result = useMemo(() => {
    if (!parentA || !parentB) return null;
    return calculateBreedingCompatibility(
      { pokemon: parentA, gender: genderA },
      { pokemon: parentB, gender: genderB }
    );
  }, [parentA, parentB, genderA, genderB]);

  // Fetch Offspring
  useEffect(() => {
    if (!hasCalculated || !result?.isCompatible || !result.offspringId) {
      setOffspringDetails(null);
      setLoadingOffspring(false);
      setOffspringError(null);
      return;
    }

    if (parentA?.id === result.offspringId) {
      setOffspringDetails(parentA);
      setOffspringError(null);
      return;
    }
    if (parentB?.id === result.offspringId) {
      setOffspringDetails(parentB);
      setOffspringError(null);
      return;
    }

    let cancelled = false;
    setLoadingOffspring(true);
    setOffspringError(null);
    Promise.all([
      fetchPokemonDetailsQuery(queryClient, result.offspringId),
      fetchPokemonMovesQuery(queryClient, result.offspringId),
    ])
      .then(([details, moves]) => {
        if (cancelled) return;
        if (!details) {
          setOffspringError('Could not load the predicted offspring.');
          return;
        }
        setOffspringDetails({ ...details, moves });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error(error);
        setOffspringError('Failed to load the predicted offspring. Check your connection.');
      })
      .finally(() => {
        if (!cancelled) setLoadingOffspring(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasCalculated, result, parentA, parentB, queryClient, offspringRetryTick]);

  // Egg Moves
  const eggMoves = useMemo(() => {
    if (!offspringDetails) return [];
    return offspringDetails.moves
      .filter((m) => m.learnMethod === 'egg')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [offspringDetails]);

  // Stats Probability Text
  const ivText = destinyKnot ? '5 IVs from parents (1 random)' : '3 IVs from parents (3 random)';

  const natureText = everstone ? '100% chance to pass Nature (if holder)' : 'Random Nature';

  const shinyOdds = masudaMethod
    ? shinyCharm
      ? '1/512 (Masuda + Charm)'
      : '1/683 (Masuda)'
    : shinyCharm
      ? '1/1365 (Charm)'
      : '1/4096 (Base)';

  const canCalculate = Boolean(parentA && parentB && !loadingA && !loadingB);
  const isBusy = loadingA || loadingB;

  const resetCalculator = () => {
    setParentA(null);
    setParentB(null);
    setLoadingA(false);
    setLoadingB(false);
    setParentError(null);
    setHasCalculated(false);
    setOffspringDetails(null);
    setOffspringError(null);
    setLoadingOffspring(false);
    setDestinyKnot(false);
    setEverstone(false);
    setMasudaMethod(false);
    setShinyCharm(false);
    setGenderA('male');
    setGenderB('female');
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Breeding Calculator" size="md">
      <PokemonDatasetStatus
        loading={datasetLoading}
        error={datasetError}
        hasData={masterPokemonList.length > 0}
        onRetry={() => void reload()}
      />

      <p className="mb-4 text-center text-sm text-slate-600 dark:text-slate-400">
        Select two parents to check compatibility and preview the offspring.
      </p>

      {parentError && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
        >
          <span>{parentError.message}</span>
          <button
            type="button"
            onClick={() => void loadParent(parentError.id, parentError.isA)}
            className="rounded-md px-2 py-1 text-xs font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {isBusy && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 text-sm text-slate-600 dark:text-slate-400"
        >
          Loading parent data…
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Parent A */}
        <div
          className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            Parent A
            {parentA && (
              <button
                onClick={() => {
                  setParentA(null);
                  setHasCalculated(false);
                }}
                className="text-xs text-red-400 hover:underline font-normal"
              >
                (Change)
              </button>
            )}
          </h3>
          {!parentA ? (
            <PokemonAutocomplete
              pokemonList={masterPokemonList}
              theme={theme}
              onSelect={(p) => void loadParent(p.id, true)}
              label="Parent A"
              placeholder="Search Parent A..."
              hideLabel
              containerClassName="relative"
              disabled={!masterPokemonList.length || loadingA}
            />
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <img src={parentA.imageUrl} className="w-20 h-20" />
                <div>
                  <div className="font-bold text-xl capitalize">{parentA.name}</div>
                  <div className="flex gap-1 mt-1">
                    {parentA.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Egg Groups
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {parentA.eggGroups.map((g) => (
                      <span
                        key={g}
                        className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Gender
                  </span>
                  <div className="flex gap-2 mt-1">
                    {getPossibleGenders(parentA.genderRate).map((g) => (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={genderA === g}
                        onClick={() => setGenderA(g)}
                        className={`px-3 py-1 rounded text-xs font-bold capitalize border ${
                          genderA === g
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'border-transparent bg-black/10 hover:bg-black/20'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Parent B */}
        <div
          className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            Parent B
            {parentB && (
              <button
                onClick={() => {
                  setParentB(null);
                  setHasCalculated(false);
                }}
                className="text-xs text-red-400 hover:underline font-normal"
              >
                (Change)
              </button>
            )}
          </h3>
          {!parentB ? (
            <PokemonAutocomplete
              pokemonList={masterPokemonList}
              theme={theme}
              onSelect={(p) => void loadParent(p.id, false)}
              label="Parent B"
              placeholder="Search Parent B..."
              hideLabel
              containerClassName="relative"
              disabled={!masterPokemonList.length || loadingB}
            />
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <img src={parentB.imageUrl} className="w-20 h-20" />
                <div>
                  <div className="font-bold text-xl capitalize">{parentB.name}</div>
                  <div className="flex gap-1 mt-1">
                    {parentB.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Egg Groups
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {parentB.eggGroups.map((g) => (
                      <span
                        key={g}
                        className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Gender
                  </span>
                  <div className="flex gap-2 mt-1">
                    {getPossibleGenders(parentB.genderRate).map((g) => (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={genderB === g}
                        onClick={() => setGenderB(g)}
                        className={`px-3 py-1 rounded text-xs font-bold capitalize border ${
                          genderB === g
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'border-transparent bg-black/10 hover:bg-black/20'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <section aria-labelledby="breeding-result-heading" aria-live="polite" aria-atomic="true">
        <h3
          id="breeding-result-heading"
          className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
        >
          Breeding Result
        </h3>

        {hasCalculated && parentA && parentB && result ? (
          <div
            className={`rounded-xl border p-6 ${result.isCompatible ? (theme === 'dark' ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200') : theme === 'dark' ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`p-3 rounded-full ${result.isCompatible ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
              >
                {result.isCompatible ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h4 className="font-bold text-xl text-slate-900 dark:text-white">
                  {result.isCompatible ? 'Compatible!' : 'Incompatible'}
                </h4>
                <p className="text-slate-800 dark:text-slate-200">{result.message}</p>
                {!result.isCompatible && (
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    Change a parent or gender to try a different pair.
                  </p>
                )}
              </div>
            </div>

            {result.isCompatible && (
              <div className="mt-6 border-t border-white/10 pt-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <h5 className="font-bold uppercase text-slate-700 dark:text-slate-300 mb-4 text-sm">
                      Offspring Prediction
                    </h5>
                    {loadingOffspring ? (
                      <Loader message="Fetching Offspring..." />
                    ) : offspringError ? (
                      <div
                        role="alert"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
                      >
                        <span>{offspringError}</span>
                        <button
                          type="button"
                          onClick={() => setOffspringRetryTick((tick) => tick + 1)}
                          className="rounded-md px-2 py-1 text-xs font-semibold underline"
                        >
                          Retry
                        </button>
                      </div>
                    ) : offspringDetails ? (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-black/10">
                        <img
                          src={offspringDetails.imageUrl}
                          className="w-24 h-24"
                          alt={offspringDetails.name}
                        />
                        <div>
                          <div className="font-bold text-2xl capitalize">
                            {offspringDetails.name}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {offspringDetails.types.map((t) => (
                              <TypeBadge key={t} type={t} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1 space-y-4">
                    <h5 className="font-bold uppercase text-slate-700 dark:text-slate-300 mb-2 text-sm">
                      Inheritance Options
                    </h5>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={destinyKnot}
                        onChange={(e) => setDestinyKnot(e.target.checked)}
                        className="rounded text-primary-500 focus:ring-primary-500 bg-transparent"
                      />
                      <span>Destiny Knot (Item)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={everstone}
                        onChange={(e) => setEverstone(e.target.checked)}
                        className="rounded text-primary-500 focus:ring-primary-500 bg-transparent"
                      />
                      <span>Everstone (Item)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={masudaMethod}
                        onChange={(e) => setMasudaMethod(e.target.checked)}
                        className="rounded text-primary-500 focus:ring-primary-500 bg-transparent"
                      />
                      <span>Masuda Method (Diff. Language)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={shinyCharm}
                        onChange={(e) => setShinyCharm(e.target.checked)}
                        className="rounded text-primary-500 focus:ring-primary-500 bg-transparent"
                      />
                      <span>Shiny Charm</span>
                    </label>

                    <div className="mt-4 p-3 rounded bg-black/10 text-sm space-y-1 text-slate-800 dark:text-slate-200">
                      <div className="flex justify-between">
                        <span>IVs:</span>
                        <span className="font-bold">{ivText}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nature:</span>
                        <span className="font-bold">{natureText}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shiny Odds:</span>
                        <span className="font-bold text-pink-700 dark:text-pink-400">
                          {shinyOdds}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {eggMoves.length > 0 && (
                  <div className="mt-8">
                    <h5 className="font-bold uppercase text-slate-700 dark:text-slate-300 mb-4 text-sm">
                      Potential Egg Moves ({eggMoves.length})
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {eggMoves.map((m) => (
                        <div
                          key={m.name}
                          className={`px-3 py-2 rounded text-xs border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}
                        >
                          <span className="font-bold block capitalize">{m.name}</span>
                          <span className="text-slate-600 capitalize dark:text-slate-400">
                            {m.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {!parentA && !parentB
              ? 'Select Parent A and Parent B to check whether they can breed.'
              : !parentA
                ? 'Select Parent A to complete the pair.'
                : !parentB
                  ? 'Select Parent B to complete the pair.'
                  : 'Choose Check Compatibility to see the breeding result.'}
          </div>
        )}
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {hasCalculated
            ? 'Result updates as you change parents, genders or options.'
            : 'Choose both parents, then check compatibility.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <CalculatorActionButton onClick={() => setHasCalculated(true)} disabled={!canCalculate}>
            {hasCalculated ? 'Recheck Compatibility' : 'Check Compatibility'}
          </CalculatorActionButton>
          <CalculatorActionButton variant="secondary" onClick={resetCalculator}>
            Reset
          </CalculatorActionButton>
        </div>
      </div>
    </Modal>
  );
};

export default BreedingCalculator;
