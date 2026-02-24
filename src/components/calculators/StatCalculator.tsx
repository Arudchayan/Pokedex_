import React, { useState, useEffect, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { fetchPokemonDetails } from '../../services/pokeapiService';
import { NATURES } from '../../constants';
import { calculateStat } from '../../utils/damageFormula';
import Loader from '../shared/Loader';
import TypeBadge from '../charts/TypeBadge';
import { PokemonDetails } from '../../types';
import Modal from '../base/Modal';

interface StatCalculatorProps {
  onClose: () => void;
  initialPokemonId?: number | null;
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
};

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

const StatCalculator: React.FC<StatCalculatorProps> = ({ onClose, initialPokemonId }) => {
  const { masterPokemonList, theme } = usePokemon();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(initialPokemonId || null);
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Stats State
  const [level, setLevel] = useState(50);
  const [nature, setNature] = useState('Hardy');
  const [ivs, setIvs] = useState<Record<string, number>>({
    hp: 31,
    attack: 31,
    defense: 31,
    'special-attack': 31,
    'special-defense': 31,
    speed: 31,
  });
  const [evs, setEvs] = useState<Record<string, number>>({
    hp: 0,
    attack: 0,
    defense: 0,
    'special-attack': 0,
    'special-defense': 0,
    speed: 0,
  });

  // Fetch Pokemon Data
  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      fetchPokemonDetails(selectedId)
        .then((details) => {
          if (details) {
            setPokemon(details);
            // Reset to defaults on new pokemon
            setIvs({
              hp: 31,
              attack: 31,
              defense: 31,
              'special-attack': 31,
              'special-defense': 31,
              speed: 31,
            });
            setEvs({
              hp: 0,
              attack: 0,
              defense: 0,
              'special-attack': 0,
              'special-defense': 0,
              speed: 0,
            });
            setNature('Hardy');
            setLevel(50);
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

  // Calculations
  const results = useMemo(() => {
    if (!pokemon) return null;

    const calculated: Record<string, number> = {};
    const maxStats: Record<string, number> = {}; // Theoretical max for bar visualization

    STAT_ORDER.forEach((stat) => {
      const base = pokemon.stats.find((s) => s.name === stat)?.value || 0;
      calculated[stat] = calculateStat(stat, base, ivs[stat], evs[stat], level, nature);

      // Calculate generic max (Level 100, Max IV/EV, Positive Nature) for visualization scale
      // Approximation: ~500-600 is usually top tier max at lvl 100. At lvl 50 it's ~200-300.
      // We'll calculate a "reasonable max" based on level for the bar width.
      // Max possible at Lvl 100 is Blissey HP ~714 or Regieleki Speed ~548.
      // Let's use 700 as absolute max for bar scaling at Lvl 100, scaled by level.
      const scaleMax = Math.max(200, level * 7);
      maxStats[stat] = scaleMax;
    });

    return { values: calculated, maxes: maxStats };
  }, [pokemon, ivs, evs, level, nature]);

  // Handlers
  const handleStatChange = (type: 'iv' | 'ev', stat: string, val: string) => {
    const num = parseInt(val) || 0;
    const max = type === 'iv' ? 31 : 252;
    const clamped = Math.min(max, Math.max(0, num));

    if (type === 'iv') {
      setIvs((prev) => ({ ...prev, [stat]: clamped }));
    } else {
      setEvs((prev) => ({ ...prev, [stat]: clamped }));
    }
  };

  const applyPreset = (type: 'min' | 'max' | 'comp') => {
    if (type === 'min') {
      setIvs({ hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 });
      setEvs({ hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 });
    } else if (type === 'max') {
      setIvs({
        hp: 31,
        attack: 31,
        defense: 31,
        'special-attack': 31,
        'special-defense': 31,
        speed: 31,
      });
      setEvs({
        hp: 252,
        attack: 252,
        defense: 252,
        'special-attack': 252,
        'special-defense': 252,
        speed: 252,
      });
    } else if (type === 'comp') {
      // Standard sweeping spread
      setIvs({
        hp: 31,
        attack: 31,
        defense: 31,
        'special-attack': 31,
        'special-defense': 31,
        speed: 31,
      });
      setEvs({
        hp: 4,
        attack: 252,
        defense: 0,
        'special-attack': 0,
        'special-defense': 0,
        speed: 252,
      });
      setNature('Jolly');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Stat Calculator" size="lg">
      {/* Search */}
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Pokemon Header */}
          <div className="flex items-center gap-6 mb-8">
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
              <img src={pokemon.imageUrl} alt={pokemon.name} className="w-24 h-24 object-contain" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black capitalize mb-2">{pokemon.name}</h3>
                  <div className="flex gap-2">
                    {pokemon.types.map((t) => (
                      <TypeBadge key={t} type={t} />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPokemon(null);
                    setSelectedId(null);
                  }}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-slate-500 border-slate-300"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Global Controls */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200'}`}
          >
            <div>
              <label
                htmlFor="level-slider"
                className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500"
              >
                Level
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="level-slider"
                  type="range"
                  min="1"
                  max="100"
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="flex-1 accent-primary-500"
                  aria-label="Level slider"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={level}
                  onChange={(e) =>
                    setLevel(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                  className={`w-16 p-2 rounded text-center font-bold ${theme === 'dark' ? 'bg-black/30' : 'bg-white border'}`}
                  aria-label="Level value"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="nature-select"
                className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500"
              >
                Nature
              </label>
              <select
                id="nature-select"
                value={nature}
                onChange={(e) => setNature(e.target.value)}
                className={`w-full p-2 rounded font-medium ${theme === 'dark' ? 'bg-black/30 border-white/10' : 'bg-white border-slate-300 border'}`}
              >
                {Object.keys(NATURES).map((n) => (
                  <option key={n} value={n}>
                    {n}
                    {NATURES[n].up
                      ? ` (+${STAT_LABELS[NATURES[n].up || '']}, -${STAT_LABELS[NATURES[n].down || '']})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => applyPreset('max')}
              className="px-3 py-1 text-xs font-bold rounded bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors"
            >
              Max All (31/252)
            </button>
            <button
              onClick={() => applyPreset('min')}
              className="px-3 py-1 text-xs font-bold rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
            >
              Min All (0/0)
            </button>
            <button
              onClick={() => applyPreset('comp')}
              className="px-3 py-1 text-xs font-bold rounded bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white transition-colors"
            >
              Phys. Sweeper
            </button>
          </div>

          {/* Stats Table */}
          <div
            className={`overflow-hidden rounded-xl border ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
          >
            <div
              className={`grid grid-cols-[1fr_auto_auto_auto_1fr] gap-4 p-3 font-bold text-xs uppercase tracking-wider border-b ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
            >
              <div className="pl-2">Stat</div>
              <div className="w-12 text-center">Base</div>
              <div className="w-12 text-center">IV</div>
              <div className="w-12 text-center">EV</div>
              <div className="text-right pr-2">Total</div>
            </div>

            {STAT_ORDER.map((stat) => {
              const base = pokemon.stats.find((s) => s.name === stat)?.value || 0;
              const total = results?.values[stat] || 0;
              const max = results?.maxes[stat] || 1;
              const percent = Math.min(100, (total / max) * 100);

              // Check nature modifiers for color
              const natureData = NATURES[nature];
              const isUp = natureData?.up === stat;
              const isDown = natureData?.down === stat;

              return (
                <div
                  key={stat}
                  className={`grid grid-cols-[1fr_auto_auto_auto_1fr] gap-4 p-3 items-center border-b last:border-0 hover:bg-primary-500/5 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}
                >
                  <div className="font-bold pl-2 flex items-center gap-1">
                    {STAT_LABELS[stat]}
                    {isUp && <span className="text-green-400 text-[10px] ml-1">▲</span>}
                    {isDown && <span className="text-red-400 text-[10px] ml-1">▼</span>}
                  </div>

                  <div className="w-12 text-center text-sm text-slate-500 font-mono">{base}</div>

                  <div className="w-12">
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={ivs[stat]}
                      onChange={(e) => handleStatChange('iv', stat, e.target.value)}
                      className={`w-full text-center p-1 rounded text-sm ${theme === 'dark' ? 'bg-black/20 focus:bg-black/40' : 'bg-slate-100 focus:bg-white border-transparent focus:border-primary-500 border'}`}
                      aria-label={`${stat.replace('-', ' ')} IV`}
                    />
                  </div>

                  <div className="w-12">
                    <input
                      type="number"
                      min="0"
                      max="252"
                      step="4"
                      value={evs[stat]}
                      onChange={(e) => handleStatChange('ev', stat, e.target.value)}
                      className={`w-full text-center p-1 rounded text-sm ${theme === 'dark' ? 'bg-black/20 focus:bg-black/40' : 'bg-slate-100 focus:bg-white border-transparent focus:border-primary-500 border'}`}
                      aria-label={`${stat.replace('-', ' ')} EV`}
                    />
                  </div>

                  <div className="flex items-center gap-3 justify-end pr-2">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-[100px] hidden sm:block">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isUp ? 'bg-green-500' : isDown ? 'bg-orange-500' : 'bg-primary-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span
                      className={`text-lg font-bold w-12 text-right ${isUp ? 'text-green-500' : isDown ? 'text-orange-500' : ''}`}
                      aria-label={`Total ${stat.replace('-', ' ')}`}
                    >
                      {total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-xs text-center text-slate-500">
            * Stats calculated using standard Gen 3+ formulas.
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StatCalculator;
