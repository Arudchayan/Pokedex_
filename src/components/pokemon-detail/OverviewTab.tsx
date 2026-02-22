import React from 'react';
import { PokemonDetails, PokemonForm } from '../../types';
import InfoPill from './InfoPill';
import DetailSection from './DetailSection';

export interface OverviewTabProps {
  pokemon: PokemonDetails;
  selectedForm: PokemonForm;
  theme: string;
  showShiny: boolean;
}

/**
 * OverviewTab Component
 * 
 * Displays basic Pokemon information including:
 * - Large Pokemon image
 * - Flavor text description
 * - Pokedex data (height, weight, color, shape, habitat)
 * - Abilities with clickable links
 * - Training information
 * - Breeding information with gender ratio
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  pokemon,
  selectedForm,
  theme,
  showShiny,
}) => {
  const renderGenderInfo = (rate: number) => {
    if (rate === -1) {
      return <span>Genderless</span>;
    }
    const femaleChance = (rate / 8) * 100;
    const maleChance = 100 - femaleChance;
    return (
      <div className="flex items-center">
        <span className="text-blue-400 font-bold text-sm">♂ {maleChance}%</span>
        <div className="w-full h-1.5 bg-pink-400/50 mx-2 rounded-full">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-300"
            style={{ width: `${maleChance}%` }}
          ></div>
        </div>
        <span className="text-pink-400 font-bold text-sm">♀ {femaleChance}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pokemon Image & Description */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              'flex justify-center items-center rounded-xl p-8',
              'h-80 relative overflow-hidden',
              'group',
              theme === 'dark' ? 'bg-black/10' : 'bg-slate-100'
            )}
          >
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-10 right-10 w-32 h-32 bg-primary-400 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
            </div>

            <img
              src={showShiny ? selectedForm.shinyImageUrl : selectedForm.imageUrl}
              alt={selectedForm.name}
              className="h-full object-contain drop-shadow-2xl transform transition-transform duration-300 group-hover:scale-110 relative z-10"
            />

            {/* Shiny indicator */}
            {showShiny && (
              <div className="absolute top-4 right-4 z-20">
                <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/50 rounded-full px-3 py-1.5">
                  <svg
                    className="w-4 h-4 text-yellow-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-semibold text-yellow-200">Shiny</span>
                </div>
              </div>
            )}
          </div>

          <p
            className={cn(
              'text-center italic p-4 rounded-lg leading-relaxed',
              theme === 'dark'
                ? 'text-slate-300 bg-black/10'
                : 'text-slate-600 bg-slate-100'
            )}
          >
            "{pokemon.flavorText}"
          </p>

          {/* Genus */}
          <div className="text-center">
            <span
              className={cn(
                'text-sm font-medium',
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              {pokemon.genus}
            </span>
          </div>
        </div>

        {/* Info Sections */}
        <div className="flex flex-col gap-6">
          <DetailSection title="Pokédex Data" theme={theme}>
            <div className="grid grid-cols-2 gap-3">
              <InfoPill
                label="Height"
                value={`${(selectedForm.height / 10).toFixed(1)} m`}
                theme={theme}
              />
              <InfoPill
                label="Weight"
                value={`${(selectedForm.weight / 10).toFixed(1)} kg`}
                theme={theme}
              />
              <InfoPill label="Color" value={pokemon.color} theme={theme} />
              <InfoPill label="Shape" value={pokemon.shape} theme={theme} />
              <InfoPill
                label="Habitat"
                value={pokemon.habitat || 'Unknown'}
                theme={theme}
              />
              <InfoPill
                label="Generation"
                value={`Gen ${Math.ceil(pokemon.id / 151)}`}
                theme={theme}
              />
            </div>
          </DetailSection>

          <DetailSection title="Abilities" theme={theme}>
            <div className="flex flex-wrap gap-2">
              {selectedForm.abilities.map((ability) => (
                <div
                  key={ability.name}
                  className={cn(
                    'px-3 py-2 rounded-lg font-medium capitalize',
                    'transition-colors duration-200',
                    theme === 'dark'
                      ? 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  )}
                >
                  {ability.name.replace(/-/g, ' ')}
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection title="Training" theme={theme}>
            <div className="grid grid-cols-2 gap-3">
              <InfoPill
                label="Capture Rate"
                value={`${pokemon.captureRate}`}
                theme={theme}
              />
              <InfoPill
                label="Base Happiness"
                value={`${pokemon.baseHappiness}`}
                theme={theme}
              />
              <InfoPill
                label="Growth Rate"
                value={pokemon.growthRate.replace(/-/g, ' ')}
                theme={theme}
              />
              <InfoPill
                label="EXP Yield"
                value="~100"
                theme={theme}
              />
            </div>
          </DetailSection>

          <DetailSection title="Breeding" theme={theme}>
            <div className="space-y-3">
              <InfoPill
                label="Gender Ratio"
                value={renderGenderInfo(pokemon.genderRate)}
                theme={theme}
              />
              <InfoPill
                label="Egg Groups"
                value={pokemon.eggGroups.join(', ')}
                theme={theme}
              />
              <InfoPill
                label="Egg Cycles"
                value="~20"
                theme={theme}
              />
            </div>
          </DetailSection>
        </div>
      </div>
    </div>
  );
};

// Helper function (imported from utils/cn.ts normally, but included inline for clarity)
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
