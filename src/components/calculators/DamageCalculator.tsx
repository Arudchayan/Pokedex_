import React, { useState, useEffect, useMemo } from 'react';
import { PokemonMove } from '../../types';
import { fetchPokemonDetails } from '../../services/pokeapiService';
import { usePokemon } from '../../context/PokemonContext';
import { NATURES, TYPE_COLORS, BATTLE_ITEMS } from '../../constants';
import Loader from '../shared/Loader';
import TypeBadge from '../charts/TypeBadge';
import { calculateDamage, BattleContext, BattleStat } from '../../utils/damageFormula';
import Modal from '../base/Modal';

interface DamageCalculatorProps {
  onClose: () => void;
  initialAttackerId?: number | null;
  initialDefenderId?: number | null;
}

interface ExtendedBattlePokemon {
  id: number;
  name: string;
  types: string[];
  stats: BattleStat[];
  level: number;
  selectedMove: PokemonMove | null;
  imageUrl: string;
  moves: PokemonMove[];

  // New Advanced Stats
  evs: { [key: string]: number };
  ivs: { [key: string]: number };
  nature: string;
  item: string;
  abilities: string[];
  selectedAbility: string;
}

const DEFAULT_EVS = {
  hp: 0,
  attack: 0,
  defense: 0,
  'special-attack': 0,
  'special-defense': 0,
  speed: 0,
};
const DEFAULT_IVS = {
  hp: 31,
  attack: 31,
  defense: 31,
  'special-attack': 31,
  'special-defense': 31,
  speed: 31,
};

