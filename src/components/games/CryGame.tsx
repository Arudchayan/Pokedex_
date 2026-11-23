import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePokemonData, usePokemonUI } from '../../context/PokemonContext';
import { PokemonListItem } from '../../types';
import { mulberry32, pickRandom } from '../../utils/seededRandom';
import { DailyGameAttempts, DailyGameResultBanner, DailyGameShell } from './DailyGameShell';
import { useGameStats } from '../../hooks/useGameStats';

interface Props {
  onClose: () => void;
  date: string;
  seed: number;
}

const CryGame: React.FC<Props> = ({ onClose, date, seed }) => {
  const { masterPokemonList } = usePokemonData();
  const { theme } = usePokemonUI();
  const { recordResult } = useGameStats();
  const [target, setTarget] = useState<PokemonListItem | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [searchList, setSearchList] = useState<PokemonListItem[]>([]);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const rng = useMemo(() => mulberry32(seed), [seed]);

  useEffect(() => {
    if (masterPokemonList.length > 0) {
      // Need a pokemon that likely has a cry (most do up to gen 9)
      // Cries format: https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/{id}.ogg
      setTarget(pickRandom(masterPokemonList, rng));
    }
  }, [masterPokemonList, rng]);

  const [isPlaying, setIsPlaying] = useState(false);

  const playCry = () => {
    if (!target) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(
      `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${target.id}.ogg`
    );
    audio.volume = 0.5;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);

    audio.play().catch((e) => console.error('Audio play failed', e));
    audioRef.current = audio;
  };

  const handleSearch = (term: string) => {
    setCurrentGuess(term);
    if (term.length < 2) {
      setSearchList([]);
      return;
    }
    const filtered = masterPokemonList
      .filter((p) => p.name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 5);
    setSearchList(filtered);
  };

  const submitGuess = (pokemon: PokemonListItem) => {
    if (gameState !== 'playing' || !target) return;

    if (pokemon.id === target.id) {
      setGameState('won');
      recordResult('cry', true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setGameState('lost');
        recordResult('cry', false);
      }
    }
    setCurrentGuess('');
    setSearchList([]);
  };

  if (!target) return <div className="text-center p-8">Loading CryDle...</div>;

  return (
    <DailyGameShell
      title="CryDle"
      titleGradient="from-indigo-500 to-purple-500"
      date={date}
      onClose={onClose}
      contentClassName="flex-1 w-full max-w-lg flex flex-col items-center justify-center"
    >
      <button
        onClick={playCry}
        className={`w-40 h-40 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 mb-8 group ${isPlaying ? 'bg-indigo-400 scale-105 shadow-indigo-500/80' : 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/50'}`}
      >
        {isPlaying ? (
          <div className="flex gap-1 items-end h-12">
            <div
              className="w-2 bg-white animate-bounce"
              style={{ animationDuration: '0.4s' }}
            ></div>
            <div
              className="w-2 bg-white animate-bounce"
              style={{ animationDuration: '0.6s' }}
            ></div>
            <div
              className="w-2 bg-white animate-bounce"
              style={{ animationDuration: '0.3s' }}
            ></div>
            <div
              className="w-2 bg-white animate-bounce"
              style={{ animationDuration: '0.5s' }}
            ></div>
          </div>
        ) : (
          <svg
            className="w-20 h-20 text-white group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        )}
      </button>
      <p className="mb-8 opacity-70 font-bold">{isPlaying ? 'Playing...' : 'Tap to play sound'}</p>

      {gameState === 'playing' ? (
        <div className="w-full relative">
          <DailyGameAttempts attempts={attempts} maxAttempts={MAX_ATTEMPTS} />
          <input
            type="text"
            value={currentGuess}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Whose cry is this?"
            className={`w-full p-4 rounded-xl font-bold text-lg outline-none border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`}
          />
          {searchList.length > 0 && (
            <div
              className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              {searchList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => submitGuess(p)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-indigo-500/20 text-left`}
                >
                  <img src={p.imageUrl} className="w-8 h-8" />
                  <span className="font-bold capitalize">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <DailyGameResultBanner
          gameState={gameState}
          imageUrl={target.imageUrl}
          name={target.name}
        />
      )}
    </DailyGameShell>
  );
};

export default CryGame;
