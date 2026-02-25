import React, { useMemo, useState } from 'react';
import { PokemonMove } from '../../types';
import MoveList from '../dex/MoveList';

interface MovesSectionProps {
  theme: string;
  moves: PokemonMove[];
  isExpanded: boolean;
  onToggle: () => void;
  onOpenMoveDex?: (search?: string) => void;
}

const MovesSection: React.FC<MovesSectionProps> = ({
  theme,
  moves,
  isExpanded,
  onToggle,
  onOpenMoveDex,
}) => {
  const [selectedVersionGroup, setSelectedVersionGroup] = useState<string>('all');

  const versionGroups = useMemo(() => {
    const set = new Set<string>();
    moves.forEach((m) => {
      if (m.versionGroup) set.add(m.versionGroup);
    });
    return Array.from(set).sort();
  }, [moves]);

  const filteredMoves = useMemo(
    () =>
      selectedVersionGroup === 'all'
        ? moves
        : moves.filter((m) => !m.versionGroup || m.versionGroup === selectedVersionGroup),
    [moves, selectedVersionGroup]
  );

  return (
    <div className="mt-8">
      <button
        type="button"
        className={`w-full text-left flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
          theme === 'dark' ? 'bg-black/10 hover:bg-white/5' : 'bg-slate-100 hover:bg-slate-200'
        }`}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls="moves-list"
      >
        <h3
          className={`text-xl font-bold ${theme === 'dark' ? 'text-primary-300' : 'text-primary-600'}`}
        >
          Moves
        </h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 transition-transform ${isExpanded ? 'rotate-180' : ''} ${
            theme === 'dark' ? 'text-primary-300' : 'text-primary-600'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div id="moves-list" className="mt-4 space-y-3">
          {versionGroups.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => setSelectedVersionGroup('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  selectedVersionGroup === 'all'
                    ? 'bg-primary-500/30 text-primary-200 border border-primary-400/60'
                    : theme === 'dark'
                      ? 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                All Games
              </button>
              {versionGroups.map((vg) => (
                <button
                  key={vg}
                  type="button"
                  onClick={() => setSelectedVersionGroup(vg)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                    selectedVersionGroup === vg
                      ? 'bg-primary-500/30 text-primary-200 border border-primary-400/60'
                      : theme === 'dark'
                        ? 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {vg}
                </button>
              ))}
            </div>
          )}

          <MoveList moves={filteredMoves} onOpenMoveDex={onOpenMoveDex} />
        </div>
      )}
    </div>
  );
};

export default MovesSection;
