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

  const groupedGens = generations.reduce<Record<string, string[]>>((acc, gen) => {
    const match = gen.match(/^Gen (\d)/);
    const group = match ? `Generation ${match[1]}` : 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(gen);
    return acc;
  }, {});

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <label
          htmlFor="sprite-style-select"
          className={`text-[10px] font-bold uppercase tracking-wider opacity-60 whitespace-nowrap ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
        >
          Sprite Style
        </label>
        <div className="relative flex-1 max-w-xs">
          <select
            id="sprite-style-select"
            value={selectedGen ?? ''}
            onChange={handleSelectChange}
            className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none pr-8 ${
              selectedGen
                ? theme === 'dark'
                  ? 'bg-primary-500/15 border-primary-400/40 text-primary-300'
                  : 'bg-primary-50 border-primary-300 text-primary-700'
                : theme === 'dark'
                  ? 'bg-slate-800 border-white/10 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="">Modern (Default)</option>
            {Object.entries(groupedGens).map(([group, gens]) => (
              <optgroup key={group} label={group}>
                {gens.map((gen) => (
                  <option key={gen} value={gen}>
                    {gen}
                  </option>
                ))}
              </optgroup>
            ))}
            <optgroup label="Special">
              {generations
                .filter((g) => !g.startsWith('Gen '))
                .map((gen) => (
                  <option key={gen} value={gen}>
                    {gen}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  );
};

export default GenSpriteSelector;
