import React, { useState, useMemo } from 'react';
import { PokemonMove } from '../../types';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import TypeBadge from '../charts/TypeBadge';

interface MoveListProps {
  moves: PokemonMove[];
  onOpenMoveDex?: (search?: string) => void;
}

type SortKey = keyof PokemonMove | 'level';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const DamageClassIcon: React.FC<{ damageClass: string }> = ({ damageClass }) => {
  const classMap: { [key: string]: { icon: string; color: string; title: string } } = {
    physical: { icon: '👊', color: 'text-orange-400', title: 'Physical' },
    special: { icon: '🌀', color: 'text-blue-400', title: 'Special' },
    status: { icon: '🛡️', color: 'text-slate-400', title: 'Status' },
  };
  const { icon, color, title } = classMap[damageClass] || classMap.status;
  return (
    <span className={`${color} text-lg`} title={title} role="img" aria-label={title}>
      {icon}
    </span>
  );
};

const SortableHeader: React.FC<{
  title: string;
  sortKey: SortKey;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
}> = ({ title, sortKey, sortConfig, onSort }) => {
  const isSorted = sortConfig.key === sortKey;
  const directionIcon = sortConfig.direction === 'asc' ? '▲' : '▼';
  const ariaSort = !isSorted ? 'none' : sortConfig.direction === 'asc' ? 'ascending' : 'descending';

  return (
    <th className="p-0" aria-sort={ariaSort}>
      <button
        type="button"
        className="w-full h-full p-2 sm:p-3 text-left text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/10 cursor-pointer select-none"
        onClick={() => onSort(sortKey)}
      >
        {title}
        {isSorted && <span className="text-primary-300">{directionIcon}</span>}
      </button>
    </th>
  );
};

const MoveList: React.FC<MoveListProps> = ({ moves, onOpenMoveDex }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'level', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  const groupedMoves = useMemo(() => {
    return moves.reduce(
      (acc, move) => {
        const key =
          move.learnMethod === 'level up'
            ? 'Level Up'
            : move.learnMethod === 'machine'
              ? 'Machine'
              : move.learnMethod === 'egg'
                ? 'Egg'
                : 'Other';
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(move);
        return acc;
      },
      {} as Record<string, PokemonMove[]>
    );
  }, [moves]);

  const learnMethods = useMemo(
    () => ['Level Up', 'Machine', 'Egg', 'Other'].filter((method) => groupedMoves[method]),
    [groupedMoves]
  );
  const [activeTab, setActiveTab] = useState(learnMethods[0] || '');

  const movesForActiveTab = groupedMoves[activeTab] || [];

  const filteredMoves = useMemo(() => {
    return movesForActiveTab.filter(
      (move) =>
        move.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        move.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [movesForActiveTab, searchQuery]);

  const sortedMoves = useMemo(() => {
    if (!filteredMoves) return [];
    const sortableMoves = [...filteredMoves];
    sortableMoves.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableMoves;
  }, [filteredMoves, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Reset sort when changing tabs for a better user experience
    setSortConfig({ key: 'level', direction: 'asc' });
  };

  if (moves.length === 0) {
    return <p className="text-slate-400 text-center p-4">This Pokémon has no moves listed.</p>;
  }

  return (
    <div className="bg-black/10 rounded-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between border-b border-white/10 px-2 pt-2 gap-2">
        <div className="flex overflow-x-auto">
          {learnMethods.map((method) => (
            <button
              key={method}
              onClick={() => handleTabChange(method)}
              className={`px-3 py-2 text-sm sm:text-base font-bold capitalize transition-colors rounded-t-md whitespace-nowrap
                            ${
                              activeTab === method
                                ? 'bg-black/20 border-b-2 border-primary-300 text-white'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            }`}
            >
              {method}
            </button>
          ))}
        </div>
        <div className="pb-2 sm:pb-0">
          <input
            type="text"
            aria-label="Search moves"
            placeholder="Search moves..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxLength={MAX_INPUT_LENGTH}
            className="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 w-full sm:w-48"
          />
        </div>
      </div>
      <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-black/20">
            <tr>
              <SortableHeader
                title="Lvl"
                sortKey="level"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                title="Move"
                sortKey="name"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                title="Type"
                sortKey="type"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
                Cat.
              </th>
              <SortableHeader
                title="Pow"
                sortKey="power"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                title="Acc"
                sortKey="accuracy"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                title="PP"
                sortKey="pp"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              {activeTab === 'Other' && (
                <SortableHeader
                  title="Method"
                  sortKey="learnMethod"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sortedMoves.map((move, index) => (
              <tr key={`${move.name}-${index}`} className="hover:bg-white/5 transition-colors">
                <td className="p-2 sm:p-3 whitespace-nowrap text-sm font-semibold text-slate-200">
                  {move.level > 0 ? move.level : '-'}
                </td>
                <td className="p-2 sm:p-3 whitespace-nowrap text-sm font-bold capitalize">
                  <button
                    onClick={() => onOpenMoveDex?.(move.name)}
                    className="hover:underline hover:text-primary-400 text-left w-full"
                  >
                    {move.name}
                  </button>
                </td>
                <td className="p-2 sm:p-3 whitespace-nowrap">
                  <TypeBadge type={move.type} />
                </td>
                <td className="p-2 sm:p-3 whitespace-nowrap text-center">
                  <DamageClassIcon damageClass={move.damageClass} />
                </td>
                <td className="p-2 sm:p-3 whitespace-nowrap text-sm">{move.power ?? '—'}</td>
                <td className="p-2 sm:p-3 whitespace-nowrap text-sm">{move.accuracy ?? '—'}</td>
                <td className="p-2 sm:p-3 whitespace-nowrap text-sm">{move.pp}</td>
                {activeTab === 'Other' && (
                  <td className="p-2 sm:p-3 whitespace-nowrap text-xs sm:text-sm capitalize text-slate-400">
                    {move.learnMethod}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MoveList;
