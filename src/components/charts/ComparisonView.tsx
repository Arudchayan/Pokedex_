import React, { useMemo } from 'react';
import { PokemonListItem } from '../../types';
import TypeBadge from './TypeBadge';
import { TYPE_COLORS_HEX, TYPE_RELATIONS, STAT_COLORS } from '../../constants';
import { usePokemon } from '../../context/PokemonContext';
import { useToast } from '../../context/ToastContext';
import RadarChart from './RadarChart';
import Modal from '../base/Modal';

interface ComparisonViewProps {
  pokemon: PokemonListItem[];
  onClose: () => void;
  onRemove: (id: number) => void;
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
};

const TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

const ComparisonView: React.FC<ComparisonViewProps> = ({ pokemon, onClose, onRemove }) => {
  const { theme } = usePokemon();
  const { addToast } = useToast();

  // Calculate max stat for bar scaling (base 255 is approx max for HP, others lower)
  const MAX_STAT = 255;

  if (!pokemon || pokemon.length === 0) {
    return null;
  }

  const handleShare = async () => {
    try {
      const ids = pokemon.map((p) => p.id).join(',');
      const url = new URL(window.location.href);
      url.searchParams.set('compare', ids);
      await navigator.clipboard.writeText(url.toString());
      addToast('Comparison link copied to clipboard!', 'success');
    } catch (err) {
      addToast('Failed to copy link.', 'error');
    }
  };

  // Calculate Weakness/Resistance for a Pokemon
  const getDefensiveEffectiveness = (p: PokemonListItem, attackType: string) => {
    let multiplier = 1;
    // Iterate over defender's types
    p.types.forEach((defenderType) => {
      // Check if the attack type has a relation defined against this defender type
      const relation = TYPE_RELATIONS[attackType];
      if (relation && defenderType in relation) {
        multiplier *= relation[defenderType];
      }
    });
    return multiplier;
  };

  const renderEffectiveness = (value: number) => {
    if (value === 1)
      return (
        <span className={`font-medium ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}>
          -
        </span>
      );
    if (value === 0)
      return (
        <span className={`font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          0
        </span>
      );

    let colorClass = '';
    if (value > 1) colorClass = 'text-red-500 font-bold';
    if (value < 1) colorClass = 'text-green-500 font-bold';

    return <span className={colorClass}>{value}x</span>;
  };

  const radarDatasets = pokemon
    .map((p) => {
      const primaryType = p.types[0];
      const color = TYPE_COLORS_HEX[primaryType] || '#A8A878';
      return {
        label: p.name,
        color: color,
        stats: p.stats || [],
      };
    })
    .filter((d) => d.stats.length > 0);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Pokemon Comparison"
      size="full"
      headerActions={
        <button
          onClick={handleShare}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30'
              : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
          }`}
          title="Share Comparison"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span className="hidden sm:inline">Share</span>
        </button>
      }
    >
      <div className="space-y-8 pb-20">
        {/* Header / Avatars */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pokemon.map((p) => {
            const primaryType = p.types[0];
            return (
              <div
                key={p.id}
                className={`relative rounded-xl border p-4 text-center transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-primary-200'}`}
              >
                <button
                  onClick={() => onRemove(p.id)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'bg-black/40 hover:bg-red-500/80 text-white' : 'bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600'}`}
                  aria-label={`Remove ${p.name}`}
                  title="Remove from comparison"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-24 h-24 mx-auto object-contain drop-shadow-lg"
                />
                <h3
                  className={`font-bold capitalize truncate mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                >
                  {p.name}
                </h3>
                <div className="flex justify-center gap-1 mt-2 flex-wrap">
                  {p.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Base Stats Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <h3
                className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
              >
                Base Stats
              </h3>
              <div
                className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
              >
                Base Values
              </div>
            </div>
            <div
              className={`overflow-x-auto rounded-xl border ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-white'}`}
            >
              <table className="w-full text-sm text-left">
                <thead
                  className={`text-xs uppercase ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}
                >
                  <tr>
                    <th
                      className={`px-4 py-3 sticky left-0 z-10 backdrop-blur-md ${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'}`}
                    >
                      Stat
                    </th>
                    {pokemon.map((p) => (
                      <th key={p.id} className="px-4 py-3 min-w-[100px] capitalize text-center">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}
                >
                  {['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map(
                    (statKey) => (
                      <tr
                        key={statKey}
                        className={`transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                      >
                        <td
                          className={`px-4 py-3 font-medium sticky left-0 z-10 backdrop-blur-md ${theme === 'dark' ? 'bg-slate-900/80 text-slate-300' : 'bg-white/80 text-slate-600'}`}
                        >
                          {STAT_LABELS[statKey]}
                        </td>
                        {pokemon.map((p) => {
                          const statVal = p.stats?.find((s) => s.name === statKey)?.value || 0;
                          const percent = (statVal / MAX_STAT) * 100;
                          const colorClass = STAT_COLORS[statKey]?.bar || 'bg-slate-500';

                          return (
                            <td
                              key={`${p.id}-${statKey}`}
                              className="px-4 py-3 text-center align-middle"
                            >
                              <div
                                className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                              >
                                {statVal}
                              </div>
                              <div
                                className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}
                              >
                                <div
                                  className={`h-full ${colorClass}`}
                                  style={{ width: `${Math.min(percent, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    )
                  )}
                  {/* Total */}
                  <tr className={`font-bold ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <td
                      className={`px-4 py-3 sticky left-0 z-10 backdrop-blur-md ${theme === 'dark' ? 'bg-slate-900/80 text-white' : 'bg-white/80 text-slate-800'}`}
                    >
                      BST
                    </td>
                    {pokemon.map((p) => {
                      const total = p.stats?.reduce((acc, s) => acc + s.value, 0) || 0;
                      return (
                        <td key={p.id} className="px-4 py-3 text-center text-primary-500">
                          {total}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <h3
                className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
              >
                Stat Balance
              </h3>
            </div>
            {radarDatasets.length > 0 ? (
              <div
                className={`p-6 rounded-xl border flex justify-center items-center flex-col h-full min-h-[400px] ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}
              >
                <RadarChart datasets={radarDatasets} theme={theme} width={350} height={350} />
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {radarDatasets.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: d.color }}
                      ></div>
                      <span
                        className={`text-xs font-bold capitalize ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
                      >
                        {d.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`p-6 rounded-xl border flex justify-center items-center h-[400px] ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}
              >
                No stats available for chart
              </div>
            )}
          </div>
        </div>

        {/* Type Effectiveness Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h3
              className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
            >
              Defensive Coverage
            </h3>
            <div
              className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
            >
              Multipliers when attacked by...
            </div>
          </div>
          <div
            className={`overflow-x-auto rounded-xl border ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-white'}`}
          >
            <table className="w-full text-sm text-left">
              <thead
                className={`text-xs uppercase ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}
              >
                <tr>
                  <th
                    className={`px-4 py-3 sticky left-0 z-10 backdrop-blur-md ${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'}`}
                  >
                    Attacker
                  </th>
                  {pokemon.map((p) => (
                    <th key={p.id} className="px-4 py-3 min-w-[100px] capitalize text-center">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}
              >
                {TYPES.map((type) => (
                  <tr
                    key={type}
                    className={`transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                  >
                    <td
                      className={`px-4 py-2 font-medium sticky left-0 z-10 backdrop-blur-md flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'}`}
                    >
                      <TypeBadge type={type} size="sm" />
                    </td>
                    {pokemon.map((p) => {
                      const effectiveness = getDefensiveEffectiveness(p, type);
                      return (
                        <td key={`${p.id}-${type}`} className="px-4 py-2 text-center align-middle">
                          {renderEffectiveness(effectiveness)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ComparisonView;
