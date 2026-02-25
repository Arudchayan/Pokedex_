import React, { useState, useEffect, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { useGameStats } from '../../hooks/useGameStats';
import { PokemonListItem, PokemonDetails } from '../../types';
import { fetchPokemonDetails } from '../../services/pokeapiService';
import { mulberry32, pickRandom } from '../../utils/seededRandom';

interface Props {
  onClose: () => void;
  date: string;
  seed: number;
}

interface GuessResult {
  pokemon: PokemonDetails;
  correct: boolean;
  attributes: {
    type1: 'correct' | 'wrong' | 'partial';
    type2: 'correct' | 'wrong' | 'partial';
    genDir: 'up' | 'down' | 'correct';
    heightDir: 'up' | 'down' | 'correct';
    weightDir: 'up' | 'down' | 'correct';
    colorMatch: boolean;
    habitatMatch: boolean;
    stageDir: 'up' | 'down' | 'correct';
  };
}

const PokedleGame: React.FC<Props> = ({ onClose, date, seed }) => {
  const { masterPokemonList, theme } = usePokemon();
  const [targetPokemon, setTargetPokemon] = useState<PokemonDetails | null>(null);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [searchList, setSearchList] = useState<PokemonListItem[]>([]);

  const { recordResult, getStats } = useGameStats();
  const stats = getStats('pokedle');

  // Seeded RNG
  const rng = useMemo(() => mulberry32(seed), [seed]);

  useEffect(() => {
    const init = async () => {
      if (masterPokemonList.length === 0) return;

      // Pick target
      const targetBasic = pickRandom(masterPokemonList, rng);
      try {
        const details = await fetchPokemonDetails(targetBasic.id);
        setTargetPokemon(details);
      } catch (e) {
        console.error('Failed to load target pokemon', e);
      }
    };
    init();
  }, [masterPokemonList, rng]);

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

  const getStage = (details: PokemonDetails): number => {
    if (!details.evolutionChain || details.evolutionChain.length === 0) return 1;

    // Find this pokemon in the chain
    const myEvo = details.evolutionChain.find((e) => e.id === details.id);
    if (!myEvo) return 1;

    if (!myEvo.evolvesFromId) return 1; // Basic

    // Find parent
    const parent = details.evolutionChain.find((e) => e.id === myEvo.evolvesFromId);
    if (!parent) return 2; // Should not happen if data is complete, assume stage 2

    if (!parent.evolvesFromId) return 2; // Parent is basic

    return 3; // Parent has a parent
  };

  const submitGuess = async (pokemonId: number) => {
    if (!targetPokemon || gameState !== 'playing') return;

    // Prevent duplicate guesses
    if (guesses.some((g) => g.pokemon.id === pokemonId)) return;

    try {
      const guessDetails = await fetchPokemonDetails(pokemonId);
      if (!guessDetails) return;

      // Compare attributes
      const targetGen = getGen(targetPokemon.id);
      const guessGen = getGen(guessDetails.id);

      const targetStage = getStage(targetPokemon);
      const guessStage = getStage(guessDetails);

      // Type Logic
      const targetT1 = targetPokemon.types[0];
      const targetT2 = targetPokemon.types[1] || 'none';
      const guessT1 = guessDetails.types[0];
      const guessT2 = guessDetails.types[1] || 'none';

      let t1Status: 'correct' | 'wrong' | 'partial' = 'wrong';
      let t2Status: 'correct' | 'wrong' | 'partial' = 'wrong';

      // Check Type 1
      if (guessT1 === targetT1) t1Status = 'correct';
      else if (guessT1 === targetT2) t1Status = 'partial';

      // Check Type 2
      if (guessT2 === targetT2) t2Status = 'correct';
      else if (guessT2 === targetT1 && guessT2 !== 'none') t2Status = 'partial';

      const result: GuessResult = {
        pokemon: guessDetails,
        correct: guessDetails.id === targetPokemon.id,
        attributes: {
          type1: t1Status,
          type2: t2Status,
          genDir: compareNum(targetGen, guessGen),
          heightDir: compareNum(targetPokemon.height, guessDetails.height),
          weightDir: compareNum(targetPokemon.weight, guessDetails.weight),
          colorMatch: targetPokemon.color === guessDetails.color,
          habitatMatch: targetPokemon.habitat === guessDetails.habitat,
          stageDir: compareNum(targetStage, guessStage),
        },
      };

      setGuesses([result, ...guesses]);
      setSearchList([]);
      setCurrentGuess('');

      if (result.correct) {
        setGameState('won');
        recordResult('pokedle', true);
      } else if (guesses.length >= 7) {
        setGameState('lost');
        recordResult('pokedle', false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getGen = (id: number) => {
    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    if (id <= 809) return 7;
    if (id <= 905) return 8;
    return 9;
  };

  const compareNum = (target: number, guess: number): 'up' | 'down' | 'correct' => {
    if (guess === target) return 'correct';
    return guess < target ? 'up' : 'down';
  };

  if (!targetPokemon) return <div className="p-8 text-center">Loading Pokedle...</div>;

  return (
    <div
      className={`flex flex-col h-full w-full ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onClose} className="text-sm font-bold opacity-70 hover:opacity-100">
          ← Back
        </button>
        <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
          Pokedle
        </h2>
        <div className="flex flex-col items-end">
          <div className="text-sm font-mono opacity-50">{date}</div>
          {stats.currentStreak > 0 && (
            <div className="text-xs font-bold text-orange-500 animate-pulse">
              Streak: {stats.currentStreak} 🔥
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      {gameState === 'playing' && (
        <div className="relative mb-6 z-20">
          <input
            type="text"
            value={currentGuess}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Guess a Pokemon..."
            className={`w-full p-4 rounded-xl font-bold text-lg outline-none border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 focus:border-cyan-500' : 'bg-white border-slate-200 focus:border-cyan-500'}`}
          />
          {searchList.length > 0 && (
            <div
              className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              {searchList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => submitGuess(p.id)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-cyan-500/20 text-left`}
                >
                  <img src={p.imageUrl} className="w-8 h-8" />
                  <span className="font-bold capitalize">{p.name}</span>
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
          <h3 className="text-2xl font-black mb-2">
            {gameState === 'won' ? 'You Caught It!' : 'It Got Away!'}
          </h3>
          <div className="flex flex-col items-center gap-4">
            <img src={targetPokemon.imageUrl} className="w-32 h-32 animate-bounce" />
            <div className="text-xl font-bold capitalize">{targetPokemon.name}</div>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
      <div className="grid grid-cols-9 gap-1 text-center text-[10px] font-bold opacity-50 uppercase mb-2 min-w-[500px]">
        <div className="col-span-1">Pokemon</div>
        <div className="col-span-1">Type 1</div>
        <div className="col-span-1">Type 2</div>
        <div className="col-span-1">Habitat</div>
        <div className="col-span-1">Stage</div>
        <div className="col-span-1">Gen</div>
        <div className="col-span-1">Height</div>
        <div className="col-span-1">Weight</div>
        <div className="col-span-1">Color</div>
      </div>

      {/* Guesses */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {guesses.map((g, i) => (
          <div key={i} className="grid grid-cols-9 gap-1 h-14 animate-fade-in-up min-w-[500px]">
            {/* Pokemon Icon */}
            <div className="col-span-1 flex items-center justify-center bg-black/10 rounded-lg border border-white/5">
              <img src={g.pokemon.imageUrl} className="w-8 h-8 object-contain" />
            </div>

            {/* Type 1 */}
            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border text-[10px] font-bold capitalize leading-none ${g.attributes.type1 === 'correct' ? 'bg-green-500 border-green-400' : g.attributes.type1 === 'partial' ? 'bg-yellow-500 border-yellow-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.pokemon.types[0]}
            </div>

            {/* Type 2 */}
            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border text-[10px] font-bold capitalize leading-none ${g.attributes.type2 === 'correct' ? 'bg-green-500 border-green-400' : g.attributes.type2 === 'partial' ? 'bg-yellow-500 border-yellow-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.pokemon.types[1] || 'none'}
            </div>

            {/* Habitat */}
            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border text-[10px] font-bold capitalize leading-none ${g.attributes.habitatMatch ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.pokemon.habitat || '-'}
            </div>

            {/* Stage */}
            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border font-bold ${g.attributes.stageDir === 'correct' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {getStage(g.pokemon)}
              {g.attributes.stageDir === 'up' && '↑'}
              {g.attributes.stageDir === 'down' && '↓'}
            </div>

            {/* Gen */}
            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border font-bold ${g.attributes.genDir === 'correct' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {getGen(g.pokemon.id)}
              {g.attributes.genDir === 'up' && '↑'}
              {g.attributes.genDir === 'down' && '↓'}
            </div>

            {/* Height */}
            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border font-bold ${g.attributes.heightDir === 'correct' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.pokemon.height}
              {g.attributes.heightDir === 'up' && '↑'}
              {g.attributes.heightDir === 'down' && '↓'}
            </div>

            {/* Weight */}
            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border font-bold ${g.attributes.weightDir === 'correct' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.pokemon.weight}
              {g.attributes.weightDir === 'up' && '↑'}
              {g.attributes.weightDir === 'down' && '↓'}
            </div>

            {/* Color */}
            <div
              className={`col-span-1 flex items-center justify-center rounded-lg border font-bold capitalize text-[10px] ${g.attributes.colorMatch ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}
            >
              {g.pokemon.color}
            </div>
          </div>
        ))}
      </div>
      </div>{/* end overflow-x-auto wrapper */}
    </div>
  );
};

export default PokedleGame;
