import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePokemonData, usePokemonUI } from '../../context/PokemonContext';
import { PokemonListItem, PokemonDetails } from '../../types';
import { mulberry32, pickRandom } from '../../utils/seededRandom';
import RadarChart from '../charts/RadarChart';
import { fetchPokemonDetailsQuery } from '../../services/pokemonDetailsQuery';
import { DailyGameAttempts, DailyGameResultBanner, DailyGameShell } from './DailyGameShell';

interface Props {
  onClose: () => void;
  date: string;
  seed: number;
}

const StatGame: React.FC<Props> = ({ onClose, date, seed }) => {
  const { masterPokemonList } = usePokemonData();
  const { theme } = usePokemonUI();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<PokemonDetails | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [searchList, setSearchList] = useState<PokemonListItem[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hintRevealed, setHintRevealed] = useState(false);
  const MAX_ATTEMPTS = 5;

  const rng = useMemo(() => mulberry32(seed), [seed]);

  useEffect(() => {
    const init = async () => {
      if (masterPokemonList.length > 0) {
        const tBase = pickRandom(masterPokemonList, rng);
        try {
          const details = await fetchPokemonDetailsQuery(queryClient, tBase.id);
          setTarget(details);
        } catch (e) {
          console.error('Failed to load stat game target', e);
        }
      }
    };
    init();
  }, [masterPokemonList, rng, queryClient]);

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

  const handleHint = () => {
    setHintRevealed(true);
    setAttempts((prev) => prev + 1);
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

  if (!target) return <div className="text-center p-8">Loading StatDle...</div>;

  // Prepare dataset for RadarChart
  const chartData = [
    {
      label: 'Base Stats',
      color: theme === 'dark' ? '#f97316' : '#ea580c', // Orange
      stats: target.stats,
    },
  ];

  return (
    <DailyGameShell
      title="StatDle"
      titleGradient="from-orange-400 to-red-500"
      date={date}
      onClose={onClose}
    >
      <div className="w-full h-64 mb-8 flex items-center justify-center">
        <RadarChart datasets={chartData} theme={theme} />
      </div>

      {gameState === 'playing' ? (
        <div className="w-full relative">
          <DailyGameAttempts attempts={attempts} maxAttempts={MAX_ATTEMPTS} />

          {/* Hint Section */}
          <div className="flex justify-center mb-4">
            {hintRevealed ? (
              <div className="px-4 py-2 bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/50 rounded-xl font-bold animate-fade-in text-sm flex gap-2">
                <span>Highest Stat:</span>
                <span className="uppercase">
                  {
                    target.stats.reduce((prev, current) =>
                      prev.value > current.value ? prev : current
                    ).name
                  }
                </span>
              </div>
            ) : (
              <button
                onClick={() => handleHint()}
                className="px-4 py-1 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-orange-500 hover:text-white rounded-full transition-colors font-bold uppercase"
              >
                Reveal Highest Stat (+1 Attempt)
              </button>
            )}
          </div>

          <input
            type="text"
            value={currentGuess}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Guess based on stats"
            className={`w-full p-4 rounded-xl font-bold text-lg outline-none border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 focus:border-orange-500' : 'bg-white border-slate-200 focus:border-orange-500'}`}
          />
          {searchList.length > 0 && (
            <div
              className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              {searchList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => submitGuess(p)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-orange-500/20 text-left`}
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

export default StatGame;
