import React from 'react';
import { PokemonDetails, PokemonForm } from '../../types';
import TypeBadge from '../charts/TypeBadge';
import GenSpriteSelector from './GenSpriteSelector';

interface DetailHeaderProps {
  theme: string;
  pokemon: PokemonDetails;
  selectedForm: PokemonForm;
  primaryTypeHex: string;
  showShiny: boolean;
  onToggleShiny: () => void;
  onOpenDamageCalc?: () => void;
  onOpenCatchCalc?: () => void;
  onAddToTeam?: () => void;
  onRemoveFromTeam?: () => void;
  isInTeam: boolean;
  teamIsFull: boolean;
  megaForm: PokemonForm | null;
  isMegaEvolved: boolean;
  onMegaToggle: () => void;
  selectedGen: string | null;
  onSelectGen: (gen: string | null) => void;
}

const DetailHeader: React.FC<DetailHeaderProps> = ({
  theme,
  pokemon,
  selectedForm,
  primaryTypeHex,
  showShiny,
  onToggleShiny,
  onOpenDamageCalc,
  onOpenCatchCalc,
  onAddToTeam,
  onRemoveFromTeam,
  isInTeam,
  teamIsFull,
  megaForm,
  isMegaEvolved,
  onMegaToggle,
  selectedGen,
  onSelectGen,
}) => (
  <div className="relative p-4 sm:p-8 rounded-t-2xl overflow-hidden">
    <div
      className="absolute inset-0 opacity-30"
      style={{
        background: `radial-gradient(circle at 50% -20%, ${primaryTypeHex} 0%, transparent 60%)`,
      }}
    ></div>
    <img
      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemon.id}.svg`}
      className="absolute h-48 opacity-[0.07] right-8 top-1/2 -translate-y-1/2 pointer-events-none"
      alt=""
    />
    <div className="relative z-10">
      <p className={`text-lg sm:text-2xl font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
        #{String(pokemon.id).padStart(4, '0')}
      </p>
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <h2
          className={`text-3xl sm:text-5xl font-extrabold capitalize ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
        >
          {pokemon.name}
        </h2>
        <button
          onClick={onToggleShiny}
          className={`p-2 rounded-full transition-all duration-300 ${
            showShiny
              ? 'bg-yellow-400/30 text-yellow-300 scale-110'
              : theme === 'dark'
                ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                : 'bg-black/10 text-slate-600 hover:bg-black/20'
          }`}
          title="Toggle shiny"
          aria-label="Toggle shiny"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {onOpenDamageCalc && (
          <button
            onClick={onOpenDamageCalc}
            className={`p-2 rounded-full transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-white/10 text-purple-400 hover:bg-purple-500/20'
                : 'bg-black/10 text-purple-600 hover:bg-purple-500/10'
            }`}
            title="Open Damage Calculator"
            aria-label="Open Damage Calculator"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}
        {onOpenCatchCalc && (
          <button
            onClick={onOpenCatchCalc}
            className={`p-2 rounded-full transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-white/10 text-red-400 hover:bg-red-500/20'
                : 'bg-black/10 text-red-600 hover:bg-red-500/10'
            }`}
            title="Open Catch Rate Calculator"
            aria-label="Open Catch Rate Calculator"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </button>
        )}
        {(onAddToTeam || onRemoveFromTeam) && (
          <button
            onClick={isInTeam ? onRemoveFromTeam : onAddToTeam}
            disabled={!isInTeam && teamIsFull}
            className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-primary-400/60 ${
              isInTeam
                ? 'border border-red-400/60 bg-red-500/20 text-red-500 hover:bg-red-500/30'
                : 'border border-primary-400/60 bg-primary-500/20 text-primary-500 hover:bg-primary-500/30 disabled:cursor-not-allowed disabled:opacity-40'
            }`}
          >
            {isInTeam ? 'Remove from team' : teamIsFull ? 'Team full' : 'Add to team'}
          </button>
        )}
        {megaForm && (
          <button
            onClick={onMegaToggle}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition duration-300 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 3a1 1 0 011 1v1.586l.707-.707a1 1 0 011.414 1.414l-.707.707H14a1 1 0 110 2h-1.586l.707.707a1 1 0 01-1.414 1.414l-.707-.707V15a1 1 0 11-2 0v-1.586l-.707.707a1 1 0 01-1.414-1.414l.707-.707H6a1 1 0 110 2h1.586l-.707-.707a1 1 0 011.414-1.414l.707.707V4a1 1 0 011-1z" />
            </svg>
            {isMegaEvolved ? 'Revert Form' : 'Mega Evolve'}
          </button>
        )}
      </div>
      {teamIsFull && !isInTeam && onAddToTeam && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-red-400">
          Team is full. Remove a Pokemon before adding another.
        </p>
      )}
      <p
        className={`text-base sm:text-xl font-semibold mt-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-600'}`}
      >
        {pokemon.genus}
      </p>
      <div className="flex gap-2 mt-4">
        {selectedForm.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>

      {pokemon.genSprites && (
        <GenSpriteSelector
          theme={theme}
          genSprites={pokemon.genSprites}
          selectedGen={selectedGen}
          onSelectGen={onSelectGen}
        />
      )}
    </div>
  </div>
);

export default DetailHeader;
