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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onSelectGen(val === '' ? null : val);
  };

  return (
    <div className="mt-4">
      <p
        className={`text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
      >
        Sprite Style
      </p>

      {/* Mobile: compact dropdown */}
      <div className="sm:hidden">
        <select
          value={selectedGen ?? ''}
          onChange={handleSelectChange}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none ${
            theme === 'dark'
              ? 'bg-slate-800 border-white/10 text-white'
              : 'bg-white border-slate-300 text-slate-900'
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
        >
          <option value="">Modern (Default)</option>
          {generations.map((gen) => (
            <option key={gen} value={gen}>
              {gen}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: pill buttons */}
      <div className="hidden sm:flex flex-wrap gap-1.5">
        <button
          onClick={() => onSelectGen(null)}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all border ${
            selectedGen === null
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
            className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all border ${
              selectedGen === gen
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
