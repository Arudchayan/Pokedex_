import React, { useState, useEffect, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { PokemonListItem, PokemonDetails } from '../../types';
import { mulberry32, pickRandom } from '../../utils/seededRandom';
import { fetchPokemonDetails } from '../../services/pokeapiService';

interface Props {
    onClose: () => void;
    date: string;
    seed: number;
}

const FlavorGame: React.FC<Props> = ({ onClose, date, seed }) => {
    const { masterPokemonList, theme } = usePokemon();
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
                // Pick a random pokemon
                let tBase = pickRandom(masterPokemonList, rng);

                // Fetch details to ensure we have flavor text
                try {
                    let details = await fetchPokemonDetails(tBase.id);
                    let tries = 0;
                    // Ensure it has flavor text
                    while ((!details?.flavorText || details.flavorText.length < 10) && tries < 20) {
                        tBase = pickRandom(masterPokemonList, rng);
                        details = await fetchPokemonDetails(tBase.id);
                        tries++;
                    }
                    setTarget(details);
                } catch (e) {
                    console.error("Error fetching flavor text target", e);
                }
            }
        };
        init();
    }, [masterPokemonList, rng]);

    // Obfuscate the flavor text by replacing the pokemon name
    const flavorText = useMemo(() => {
        if (!target) return '';
        const name = target.name.toLowerCase();
        // Simple replacement of name in text
        const regex = new RegExp(name, 'gi');
        return target.flavorText.replace(regex, 'POKEMON');
    }, [target]);

    const handleSearch = (term: string) => {
        setCurrentGuess(term);
        if (term.length < 2) {
            setSearchList([]);
            return;
        }
        const filtered = masterPokemonList
            .filter(p => p.name.toLowerCase().includes(term.toLowerCase()))
            .slice(0, 5);
        setSearchList(filtered);
    };

    const handleHint = () => {
        setHintRevealed(true);
        setAttempts(prev => prev + 1);
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

    if (!target) return <div className="text-center p-8">Loading FlavorDle...</div>;

    return (
        <div className={`flex flex-col h-full w-full items-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6 w-full">
                <button onClick={onClose} className="text-sm font-bold opacity-70 hover:opacity-100">← Back</button>
                <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">FlavorDle</h2>
                <div className="text-sm font-mono opacity-50">{date}</div>
            </div>

            <div className="flex-1 w-full max-w-lg flex flex-col items-center">
                <div className={`p-8 rounded-2xl text-center text-xl font-serif italic mb-8 relative ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                    <span className="text-6xl absolute -top-4 -left-2 opacity-20">"</span>
                    {flavorText}
                    <span className="text-6xl absolute -bottom-8 -right-2 opacity-20">"</span>
                </div>

                {gameState === 'playing' ? (
                    <div className="w-full relative">
                        <div className="text-center mb-2 font-bold opacity-70">Attempts: {attempts}/{MAX_ATTEMPTS}</div>

                        {/* Hint Section */}
                        <div className="flex justify-center mb-4">
                            {hintRevealed ? (
                                <div className="px-4 py-2 bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/50 rounded-xl font-bold animate-fade-in">
                                    Hint: Starts with "{target.name[0].toUpperCase()}"
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleHint()}
                                    className="px-4 py-1 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-pink-500 hover:text-white rounded-full transition-colors font-bold uppercase"
                                >
                                    Reveal First Letter (+1 Attempt)
                                </button>
                            )}
                        </div>

                        <input
                            type="text"
                            value={currentGuess}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Who is described?"
                            className={`w-full p-4 rounded-xl font-bold text-lg outline-none border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 focus:border-pink-500' : 'bg-white border-slate-200 focus:border-pink-500'}`}
                        />
                        {searchList.length > 0 && (
                            <div className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                                {searchList.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => submitGuess(p)}
                                        className={`w-full p-3 flex items-center gap-3 hover:bg-pink-500/20 text-left`}
                                    >
                                        <img src={p.imageUrl} className="w-8 h-8" />
                                        <span className="font-bold capitalize">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`p-6 rounded-xl text-center w-full ${gameState === 'won' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'} border-2`}>
                        <h3 className="text-2xl font-black mb-2">{gameState === 'won' ? 'Correct!' : 'Game Over!'}</h3>
                        <div className="flex flex-col items-center gap-4">
                            <img src={target.imageUrl} className="w-32 h-32" />
                            <div className="text-xl font-bold capitalize">{target.name}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlavorGame;
