import React, { useState, useEffect, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { fetchPokemonDetails } from '../../services/pokeapiService';
import { PokemonDetails } from '../../types';
import {
  calculateBreedingCompatibility,
  getPossibleGenders,
  Gender,
} from '../../utils/breedingLogic';
import TypeBadge from '../charts/TypeBadge';
import Loader from '../shared/Loader';
import Modal from '../base/Modal';

interface BreedingCalculatorProps {
  onClose: () => void;
}

const BreedingCalculator: React.FC<BreedingCalculatorProps> = ({ onClose }) => {
  const { masterPokemonList, theme } = usePokemon();

  // Parent State
  const [parentA, setParentA] = useState<PokemonDetails | null>(null);
  const [genderA, setGenderA] = useState<Gender>('male');
  const [parentB, setParentB] = useState<PokemonDetails | null>(null);
  const [genderB, setGenderB] = useState<Gender>('female');

  // Search State
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  // Offspring State
  const [offspringDetails, setOffspringDetails] = useState<PokemonDetails | null>(null);
  const [loadingOffspring, setLoadingOffspring] = useState(false);

  // Options
  const [destinyKnot, setDestinyKnot] = useState(false);
  const [everstone, setEverstone] = useState(false);
  const [masudaMethod, setMasudaMethod] = useState(false);
  const [shinyCharm, setShinyCharm] = useState(false);

  // Load Parent Data
  const loadParent = async (id: number, isA: boolean) => {
    const details = await fetchPokemonDetails(id);
    if (details) {
      if (isA) {
        setParentA(details);
        const genders = getPossibleGenders(details.genderRate);
        setGenderA(genders[0]);
        setSearchA('');
      } else {
        setParentB(details);
        const genders = getPossibleGenders(details.genderRate);
        setGenderB(genders.length > 1 ? genders[1] : genders[0]); // Default to opposite if possible
        setSearchB('');
      }
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
    if (result?.isCompatible && result.offspringId) {
      if (parentA?.id === result.offspringId) {
        setOffspringDetails(parentA);
      } else if (parentB?.id === result.offspringId) {
        setOffspringDetails(parentB);
      } else {
        setLoadingOffspring(true);
        fetchPokemonDetails(result.offspringId).then((d) => {
          setOffspringDetails(d);
          setLoadingOffspring(false);
        });
      }
    } else {
      setOffspringDetails(null);
    }
  }, [result, parentA, parentB]);

  const filteredListA = useMemo(
    () =>
      masterPokemonList
        .filter((p) => p.name.toLowerCase().includes(searchA.toLowerCase()))
        .slice(0, 5),
    [searchA, masterPokemonList]
  );
  const filteredListB = useMemo(
    () =>
      masterPokemonList
        .filter((p) => p.name.toLowerCase().includes(searchB.toLowerCase()))
        .slice(0, 5),
    [searchB, masterPokemonList]
  );

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

  return (
    <Modal isOpen={true} onClose={onClose} title="Breeding Calculator" size="md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Parent A */}
        <div
          className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            Parent A
            {parentA && (
              <button
                onClick={() => setParentA(null)}
                className="text-xs text-red-400 hover:underline font-normal"
              >
                (Change)
              </button>
            )}
          </h3>
          {!parentA ? (
            <div className="relative">
              <input
                type="text"
                placeholder="Search Parent A..."
                className={`w-full p-3 rounded bg-transparent border focus:outline-none focus:border-primary-500 ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}
                value={searchA}
                onChange={(e) => setSearchA(e.target.value)}
              />
              {filteredListA.length > 0 && searchA && (
                <div
                  className={`absolute top-full left-0 w-full z-10 rounded-b shadow-xl max-h-60 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                >
                  {filteredListA.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 hover:bg-primary-500/20 cursor-pointer flex items-center gap-2"
                      onClick={() => loadParent(p.id, true)}
                    >
                      <img src={p.imageUrl} className="w-8 h-8" />
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  <span className="text-xs font-bold uppercase opacity-60">Egg Groups</span>
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
                  <span className="text-xs font-bold uppercase opacity-60">Gender</span>
                  <div className="flex gap-2 mt-1">
                    {getPossibleGenders(parentA.genderRate).map((g) => (
                      <button
                        key={g}
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
                onClick={() => setParentB(null)}
                className="text-xs text-red-400 hover:underline font-normal"
              >
                (Change)
              </button>
            )}
          </h3>
          {!parentB ? (
            <div className="relative">
              <input
                type="text"
                placeholder="Search Parent B..."
                className={`w-full p-3 rounded bg-transparent border focus:outline-none focus:border-primary-500 ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}
                value={searchB}
                onChange={(e) => setSearchB(e.target.value)}
              />
              {filteredListB.length > 0 && searchB && (
                <div
                  className={`absolute top-full left-0 w-full z-10 rounded-b shadow-xl max-h-60 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                >
                  {filteredListB.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 hover:bg-primary-500/20 cursor-pointer flex items-center gap-2"
                      onClick={() => loadParent(p.id, false)}
                    >
                      <img src={p.imageUrl} className="w-8 h-8" />
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  <span className="text-xs font-bold uppercase opacity-60">Egg Groups</span>
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
                  <span className="text-xs font-bold uppercase opacity-60">Gender</span>
                  <div className="flex gap-2 mt-1">
                    {getPossibleGenders(parentB.genderRate).map((g) => (
                      <button
                        key={g}
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
      {parentA && parentB && result && (
        <div
          className={`rounded-xl border p-6 ${result.isCompatible ? (theme === 'dark' ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200') : theme === 'dark' ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`p-3 rounded-full ${result.isCompatible ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
            >
              {result.isCompatible ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <h4 className="font-bold text-xl">
                {result.isCompatible ? 'Compatible!' : 'Incompatible'}
              </h4>
              <p className="opacity-80">{result.message}</p>
            </div>
          </div>

          {result.isCompatible && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h5 className="font-bold uppercase opacity-60 mb-4 text-sm">
                    Offspring Prediction
                  </h5>
                  {loadingOffspring ? (
                    <Loader message="Fetching Offspring..." />
                  ) : offspringDetails ? (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-black/10">
                      <img src={offspringDetails.imageUrl} className="w-24 h-24" />
                      <div>
                        <div className="font-bold text-2xl capitalize">{offspringDetails.name}</div>
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
                  <h5 className="font-bold uppercase opacity-60 mb-2 text-sm">
                    Inheritance Options
                  </h5>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={destinyKnot}
                      onChange={(e) => setDestinyKnot(e.target.checked)}
                      className="rounded text-primary-500 focus:ring-primary-500 bg-transparent"
                    />
                    <span>Destiny Knot (Item)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={everstone}
                      onChange={(e) => setEverstone(e.target.checked)}
                      className="rounded text-primary-500 focus:ring-primary-500 bg-transparent"
                    />
                    <span>Everstone (Item)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={masudaMethod}
                      onChange={(e) => setMasudaMethod(e.target.checked)}
                      className="rounded text-primary-500 focus:ring-primary-500 bg-transparent"
                    />
                    <span>Masuda Method (Diff. Language)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shinyCharm}
                      onChange={(e) => setShinyCharm(e.target.checked)}
                      className="rounded text-primary-500 focus:ring-primary-500 bg-transparent"
                    />
                    <span>Shiny Charm</span>
                  </label>

                  <div className="mt-4 p-3 rounded bg-black/10 text-sm space-y-1">
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
                      <span className="font-bold text-pink-500">{shinyOdds}</span>
                    </div>
                  </div>
                </div>
              </div>

              {eggMoves.length > 0 && (
                <div className="mt-8">
                  <h5 className="font-bold uppercase opacity-60 mb-4 text-sm">
                    Potential Egg Moves ({eggMoves.length})
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {eggMoves.map((m) => (
                      <div
                        key={m.name}
                        className={`px-3 py-2 rounded text-xs border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}
                      >
                        <span className="font-bold block capitalize">{m.name}</span>
                        <span className="opacity-60 capitalize">{m.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default BreedingCalculator;
