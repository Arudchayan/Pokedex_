import React from 'react';
import { PokemonMove, PokemonStat } from '../../types';
import { getRecommendedMoves } from '../../utils/moveLogic';
import { usePokemon } from '../../context/PokemonContext';
import { TYPE_COLORS_HEX } from '../../constants';

interface MoveRecommenderProps {
  moves: PokemonMove[];
  stats: PokemonStat[];
  types: string[];
}

const MoveRecommender: React.FC<MoveRecommenderProps> = ({ moves, stats, types }) => {
  const { theme } = usePokemon();
  const recommendedMoves = getRecommendedMoves(moves, stats, types);

  if (recommendedMoves.length === 0) return null;

  return (
    <div className={`mt-6 p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
      <h4 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM17.414 10a1 1 0 10-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM14.657 14.243a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM11 15a1 1 0 10-2 0v1a1 1 0 102 0v-1zM5.343 14.243a1 1 0 001.414 1.414l.707.707a1 1 0 00-1.414-1.414l-.707-.707zM3.586 10a1 1 0 001.414 1.414l-.707.707a1 1 0 00-1.414-1.414l.707-.707zM6.343 5.757a1 1 0 001.414-1.414l-.707.707a1 1 0 00-1.414 1.414l.707-.707z" />
        </svg>
        Recommended Moveset
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendedMoves.map((move) => (
          <div
            key={move.name}
            className={`p-3 rounded-lg border flex flex-col justify-between ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="font-bold capitalize block text-lg">{move.name.replace('-', ' ')}</span>
                    <span className="text-xs opacity-70 capitalize">{move.damageClass}</span>
                </div>
                <span
                    className="px-2 py-1 rounded text-xs font-bold text-white uppercase"
                    style={{ backgroundColor: TYPE_COLORS_HEX[move.type] || '#777' }}
                >
                    {move.type}
                </span>
            </div>

            <div className="flex justify-between items-center text-sm mb-2">
                <span>Power: <b>{move.power}</b></span>
                <span>Acc: <b>{move.accuracy}%</b></span>
            </div>

            <div className="flex flex-wrap gap-1 mt-1">
                {move.reason.map((r, i) => (
                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${theme === 'dark' ? 'border-yellow-500/30 text-yellow-200 bg-yellow-500/10' : 'border-yellow-600/30 text-yellow-700 bg-yellow-100'}`}>
                        {r}
                    </span>
                ))}
            </div>
          </div>
        ))}
      </div>
      <p className={`text-xs mt-3 text-center opacity-60 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Based on base stats, STAB, and power.
      </p>
    </div>
  );
};

export default MoveRecommender;
