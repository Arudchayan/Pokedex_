import React, { useState, useEffect, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { fetchAllItems, Item } from '../../services/pokeapiService';
import { mulberry32, pickRandom } from '../../utils/seededRandom';

interface Props {
  onClose: () => void;
  date: string;
  seed: number;
}

const ItemGame: React.FC<Props> = ({ onClose, date, seed }) => {
  const { theme } = usePokemon();
  const [items, setItems] = useState<Item[]>([]);
  const [target, setTarget] = useState<Item | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [searchList, setSearchList] = useState<Item[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const MAX_ATTEMPTS = 5;

  const rng = useMemo(() => mulberry32(seed), [seed]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allItems = await fetchAllItems();
        if (allItems.length > 0) {
          setItems(allItems);
          setTarget(pickRandom(allItems, rng));
        } else {
          setError('Failed to load items. Please check your connection.');
        }
      } catch (e) {
        setError('An error occurred while loading items.');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [rng]);

  const handleSearch = (term: string) => {
    setCurrentGuess(term);
    if (term.length < 2) {
      setSearchList([]);
      return;
    }
    const filtered = items
      .filter((i) => i.name.replaceAll('-', ' ').toLowerCase().includes(term.toLowerCase()))
      .slice(0, 5);
    setSearchList(filtered);
  };

  const submitGuess = (item: Item) => {
    if (gameState !== 'playing' || !target) return;

    if (item.id === target.id) {
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

  if (error) {
    return (
      <div
        className={`text-center p-8 flex flex-col items-center justify-center h-full ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
      >
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-500 text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  if (isLoading || !target)
    return (
      <div className={`text-center p-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
        Loading ItemDle...
      </div>
    );

  // Hint: Cost and Obfuscated Flavor Text
  const costHint = `Cost: ${target.cost} ₽`;
  // const flavorHint = target.flavorText.replace(new RegExp(target.name.replace('-', ' '), 'gi'), '???');
  // Item names in flavor text might not be 1:1, usually simple regex works

  return (
    <div
      className={`flex flex-col h-full w-full items-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
    >
      <div className="flex justify-between items-center mb-6 w-full">
        <button onClick={onClose} className="text-sm font-bold opacity-70 hover:opacity-100">
          ← Back
        </button>
        <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          ItemDle
        </h2>
        <div className="text-sm font-mono opacity-50">{date}</div>
      </div>

      <div className="flex-1 w-full max-w-lg flex flex-col items-center">
        <div className="relative w-32 h-32 mb-8 flex items-center justify-center bg-white/10 rounded-xl border border-white/20">
          {/* Zoom/Blur Effect */}
          <div className="w-full h-full overflow-hidden rounded-xl flex items-center justify-center">
            <img
              src={target.imageUrl}
              className="w-16 h-16 object-contain rendering-pixelated"
              style={{
                transform: gameState === 'playing' ? `scale(${3 - attempts * 0.4})` : 'scale(1)',
                filter: gameState === 'playing' ? `blur(${5 - attempts}px)` : 'none',
              }}
            />
          </div>
        </div>

        <div className="bg-slate-500/10 p-4 rounded-xl mb-8 text-center max-w-xs">
          <p className="font-bold mb-2">{costHint}</p>
          <p className="text-sm italic opacity-70">"{target.flavorText}"</p>
        </div>

        {gameState === 'playing' ? (
          <div className="w-full relative">
            <div className="text-center mb-2 font-bold opacity-70">
              Attempts: {attempts}/{MAX_ATTEMPTS}
            </div>
            <input
              type="text"
              value={currentGuess}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="What item is this?"
              className={`w-full p-4 rounded-xl font-bold text-lg outline-none border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500'}`}
            />
            {searchList.length > 0 && (
              <div
                className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
              >
                {searchList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => submitGuess(item)}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-blue-500/20 text-left`}
                  >
                    <img src={item.imageUrl} className="w-8 h-8" />
                    <span className="font-bold capitalize">{item.name.replace('-', ' ')}</span>
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
              <img src={target.imageUrl} className="w-24 h-24" />
              <div className="text-xl font-bold capitalize">{target.name.replace('-', ' ')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemGame;
