import React, { useState, useEffect, useMemo } from 'react';
import { PokemonDetails } from '../../types';
import {
  BALL_TYPES,
  STATUS_CONDITIONS,
  calculateCatchProbability,
  getBallMultiplier,
} from '../../utils/catchUtils';
import { usePokemon } from '../../context/PokemonContext';
import { fetchPokemonDetails } from '../../services/pokeapiService';
import Loader from '../shared/Loader';
import TypeBadge from '../charts/TypeBadge';
import Modal from '../base/Modal';

interface CatchCalculatorProps {
  onClose: () => void;
  initialPokemonId?: number | null;
}

const CatchCalculator: React.FC<CatchCalculatorProps> = ({ onClose, initialPokemonId }) => {
  const { masterPokemonList, theme } = usePokemon();

  // Selection State
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(initialPokemonId || null);
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculator State
  const [selectedBall, setSelectedBall] = useState<keyof typeof BALL_TYPES>('POKE_BALL');
  const [selectedStatus, setSelectedStatus] = useState<keyof typeof STATUS_CONDITIONS>('NONE');
  const [hpPercent, setHpPercent] = useState(100);
  const [isNight, setIsNight] = useState(false);
  const [turn, setTurn] = useState(1);

  // Fetch Pokemon Data
  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      fetchPokemonDetails(selectedId)
        .then((details) => {
          if (details) {
            setPokemon(details);
            // Reset calculator state on new pokemon
            setHpPercent(100);
            setSelectedStatus('NONE');
            setTurn(1);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [selectedId]);

  const filteredList = useMemo(() => {
    if (!search) return [];
    const searchLower = search.toLowerCase();
    return masterPokemonList
      .filter((p) => (p.nameLower || p.name.toLowerCase()).includes(searchLower))
      .slice(0, 5);
  }, [search, masterPokemonList]);

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
    if (probability >= 90) return 'text-green-500';
    if (probability >= 50) return 'text-yellow-500';
    if (probability >= 20) return 'text-orange-500';
    return 'text-red-500';
  }, [probability]);

  return (
    <Modal isOpen={true} onClose={onClose} title="Catch Calculator" size="md">
      {!pokemon ? (
        <div className="relative z-20 max-w-md mx-auto mt-10">
          <label
            htmlFor="pokemon-search"
            className="block text-sm font-bold mb-2 uppercase tracking-wider text-slate-500"
          >
            Select Pokemon
          </label>
          <input
            id="pokemon-search"
            type="text"
            placeholder="Search Pokemon..."
            className={`w-full p-4 text-lg rounded-xl bg-transparent border focus:outline-none focus:border-primary-500 ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {filteredList.length > 0 && (
            <div
              className={`absolute top-full left-0 w-full z-10 rounded-b-xl shadow-xl max-h-60 overflow-y-auto mt-1 border ${theme === 'dark' ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}
            >
              {filteredList.map((p) => (
                <div
                  key={p.id}
                  className="p-3 hover:bg-primary-500/20 cursor-pointer flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setSelectedId(p.id);
                    setSearch('');
                  }}
                >
                  <img src={p.imageUrl} className="w-10 h-10" />
                  <span className="font-bold">{p.name}</span>
                  <div className="flex gap-1 ml-auto">
                    {p.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {loading && (
            <div className="mt-4 flex justify-center">
              <Loader />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Controls */}
          <div className="space-y-6">
            {/* Pokemon Info */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-black/5 border border-white/5 relative group">
              <img src={pokemon.imageUrl} alt={pokemon.name} className="w-16 h-16 object-contain" />
              <div className="flex-1">
                <h3 className="font-bold capitalize">{pokemon.name}</h3>
                <p className="text-sm text-slate-500">Base Capture Rate: {pokemon.captureRate}</p>
              </div>
              <button
                onClick={() => {
                  setPokemon(null);
                  setSelectedId(null);
                }}
                className="px-2 py-1 text-xs border rounded opacity-60 hover:opacity-100 transition-opacity"
              >
                Change
              </button>
            </div>

            {/* HP Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Target HP
                </label>
                <span
                  className={`font-mono font-bold ${hpPercent < 30 ? 'text-red-500' : 'text-green-500'}`}
                >
                  {hpPercent}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={hpPercent}
                onChange={(e) => setHpPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
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
              <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Poke Ball
              </label>
              <select
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
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-black/5 to-black/10 border border-white/5 relative overflow-hidden">
            {/* Visual Decor */}
            <div className="absolute top-0 right-0 p-32 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 text-center space-y-2">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                Capture Probability
              </p>
              <div
                className={`text-7xl font-black tracking-tighter transition-colors duration-500 ${probabilityColor}`}
              >
                {probability.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                Estimated chance per throw based on current conditions.
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
                      Net Ball is only effective on Water or Bug types (x3.5). Currently acting as a
                      Poke Ball (x1).
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
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CatchCalculator;
