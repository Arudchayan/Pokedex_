import React from 'react';
import { usePokemonUI } from '../../context/PokemonContext';

export type DailyGameState = 'playing' | 'won' | 'lost';

interface DailyGameShellProps {
  title: string;
  /** Tailwind gradient stops, e.g. `from-indigo-500 to-purple-500` */
  titleGradient: string;
  date: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Extra classes for the content column (default centers content). */
  contentClassName?: string;
}

/** Shared chrome for daily guess games: themed frame + back/title/date header. */
export const DailyGameShell: React.FC<DailyGameShellProps> = ({
  title,
  titleGradient,
  date,
  onClose,
  children,
  contentClassName = 'flex-1 w-full max-w-lg flex flex-col items-center',
}) => {
  const { theme } = usePokemonUI();

  return (
    <div
      className={`flex flex-col h-full w-full items-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
    >
      <div className="flex justify-between items-center mb-6 w-full">
        <button onClick={onClose} className="text-sm font-bold opacity-70 hover:opacity-100">
          ← Back
        </button>
        <h2
          className={`text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${titleGradient}`}
        >
          {title}
        </h2>
        <div className="text-sm font-mono opacity-50">{date}</div>
      </div>

      <div className={contentClassName}>{children}</div>
    </div>
  );
};

export const DailyGameAttempts: React.FC<{ attempts: number; maxAttempts: number }> = ({
  attempts,
  maxAttempts,
}) => (
  <div className="text-center mb-2 font-bold opacity-70">
    Attempts: {attempts}/{maxAttempts}
  </div>
);

interface DailyGameResultBannerProps {
  gameState: 'won' | 'lost';
  imageUrl: string;
  name: string;
  imageClassName?: string;
}

export const DailyGameResultBanner: React.FC<DailyGameResultBannerProps> = ({
  gameState,
  imageUrl,
  name,
  imageClassName = 'w-32 h-32',
}) => (
  <div
    className={`p-6 rounded-xl text-center w-full ${gameState === 'won' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'} border-2`}
  >
    <h3 className="text-2xl font-black mb-2">
      {gameState === 'won' ? 'Correct!' : 'Game Over!'}
    </h3>
    <div className="flex flex-col items-center gap-4">
      <img src={imageUrl} className={imageClassName} alt={name} />
      <div className="text-xl font-bold capitalize">{name}</div>
    </div>
  </div>
);
