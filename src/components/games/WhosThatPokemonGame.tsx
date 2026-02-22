import React, { useState, useEffect, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { useAchievements } from '../../context/AchievementContext';
import { useGameStats } from '../../hooks/useGameStats';
import { PokemonListItem } from '../../types';
import { mulberry32, pickRandom } from '../../utils/seededRandom';

interface Props {
    onClose: () => void;
    date: string;
    seed: number;
}

const WhosThatPokemonGame: React.FC<Props> = ({ onClose, date, seed }) => {
    const { masterPokemonList, theme } = usePokemon();
    const [target, setTarget] = useState<PokemonListItem | null>(null);
    const [options, setOptions] = useState<PokemonListItem[]>([]);
    const [revealed, setRevealed] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [guessState, setGuessState] = useState<'playing' | 'correct' | 'wrong'>('playing');
    const [hintRevealed, setHintRevealed] = useState(false);

    const { unlockAchievement } = useAchievements();
    const { recordResult, getStats } = useGameStats();
    const stats = getStats('whosthat');

    const rng = useMemo(() => mulberry32(seed), [seed]);

    useEffect(() => {
        if (masterPokemonList.length < 4) return;

        // Pick target using seeded RNG
        const t = pickRandom(masterPokemonList, rng);
        setTarget(t);

        // Pick 3 distractors using seeded RNG (subsequent calls)
        const distractors: PokemonListItem[] = [];
        const usedIds = new Set([t.id]);

        // Just loop to find 3 unique distractors
        let attempts = 0;
        while (distractors.length < 3 && attempts < 100) {
            const d = pickRandom(masterPokemonList, rng);
            if (!usedIds.has(d.id)) {
                distractors.push(d);
                usedIds.add(d.id);
            }
            attempts++;
        }

        // Shuffle options
        const allOptions = [t, ...distractors];
        // Determinisitc shuffle using the same RNG
        for (let i = allOptions.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
        }

        setOptions(allOptions);
        setRevealed(false);
        setHintRevealed(false);
        setGuessState('playing');
        setSelectedOption(null);

    }, [masterPokemonList, rng]);

    const handleGuess = (id: number) => {
        if (revealed || !target) return;

        setSelectedOption(id);
        setRevealed(true);
        if (id === target.id) {
            setGuessState('correct');
            unlockAchievement('quiz_master');
            recordResult('whosthat', true);
        } else {
            setGuessState('wrong');
            recordResult('whosthat', false);
        }
    };

    if (!target) return <div className="text-center p-8">Loading Who's That Pokemon...</div>;

    // Use official artwork for the silhouette if possible, as it's cleaner
    // But ListItem has showdown/icon usually. Let's try to construct official art URL
    const officialArtUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${target.id}.png`;

    return (
        <div className={`flex flex-col h-full w-full items-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6 w-full">
                <button onClick={onClose} className="text-sm font-bold opacity-70 hover:opacity-100">← Back</button>
                <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500">Who's That Pokemon?</h2>
                <div className="flex flex-col items-end">
                    <div className="text-sm font-mono opacity-50">{date}</div>
                    {stats.currentStreak > 0 && (
                        <div className="text-xs font-bold text-orange-500 animate-pulse">Streak: {stats.currentStreak} 🔥</div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                <div className="relative w-72 h-72 mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-20" style={{ backgroundImage: 'url(https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png)' }}></div>
                    <img
                        src={officialArtUrl}
                        className={`w-full h-full object-contain transition-all duration-1000 ${revealed ? 'brightness-100 drop-shadow-2xl scale-110' : 'brightness-0 contrast-200 opacity-100'}`}
                        alt="Who's that Pokemon?"
                        style={{ filter: revealed ? 'none' : 'brightness(0)' }}
                    />
                </div>

                {/* Hint Button */}
                {!revealed && !hintRevealed && (
                    <button
                        onClick={() => setHintRevealed(true)}
                        className="mb-6 px-4 py-2 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/50 rounded-full text-xs font-bold uppercase hover:bg-yellow-500/30 transition-all"
                    >
                        Need a Hint?
                    </button>
                )}

                {hintRevealed && !revealed && (
                    <div className="mb-6 flex gap-2 animate-fade-in">
                        {target.types.map(t => (
                            <span key={t} className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-500 text-white">
                                {t}
                            </span>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 w-full">
                    {options.map(opt => {
                        let btnClass = "";
                        if (revealed) {
                            if (opt.id === target.id) btnClass = "bg-green-500 text-white border-green-400";
                            else if (opt.id === selectedOption) btnClass = "bg-red-500 text-white border-red-400";
                            else btnClass = theme === 'dark' ? "bg-white/5 opacity-50" : "bg-slate-100 opacity-50";
                        } else {
                            btnClass = theme === 'dark'
                                ? "bg-white/10 hover:bg-primary-500 hover:text-white border-white/10"
                                : "bg-slate-100 hover:bg-primary-500 hover:text-white border-slate-200";
                        }

                        return (
                            <button
                                key={opt.id}
                                onClick={() => handleGuess(opt.id)}
                                disabled={revealed}
                                className={`p-4 rounded-xl font-bold capitalize text-lg transition-all transform active:scale-95 border-2 ${btnClass}`}
                            >
                                {opt.name}
                            </button>
                        );
                    })}
                </div>

                {revealed && (
                    <div className={`mt-8 text-xl font-bold ${guessState === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                        {guessState === 'correct' ? "It's " + target.name + "!" : "It was " + target.name + "!"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhosThatPokemonGame;
