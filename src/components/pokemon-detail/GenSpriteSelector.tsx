import React from 'react';
import { SpriteSet } from '../../types';

interface GenSpriteSelectorProps {
    theme: string;
    genSprites: Record<string, SpriteSet>;
    selectedGen: string | null;
    onSelectGen: (gen: string | null) => void;
}

const GenSpriteSelector: React.FC<GenSpriteSelectorProps> = ({
    theme,
    genSprites,
    selectedGen,
    onSelectGen,
}) => {
    const generations = Object.keys(genSprites);

    if (generations.length === 0) return null;

    return (
        <div className="mt-4">
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Sprite Style
            </p>
            <div className="flex flex-wrap gap-1.5">
                <button
                    onClick={() => onSelectGen(null)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all border ${selectedGen === null
                            ? 'bg-primary-500 border-primary-400 text-white shadow-lg shadow-primary-500/30'
                            : theme === 'dark'
                                ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                : 'bg-black/5 border-black/5 text-slate-600 hover:bg-black/10'
                        }`}
                >
                    Modern
                </button>
                {generations.map((gen) => (
                    <button
                        key={gen}
                        onClick={() => onSelectGen(gen)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all border ${selectedGen === gen
                                ? 'bg-primary-500 border-primary-400 text-white shadow-lg shadow-primary-500/30'
                                : theme === 'dark'
                                    ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                    : 'bg-black/5 border-black/5 text-slate-600 hover:bg-black/10'
                            }`}
                    >
                        {gen}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GenSpriteSelector;
