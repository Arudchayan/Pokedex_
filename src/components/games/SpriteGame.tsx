import React, { useState, useEffect, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { PokemonListItem } from '../../types';
import { mulberry32, pickRandom } from '../../utils/seededRandom';

interface Props {
  onClose: () => void;
  date: string;
  seed: number;
}

const SpriteGame: React.FC<Props> = ({ onClose, date, seed }) => {
  const { masterPokemonList, theme } = usePokemon();
  const [target, setTarget] = useState<PokemonListItem | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [searchList, setSearchList] = useState<PokemonListItem[]>([]);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;

  const rng = useMemo(() => mulberry32(seed), [seed]);

  useEffect(() => {
    if (masterPokemonList.length > 0) {
      setTarget(pickRandom(masterPokemonList, rng));
    }
  }, [masterPokemonList, rng]);

  // Pixelation/Blur intensity based on attempts
  // 0 attempts: High blur/pixelation
  // 4 attempts: Almost clear
  const blurAmount = Math.max(0, 20 - attempts * 4);

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
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setGameState('lost');
      }
    }
    setCurrentGuess('');
    setSearchList([]);
  };

  if (!target) return <div className="text-center p-8">Loading SpriteDle...</div>;

  // Use official artwork for better quality to blur
  const officialArtUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${target.id}.png`;

  return (
    <div
      className={`flex flex-col h-full w-full items-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
    >
      <div className="flex justify-between items-center mb-6 w-full">
        <button onClick={onClose} className="text-sm font-bold opacity-70 hover:opacity-100">
          ← Back
        </button>
        <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">
          SpriteDle
        </h2>
        <div className="text-sm font-mono opacity-50">{date}</div>
      </div>

      <div className="flex-1 w-full max-w-lg flex flex-col items-center">
        <div className="relative w-64 h-64 mb-8 flex items-center justify-center bg-white rounded-xl shadow-inner border p-4">
          <img
            src={officialArtUrl}
            className="w-full h-full object-contain transition-all duration-500"
            style={{
              filter: gameState === 'playing' ? `blur(${blurAmount}px)` : 'none',
              transform: gameState === 'playing' ? `scale(${1 + attempts * 0.1})` : 'scale(1)',
              imageRendering: 'pixelated',
            }}
          />
        </div>

        {gameState === 'playing' ? (
          <div className="w-full relative">
            <div className="text-center mb-2 font-bold opacity-70">
              Attempts: {attempts}/{MAX_ATTEMPTS}
            </div>

            <div className="flex justify-center mb-4">
              <button
                onClick={() => setAttempts((a) => a + 1)}
                className="px-4 py-1 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-green-500 hover:text-white rounded-full transition-colors font-bold uppercase"
              >
                Enhance Image (+1 Attempt)
              </button>
            </div>

            <input
              type="text"
              value={currentGuess}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Identify the sprite"
              className={`w-full p-4 rounded-xl font-bold text-lg outline-none border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 focus:border-green-500' : 'bg-white border-slate-200 focus:border-green-500'}`}
            />
            {searchList.length > 0 && (
              <div
                className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
              >
                {searchList.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => submitGuess(p)}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-green-500/20 text-left`}
                  >
                    <img src={p.imageUrl} className="w-8 h-8" />
                    <span className="font-bold capitalize">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`p-6 rounded-xl text-center w-full ${gameState === 'won' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'} border-2`}
          >
            <h3 className="text-2xl font-black mb-2">
              {gameState === 'won' ? 'Correct!' : 'Game Over!'}
            </h3>
            <div className="flex flex-col items-center gap-4">
              <div className="text-xl font-bold capitalize">{target.name}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpriteGame;
