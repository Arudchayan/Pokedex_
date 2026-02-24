import React from 'react';
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
}) => (
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
      <div id="moves-list" className="mt-4">
        <MoveList moves={moves} onOpenMoveDex={onOpenMoveDex} />
      </div>
    )}
  </div>
);

export default MovesSection;
