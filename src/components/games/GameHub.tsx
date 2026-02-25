import React, { useState, useEffect, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { useGameStats } from '../../hooks/useGameStats';
import { dateToSeed } from '../../utils/seededRandom';
import PokedleGame from './PokedleGame';
import WhosThatPokemonGame from './WhosThatPokemonGame';
import FlavorGame from './FlavorGame';
import CryGame from './CryGame';
import StatGame from './StatGame';
import MoveGame from './MoveGame';
import ItemGame from './ItemGame';
import TrainerGame from './TrainerGame';

const GameBadge = ({ id }: { id: string }) => null;

type GameType =
  | 'none'
  | 'pokedle'
  | 'whosthat'
  | 'flavor'
  | 'cry'
  | 'stat'
  | 'move'
  | 'item'
  | 'trainer'
  | 'battle';

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

interface GameHubProps {
  onClose: () => void;
}

const GameHub: React.FC<GameHubProps> = ({ onClose }) => {
  const { theme } = usePokemon();
  const { getStats, hasPlayedToday } = useGameStats();
  const [selectedGame, setSelectedGame] = useState<GameType>('none');

  // Date Management
  const [date, setDate] = useState(getTodayDateString());
  const seed = useMemo(() => dateToSeed(date), [date]);

  // Components Map
  const renderGame = () => {
    const props = { onClose: () => setSelectedGame('none'), date, seed };
    switch (selectedGame) {
      case 'pokedle':
        return <PokedleGame {...props} />;
      case 'whosthat':
        return <WhosThatPokemonGame {...props} />;
      case 'flavor':
        return <FlavorGame {...props} />;
      case 'cry':
        return <CryGame {...props} />;
      case 'stat':
        return <StatGame {...props} />;
      case 'move':
        return <MoveGame {...props} />;
      case 'item':
        return <ItemGame {...props} />;
      case 'trainer':
        return <TrainerGame {...props} />;
      default:
        return null;
    }
  };

  if (selectedGame !== 'none') {
    return (
      <div
        className={`fixed inset-0 z-[1050] flex flex-col ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}
      >
        <div className="flex-1 overflow-hidden p-4">{renderGame()}</div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[1050] flex items-center justify-center p-4 backdrop-blur-sm ${theme === 'dark' ? 'bg-black/80' : 'bg-slate-500/50'}`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl animate-fade-in-up ${theme === 'dark' ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2
              className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
            >
              Game Suite
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Play daily challenges!
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-black/5 text-slate-400 hover:text-slate-800'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Battle Button - Featured */}
          <button
            onClick={() =>
              window.open('https://play.pokemonshowdown.com/', '_blank', 'noopener,noreferrer')
            }
            className={`col-span-2 lg:col-span-3 p-4 sm:p-8 rounded-xl shadow-lg transition-all hover:scale-[1.01] flex flex-row items-center justify-between gap-3 sm:gap-6 overflow-hidden relative group ${theme === 'dark' ? 'bg-gradient-to-r from-red-900 to-slate-800 border-red-700' : 'bg-gradient-to-r from-red-100 to-slate-100 border-red-200'} border`}
          >
            <div className="flex flex-col items-start z-10 min-w-0">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-500 mb-1">
                External Link
              </span>
              <h3 className="font-black text-xl sm:text-3xl">Battle Simulator</h3>
              <p
                className={`text-xs sm:text-sm mt-1 sm:mt-2 max-w-md text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
              >
                Play on Pokémon Showdown!
              </p>
            </div>
            <div className="text-4xl sm:text-6xl animate-bounce-slow flex-shrink-0">⚔️</div>
            <div className="absolute right-4 bottom-4 opacity-50 text-xs">Opens in new tab ↗</div>
          </button>

          <button
            onClick={() => setSelectedGame('pokedle')}
            className={`relative p-4 sm:p-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2 sm:gap-3 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
          >
            <GameBadge id="pokedle" />
            <span className="text-3xl sm:text-4xl">🦋</span>
            <div className="text-center">
              <h3 className="font-bold text-sm sm:text-lg">Pokédle</h3>
              <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess the Pokémon properties
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedGame('whosthat')}
            className={`relative p-4 sm:p-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2 sm:gap-3 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
          >
            <GameBadge id="whosthat" />
            <span className="text-4xl">❓</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">Who's That Pokémon?</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Identify from silhouette
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedGame('flavor')}
            className={`relative p-4 sm:p-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2 sm:gap-3 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
          >
            <GameBadge id="flavor" />
            <span className="text-4xl">📜</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">FlavorDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess from Pokédex entry
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedGame('cry')}
            className={`relative p-4 sm:p-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2 sm:gap-3 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
          >
            <GameBadge id="cry" />
            <span className="text-4xl">🔊</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">CryDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Identify the Pokémon cry
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedGame('stat')}
            className={`relative p-4 sm:p-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2 sm:gap-3 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
          >
            <GameBadge id="stat" />
            <span className="text-4xl">📊</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">StatDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess from base stats
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedGame('move')}
            className={`relative p-4 sm:p-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2 sm:gap-3 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
          >
            <GameBadge id="move" />
            <span className="text-4xl">⚔️</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">MoveDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess the move attributes
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedGame('item')}
            className={`relative p-4 sm:p-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2 sm:gap-3 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
          >
            <GameBadge id="item" />
            <span className="text-4xl">🎒</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">ItemDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess the item
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedGame('trainer')}
            className={`relative p-4 sm:p-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2 sm:gap-3 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
          >
            <GameBadge id="trainer" />
            <span className="text-4xl">🧢</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">TrainerDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess the trainer team
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHub;
