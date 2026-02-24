import React, { useState, useEffect, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { fetchAllMoves, Move } from '../../services/pokeapiService';
import { mulberry32, pickRandom } from '../../utils/seededRandom';

interface Props {
  onClose: () => void;
  date: string;
  seed: number;
}

interface GuessResult {
  move: Move;
  correct: boolean;
  attributes: {
    type: 'correct' | 'wrong';
    category: 'correct' | 'wrong';
    power: 'up' | 'down' | 'correct';
    accuracy: 'up' | 'down' | 'correct';
    pp: 'up' | 'down' | 'correct';
  };
}

const MoveGame: React.FC<Props> = ({ onClose, date, seed }) => {
  const { theme } = usePokemon();
  const [moves, setMoves] = useState<Move[]>([]);
  const [target, setTarget] = useState<Move | null>(null);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [searchList, setSearchList] = useState<Move[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const rng = useMemo(() => mulberry32(seed), [seed]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allMoves = await fetchAllMoves();
        // Filter out obscure Z-moves or Max moves if possible, but for now take common ones
        // Filter by ID < 800 roughly or based on name
        const validMoves = allMoves.filter((m) => m.power !== null && m.accuracy !== null);
        setMoves(validMoves);

        if (validMoves.length > 0) {
          setTarget(pickRandom(validMoves, rng));
        } else {
          setError('Failed to load moves. Please check your connection.');
        }
      } catch (e) {
        setError('An error occurred while loading moves.');
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
    const filtered = moves
      .filter((m) => m.name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 5);
    setSearchList(filtered);
  };

  const submitGuess = (move: Move) => {
    if (!target || gameState !== 'playing') return;

    // Prevent duplicate guesses
    if (guesses.some((g) => g.move.id === move.id)) return;

    const result: GuessResult = {
      move: move,
      correct: move.id === target.id,
      attributes: {
        type: move.type === target.type ? 'correct' : 'wrong',
        category: move.category === target.category ? 'correct' : 'wrong',
        power: compareNum(target.power || 0, move.power || 0),
        accuracy: compareNum(target.accuracy || 0, move.accuracy || 0),
        pp: compareNum(target.pp, move.pp),
      },
    };

    setGuesses([result, ...guesses]);
    setSearchList([]);
    setCurrentGuess('');

    if (result.correct) {
      setGameState('won');
    } else if (guesses.length >= 5) {
      setGameState('lost');
    }
  };

  const compareNum = (target: number, guess: number): 'up' | 'down' | 'correct' => {
    if (guess === target) return 'correct';
    return guess < target ? 'up' : 'down';
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
        Loading MoveDle...
      </div>
    );

  return (
    <div
      className={`flex flex-col h-full w-full ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
    >
      <div className="flex justify-between items-center mb-6">
        <button onClick={onClose} className="text-sm font-bold opacity-70 hover:opacity-100">
          ← Back
        </button>
        <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">
          MoveDle
        </h2>
        <div className="text-sm font-mono opacity-50">{date}</div>
      </div>

      {gameState === 'playing' && (
        <div className="relative mb-6 z-20">
          <input
            type="text"
            value={currentGuess}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Guess a move..."
            className={`w-full p-4 rounded-xl font-bold text-lg outline-none border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 focus:border-red-500' : 'bg-white border-slate-200 focus:border-red-500'}`}
          />
          {searchList.length > 0 && (
            <div
              className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              {searchList.map((m) => (
                <button
                  key={m.id}
                  onClick={() => submitGuess(m)}
                  className={`w-full p-3 flex items-center justify-between hover:bg-red-500/20 text-left border-b border-white/5`}
                >
                  <span className="font-bold capitalize">{m.name.replace('-', ' ')}</span>
                  <span className="text-xs opacity-50 uppercase">{m.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {gameState !== 'playing' && (
        <div
          className={`p-6 rounded-xl text-center mb-6 ${gameState === 'won' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'} border-2`}
        >
          <h3 className="text-2xl font-black mb-2">{gameState === 'won' ? 'Hit!' : 'Missed!'}</h3>
          <div className="text-xl font-bold capitalize">{target.name.replace('-', ' ')}</div>
        </div>
      )}

      {/* Header Row */}
      <div className="grid grid-cols-6 gap-2 text-center text-xs font-bold opacity-50 uppercase mb-2">
        <div className="col-span-1">Move</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-1">Category</div>
        <div className="col-span-1">Power</div>
        <div className="col-span-1">Accuracy</div>
        <div className="col-span-1">PP</div>
      </div>

      {/* Guesses */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {guesses.map((g, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 h-14 animate-fade-in-up">
            <div className="col-span-1 flex items-center justify-center bg-black/10 rounded-lg border border-white/5 text-xs font-bold capitalize">
              {g.move.name.replace('-', ' ')}
            </div>

            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border text-[10px] font-bold capitalize ${g.attributes.type === 'correct' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.move.type}
            </div>

            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border text-[10px] font-bold capitalize ${g.attributes.category === 'correct' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.move.category}
            </div>

            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border font-bold ${g.attributes.power === 'correct' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.move.power || '-'}
              {g.attributes.power === 'up' && '↑'}
              {g.attributes.power === 'down' && '↓'}
            </div>

            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border font-bold ${g.attributes.accuracy === 'correct' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.move.accuracy || '-'}
              {g.attributes.accuracy === 'up' && '↑'}
              {g.attributes.accuracy === 'down' && '↓'}
            </div>

            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border font-bold ${g.attributes.pp === 'correct' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.move.pp}
              {g.attributes.pp === 'up' && '↑'}
              {g.attributes.pp === 'down' && '↓'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoveGame;
