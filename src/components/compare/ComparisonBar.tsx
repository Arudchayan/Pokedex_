import React from 'react';
import { useComparisonPokemon, usePokemonStore } from '../../store/usePokemonStore';
import { useModalStore } from '../../store/useModalStore';

const ComparisonBar: React.FC = () => {
  const comparisonPokemon = useComparisonPokemon();
  const openComparison = useModalStore((s) => s.openComparison);
  const clearComparison = usePokemonStore((s) => s.clearComparison);
  const theme = usePokemonStore((s) => s.theme);

  if (comparisonPokemon.length === 0) return null;

  return (
    <aside
      className={`fixed bottom-0 left-0 right-0 z-[100] border-t p-4 transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-slate-900/95 border-white/10 text-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)]'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]'
      } backdrop-blur-md`}
      aria-label="Comparison Bar"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-4">
            {comparisonPokemon.map((pokemon) => (
              <div
                key={pokemon.id}
                className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 transition-transform hover:z-10 hover:scale-110 ${
                  theme === 'dark' ? 'border-slate-800 bg-slate-800' : 'border-white bg-slate-100'
                }`}
                title={pokemon.name}
              >
                <img
                  src={pokemon.imageUrl}
                  alt={pokemon.name}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
          <div className="hidden sm:block">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="font-bold text-primary-500">{comparisonPokemon.length}</span> Pokemon selected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={clearComparison}
            className={`text-sm font-medium underline decoration-dotted transition-colors ${
              theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Clear All
          </button>
          <button
            onClick={openComparison}
            className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition-transform active:scale-95 ${
              theme === 'dark'
                ? 'bg-primary-500 text-white hover:bg-primary-400 shadow-primary-500/20'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/20'
            }`}
          >
            <span>Compare Now</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ComparisonBar;
