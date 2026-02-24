import React from 'react';
import { BattlePokemon } from '../../../utils/battle/types';
import { usePokemon } from '../../../context/PokemonContext';

interface Props {
  playerActive: BattlePokemon;
  enemyActive: BattlePokemon;
}

const HpBar: React.FC<{ current: number; max: number; label: string }> = ({
  current,
  max,
  label,
}) => {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));
  let color = 'bg-green-500';
  if (percent < 50) color = 'bg-yellow-500';
  if (percent < 20) color = 'bg-red-500';

  return (
    <div className="w-full mb-2">
      <div className="flex justify-between text-xs font-bold mb-1">
        <span>{label}</span>
        <span>{Math.ceil(percent)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-right text-[10px] opacity-70">
        {current}/{max}
      </div>
    </div>
  );
};

const BattleArena: React.FC<Props> = ({ playerActive, enemyActive }) => {
  const { theme } = usePokemon();

  return (
    <div
      className={`relative w-full aspect-video rounded-xl overflow-hidden border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
    >
      {/* Background (Simple Gradient) */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-200 to-green-200 dark:from-slate-700 dark:to-slate-800 opacity-50" />

      {/* Platform Player */}
      <div className="absolute bottom-4 left-8 text-center z-10">
        <img
          src={playerActive.spriteBack}
          className="w-32 h-32 md:w-48 md:h-48 object-contain pixelated animate-bounce-slow"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Platform Enemy */}
      <div className="absolute top-8 right-8 text-center z-10 transition-transform">
        <img
          src={enemyActive.spriteFront}
          className="w-24 h-24 md:w-40 md:h-40 object-contain pixelated"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* UI overlay for Stats */}
      <div className="absolute inset-0 p-4 pointer-events-none">
        {/* Enemy HUD */}
        <div className="absolute top-4 left-4 w-48 bg-white/80 dark:bg-black/50 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="font-bold text-sm capitalize">{enemyActive.name}</div>
          <div className="text-xs">Lvl {enemyActive.level}</div>
          <HpBar current={enemyActive.currentHp} max={enemyActive.maxHp} label="" />
          {enemyActive.status !== 'none' && (
            <span className="px-1 bg-purple-500 text-white text-[10px] rounded uppercase">
              {enemyActive.status}
            </span>
          )}
        </div>

        {/* Player HUD */}
        <div className="absolute bottom-8 right-4 w-48 bg-white/80 dark:bg-black/50 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="font-bold text-sm capitalize">{playerActive.name}</div>
          <div className="text-xs">Lvl {playerActive.level}</div>
          <HpBar current={playerActive.currentHp} max={playerActive.maxHp} label="HP" />
          {playerActive.status !== 'none' && (
            <span className="px-1 bg-purple-500 text-white text-[10px] rounded uppercase">
              {playerActive.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleArena;