const DamageCalculator: React.FC<DamageCalculatorProps> = ({
  onClose,
  initialAttackerId,
  initialDefenderId,
}) => {
  const { masterPokemonList, theme } = usePokemon();

  const [attackerId, setAttackerId] = useState<number | null>(initialAttackerId || null);
  const [defenderId, setDefenderId] = useState<number | null>(initialDefenderId || null);

  const [attacker, setAttacker] = useState<ExtendedBattlePokemon | null>(null);
  const [defender, setDefender] = useState<ExtendedBattlePokemon | null>(null);

  const [loadingAttacker, setLoadingAttacker] = useState(false);
  const [loadingDefender, setLoadingDefender] = useState(false);

  // UI Toggles
  const [showAttackerStats, setShowAttackerStats] = useState(false);
  const [showDefenderStats, setShowDefenderStats] = useState(false);

  // Search state
  const [attackerSearch, setAttackerSearch] = useState('');
  const [defenderSearch, setDefenderSearch] = useState('');

  const fetchPokemonData = async (id: number, isAttacker: boolean) => {
    const setter = isAttacker ? setAttacker : setDefender;
    const loader = isAttacker ? setLoadingAttacker : setLoadingDefender;

    loader(true);
    try {
      const details = await fetchPokemonDetails(id);
      if (details) {
        setter({
          id: details.id,
          name: details.name,
          types: details.types,
          stats: details.stats,
          level: 50,
          selectedMove: null,
          imageUrl: details.imageUrl,
          moves: details.moves.filter((m) => m.power !== null && m.power > 0),
          evs: { ...DEFAULT_EVS },
          ivs: { ...DEFAULT_IVS },
          nature: 'Hardy',
          item: 'None',
          abilities: details.abilities.map((a) => a.name),
          selectedAbility: details.abilities[0]?.name || 'None',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      loader(false);
    }
  };

  useEffect(() => {
    if (attackerId) fetchPokemonData(attackerId, true);
  }, [attackerId]);

  useEffect(() => {
    if (defenderId) fetchPokemonData(defenderId, false);
  }, [defenderId]);

  const filteredAttackerList = useMemo(() => {
    if (!attackerSearch) return [];
    return masterPokemonList
      .filter((p) => p.name.toLowerCase().includes(attackerSearch.toLowerCase()))
      .slice(0, 5);
  }, [attackerSearch, masterPokemonList]);

  const filteredDefenderList = useMemo(() => {
    if (!defenderSearch) return [];
    return masterPokemonList
      .filter((p) => p.name.toLowerCase().includes(defenderSearch.toLowerCase()))
      .slice(0, 5);
  }, [defenderSearch, masterPokemonList]);

  const result = useMemo(() => {
    if (!attacker || !defender || !attacker.selectedMove) return null;

    const ctx: BattleContext = {
      attacker: {
        ...attacker,
        ability: attacker.selectedAbility,
        moves: undefined, // Clean up for context
      } as any,
      defender: {
        ...defender,
        ability: defender.selectedAbility,
        moves: undefined,
      } as any,
      move: attacker.selectedMove,
    };

    return calculateDamage(ctx);
  }, [attacker, defender]);

  // Helper for Stat Inputs
  const StatControl = ({
    pokemon,
    setPokemon,
    statName,
    label,
  }: {
    pokemon: ExtendedBattlePokemon;
    setPokemon: any;
    statName: string;
    label: string;
  }) => {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`w-8 font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
        >
          {label}
        </span>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-4 text-center">IV</span>
            <input
              type="number"
              min="0"
              max="31"
              value={pokemon.ivs[statName]}
              onChange={(e) =>
                setPokemon({
                  ...pokemon,
                  ivs: {
                    ...pokemon.ivs,
                    [statName]: Math.min(31, Math.max(0, parseInt(e.target.value) || 0)),
                  },
                })
              }
              className={`w-12 p-1 rounded border text-center ${theme === 'dark' ? 'bg-black/30 border-white/10' : 'bg-white border-slate-300'}`}
            />
            <span className="text-[10px] w-4 text-center">EV</span>
            <input
              type="number"
              min="0"
              max="252"
              step="4"
              value={pokemon.evs[statName]}
              onChange={(e) =>
                setPokemon({
                  ...pokemon,
                  evs: {
                    ...pokemon.evs,
                    [statName]: Math.min(252, Math.max(0, parseInt(e.target.value) || 0)),
                  },
                })
              }
              className={`w-12 p-1 rounded border text-center ${theme === 'dark' ? 'bg-black/30 border-white/10' : 'bg-white border-slate-300'}`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Damage Calculator" size="xl">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attacker Column */}
          <div
            className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}
          >
            <h3 className="text-lg font-bold mb-4 text-primary-400 flex justify-between items-center">
              Attacker
              {attacker && (
                <button
                  onClick={() => setShowAttackerStats(!showAttackerStats)}
                  className="text-xs font-normal underline opacity-70 hover:opacity-100"
                >
                  {showAttackerStats ? 'Hide Stats' : 'Edit Stats'}
                </button>
              )}
            </h3>

            {!attacker ? (
              <div className="relative z-20">
                <input
                  type="text"
                  placeholder="Search Attacker..."
                  className={`w-full p-3 rounded bg-transparent border focus:outline-none focus:border-primary-500 ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}
                  value={attackerSearch}
                  onChange={(e) => setAttackerSearch(e.target.value)}
                />
                {filteredAttackerList.length > 0 && (
                  <div
                    className={`absolute top-full left-0 w-full z-10 rounded-b shadow-xl max-h-60 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                  >
                    {filteredAttackerList.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 hover:bg-primary-500/20 cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setAttackerId(p.id);
                          setAttackerSearch('');
                        }}
                      >
                        <img src={p.imageUrl} className="w-8 h-8" />
                        <span>{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img src={attacker.imageUrl} className="w-20 h-20" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold capitalize">{attacker.name}</h4>
                      <button
                        onClick={() => setAttacker(null)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {attacker.types.map((t) => (
                        <TypeBadge key={t} type={t} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold">Level</label>
                    <input
                      type="number"
                      value={attacker.level}
                      onChange={(e) =>
                        setAttacker({ ...attacker, level: parseInt(e.target.value) || 1 })
                      }
                      className={`w-full p-2 rounded border mt-1 ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-300'}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold">Nature</label>
                    <select
                      value={attacker.nature}
                      onChange={(e) => setAttacker({ ...attacker, nature: e.target.value })}
                      className={`w-full p-2 rounded border mt-1 ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-300'}`}
                    >
                      {Object.keys(NATURES).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold">Item</label>
                    <select
                      value={attacker.item}
                      onChange={(e) => setAttacker({ ...attacker, item: e.target.value })}
                      className={`w-full p-2 rounded border mt-1 ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-300'}`}
                    >
                      {BATTLE_ITEMS.map((i) => (
                        <option key={i.name} value={i.name}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold">Ability</label>
                    <select
                      value={attacker.selectedAbility}
                      onChange={(e) =>
                        setAttacker({ ...attacker, selectedAbility: e.target.value })
                      }
                      className={`w-full p-2 rounded border mt-1 ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-300'}`}
                    >
                      {attacker.abilities.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {showAttackerStats && (
                  <div
                    className={`p-3 rounded space-y-2 animate-in fade-in slide-in-from-top-2 ${theme === 'dark' ? 'bg-black/20' : 'bg-slate-100'}`}
                  >
                    <StatControl
                      pokemon={attacker}
                      setPokemon={setAttacker}
                      statName="hp"
                      label="HP"
                    />
                    <StatControl
                      pokemon={attacker}
                      setPokemon={setAttacker}
                      statName="attack"
                      label="Atk"
                    />
                    <StatControl
                      pokemon={attacker}
                      setPokemon={setAttacker}
                      statName="defense"
                      label="Def"
                    />
                    <StatControl
                      pokemon={attacker}
                      setPokemon={setAttacker}
                      statName="special-attack"
                      label="SpA"
                    />
                    <StatControl
                      pokemon={attacker}
                      setPokemon={setAttacker}
                      statName="special-defense"
                      label="SpD"
                    />
                    <StatControl
                      pokemon={attacker}
                      setPokemon={setAttacker}
                      statName="speed"
                      label="Spe"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">Select Move</label>
                  <select
                    className={`w-full p-2 rounded border mt-1 ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-300'}`}
                    onChange={(e) => {
                      const move = attacker.moves.find((m) => m.name === e.target.value) || null;
                      setAttacker({ ...attacker, selectedMove: move });
                    }}
                    value={attacker.selectedMove?.name || ''}
                  >
                    <option value="">-- Select a Move --</option>
                    {attacker.moves.map((m, i) => (
                      <option key={`${m.name}-${i}`} value={m.name}>
                        {m.name} ({m.type}) - Pwr: {m.power}
                      </option>
                    ))}
                  </select>
                </div>

                {attacker.selectedMove && (
                  <div
                    className={`p-3 rounded border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}
                  >
                    <div className="flex justify-between text-sm">
                      <span>
                        Type:{' '}
                        <span
                          className="capitalize font-bold"
                          style={{ color: TYPE_COLORS[attacker.selectedMove.type] }}
                        >
                          {attacker.selectedMove.type}
                        </span>
                      </span>
                      <span>Power: {attacker.selectedMove.power}</span>
                      <span>
                        Class:{' '}
                        <span className="capitalize">{attacker.selectedMove.damageClass}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Defender Column */}
          <div
            className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}
          >
            <h3 className="text-lg font-bold mb-4 text-red-400 flex justify-between items-center">
              Defender
              {defender && (
                <button
                  onClick={() => setShowDefenderStats(!showDefenderStats)}
                  className="text-xs font-normal underline opacity-70 hover:opacity-100"
                >
                  {showDefenderStats ? 'Hide Stats' : 'Edit Stats'}
                </button>
              )}
            </h3>

            {!defender ? (
              <div className="relative z-20">
                <input
                  type="text"
                  placeholder="Search Defender..."
                  className={`w-full p-3 rounded bg-transparent border focus:outline-none focus:border-red-500 ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}
                  value={defenderSearch}
                  onChange={(e) => setDefenderSearch(e.target.value)}
                />
                {filteredDefenderList.length > 0 && (
                  <div
                    className={`absolute top-full left-0 w-full z-10 rounded-b shadow-xl max-h-60 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                  >
                    {filteredDefenderList.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 hover:bg-red-900/20 cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setDefenderId(p.id);
                          setDefenderSearch('');
                        }}
                      >
                        <img src={p.imageUrl} className="w-8 h-8" />
                        <span>{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img src={defender.imageUrl} className="w-20 h-20" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold capitalize">{defender.name}</h4>
                      <button
                        onClick={() => setDefender(null)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {defender.types.map((t) => (
                        <TypeBadge key={t} type={t} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold">Level</label>
                    <input
                      type="number"
                      value={defender.level}
                      onChange={(e) =>
                        setDefender({ ...defender, level: parseInt(e.target.value) || 1 })
                      }
                      className={`w-full p-2 rounded border mt-1 ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-300'}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold">Nature</label>
                    <select
                      value={defender.nature}
                      onChange={(e) => setDefender({ ...defender, nature: e.target.value })}
                      className={`w-full p-2 rounded border mt-1 ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-300'}`}
                    >
                      {Object.keys(NATURES).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold">Ability</label>
                    <select
                      value={defender.selectedAbility}
                      onChange={(e) =>
                        setDefender({ ...defender, selectedAbility: e.target.value })
                      }
                      className={`w-full p-2 rounded border mt-1 ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-300'}`}
                    >
                      {defender.abilities.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {showDefenderStats && (
                  <div
                    className={`p-3 rounded space-y-2 animate-in fade-in slide-in-from-top-2 ${theme === 'dark' ? 'bg-black/20' : 'bg-slate-100'}`}
                  >
                    <StatControl
                      pokemon={defender}
                      setPokemon={setDefender}
                      statName="hp"
                      label="HP"
                    />
                    <StatControl
                      pokemon={defender}
                      setPokemon={setDefender}
                      statName="attack"
                      label="Atk"
                    />
                    <StatControl
                      pokemon={defender}
                      setPokemon={setDefender}
                      statName="defense"
                      label="Def"
                    />
                    <StatControl
                      pokemon={defender}
                      setPokemon={setDefender}
                      statName="special-attack"
                      label="SpA"
                    />
                    <StatControl
                      pokemon={defender}
                      setPokemon={setDefender}
                      statName="special-defense"
                      label="SpD"
                    />
                    <StatControl
                      pokemon={defender}
                      setPokemon={setDefender}
                      statName="speed"
                      label="Spe"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section - Fixed at Bottom */}
      <div
        className={`p-6 border-t flex-shrink-0 ${theme === 'dark' ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'} rounded-b-2xl`}
      >
        {result ? (
          <div className="text-center space-y-4">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-black text-primary-400 mb-2">
                {result.min} - {result.max}
              </div>
              <p className="text-slate-400 text-sm uppercase font-bold tracking-wider">
                Damage Range ({result.rolls.length} rolls)
              </p>
            </div>

            <div className="w-full bg-gray-700 h-8 rounded-full overflow-hidden relative max-w-lg mx-auto mt-4 ring-2 ring-white/10">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 absolute left-0 top-0 transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(result.maxPercent.toString()), 100)}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md z-10">
                {result.minPercent}% - {result.maxPercent}% HP
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {result.modifiers.stab && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-200'}`}
                >
                  STAB
                </span>
              )}
              {result.modifiers.typeEffectiveness > 1 && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${theme === 'dark' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-red-100 text-red-700 border-red-200'}`}
                >
                  Super Effective (x{result.modifiers.typeEffectiveness})
                </span>
              )}
              {result.modifiers.typeEffectiveness < 1 && result.modifiers.typeEffectiveness > 0 && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${theme === 'dark' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-100 text-orange-700 border-orange-200'}`}
                >
                  Not Effective (x{result.modifiers.typeEffectiveness})
                </span>
              )}
              {result.modifiers.typeEffectiveness === 0 && (
                <span className="bg-gray-500/20 text-gray-300 px-3 py-1 rounded-full text-xs font-bold border border-gray-500/30">
                  Immune (x0)
                </span>
              )}
              {result.modifiers.item > 1 && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${theme === 'dark' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200'}`}
                >
                  Item Boost (x{result.modifiers.item})
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-4">
            <p>Select both Pokemon and a Move to calculate damage.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DamageCalculator;
