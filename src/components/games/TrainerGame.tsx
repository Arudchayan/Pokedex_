import React, { useState, useEffect, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { TRAINERS, Trainer } from '../../data/trainers';
import { mulberry32, pickRandom } from '../../utils/seededRandom';
import { fetchPokemonDetails } from '../../services/pokeapiService';

interface Props {
    onClose: () => void;
    date: string;
    seed: number;
}

const TrainerGame: React.FC<Props> = ({ onClose, date, seed }) => {
    const { theme } = usePokemon();
    const [target, setTarget] = useState<Trainer | null>(null);
    const [teamDetails, setTeamDetails] = useState<any[]>([]); // URLs/Names of pokemon
    const [revealedCount, setRevealedCount] = useState(1);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [currentGuess, setCurrentGuess] = useState('');
    const [searchList, setSearchList] = useState<Trainer[]>([]);

    // Flatten trainer list for search
    const allTrainers = TRAINERS;

    const rng = useMemo(() => mulberry32(seed), [seed]);

    useEffect(() => {
        const init = async () => {
            const t = pickRandom(allTrainers, rng);
            setTarget(t);

            // Fetch team sprites
            const teamData = await Promise.all(t.team.map(async (id) => {
                try {
                    const details = await fetchPokemonDetails(id);
                    return details;
                } catch {
                    return null;
                }
            }));
            setTeamDetails(teamData);
            setRevealedCount(1);
        };
        init();
    }, [rng]);

    const handleSearch = (term: string) => {
        setCurrentGuess(term);
        if (term.length < 1) {
            setSearchList([]);
            return;
        }
        const filtered = allTrainers
            .filter(t => t.name.toLowerCase().includes(term.toLowerCase()))
            .slice(0, 5);
        setSearchList(filtered);
    };

    const submitGuess = (trainer: Trainer) => {
        if (gameState !== 'playing' || !target) return;

        if (trainer.id === target.id) {
            setGameState('won');
        } else {
            // Wrong guess reveals another pokemon
            if (revealedCount < target.team.length) {
                setRevealedCount(prev => prev + 1);
            } else {
                setGameState('lost');
            }
        }
        setCurrentGuess('');
        setSearchList([]);
    };

    if (!target || teamDetails.length === 0) return <div className="text-center p-8">Loading TrainerDle...</div>;

    const score = Math.max(0, 100 - ((revealedCount - 1) * 15));

    return (
        <div className={`flex flex-col h-full w-full items-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6 w-full">
                <button onClick={onClose} className="text-sm font-bold opacity-70 hover:opacity-100">← Back</button>
                <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-black">TrainerDle</h2>
                <div className="text-sm font-mono opacity-50">{date}</div>
            </div>

            <div className="flex-1 w-full max-w-lg flex flex-col items-center">

                {/* Team Display */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {target.team.map((_, index) => {
                        const isRevealed = index < revealedCount || gameState !== 'playing';
                        const pokemon = teamDetails[index];
                        return (
                            <div key={index} className={`w-20 h-20 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all ${isRevealed ? 'bg-white border-red-500' : 'bg-slate-800 border-slate-700'}`}>
                                {isRevealed && pokemon ? (
                                    <img src={pokemon.imageUrl} className="w-16 h-16 object-contain" />
                                ) : (
                                    <span className="text-2xl font-bold opacity-20">?</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-slate-500/10 p-4 rounded-xl mb-8 text-center">
                    <p className="font-bold">{target.region} Region</p>
                    <p className="text-sm opacity-70">{target.class}</p>
                </div>

                {gameState === 'playing' ? (
                    <div className="w-full relative">
                        <div className="text-center mb-2 font-bold opacity-70">Guess the Trainer</div>
                        <input
                            type="text"
                            value={currentGuess}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Who is this trainer?"
                            className={`w-full p-4 rounded-xl font-bold text-lg outline-none border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 focus:border-red-500' : 'bg-white border-slate-200 focus:border-red-500'}`}
                        />
                        {searchList.length > 0 && (
                            <div className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                                {searchList.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => submitGuess(t)}
                                        className={`w-full p-3 flex items-center gap-3 hover:bg-red-500/20 text-left`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs">
                                            {t.name[0]}
                                        </div>
                                        <span className="font-bold capitalize">{t.name}</span>
                                        <span className="text-xs opacity-50 ml-auto">{t.class}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`p-6 rounded-xl text-center w-full ${gameState === 'won' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'} border-2`}>
                        <h3 className="text-2xl font-black mb-2">{gameState === 'won' ? 'Correct!' : 'Game Over!'}</h3>
                        <div className="text-4xl font-black uppercase mb-2">{target.name}</div>
                        <div className="text-xl font-bold text-green-500">Score: {score}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerGame;
