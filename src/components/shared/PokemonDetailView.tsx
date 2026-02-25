import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PokemonDetails, PokemonForm, PokemonListItem } from '../../types';
import { fetchPokemonDetails } from '../../services/pokeapiService';
import Loader from './Loader';
import StatBar from '../charts/StatBar';
import FormSelector from '../pokemon/FormSelector';
import GameMechanics from './GameMechanics';
import EvolutionGraph from '../pokemon/EvolutionGraph';
import MoveRecommender from '../dex/MoveRecommender';
import DetailHeader from '../pokemon-detail/DetailHeader';
import DetailSection from '../pokemon-detail/DetailSection';
import InfoPill from '../pokemon-detail/InfoPill';
import MovesSection from '../pokemon-detail/MovesSection';
import TypeDefenseSection from '../pokemon-detail/TypeDefenseSection';
import EncountersTab from '../pokemon-detail/EncountersTab';
import { TYPE_COLORS, TYPE_RELATIONS, TYPE_COLORS_HEX } from '../../constants';
import { usePokemon } from '../../context/PokemonContext';

interface PokemonDetailViewProps {
  pokemonId: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSelect?: (id: number) => void;
  onAddToTeam?: (pokemon: PokemonListItem) => void;
  onRemoveFromTeam?: (id: number) => void;
  onOpenDamageCalc?: () => void;
  onOpenCatchCalc?: () => void;
  onOpenMoveDex?: (search?: string) => void;
  onOpenAbilityDex?: (search?: string) => void;
  onOpenItemDex?: (search?: string) => void;
  isInTeam?: boolean;
  teamIsFull?: boolean;
}

interface TypeEffectiveness {
  [multiplier: string]: string[];
}

const calculateTypeEffectiveness = (types: string[]): TypeEffectiveness => {
  const effectiveness: { [type: string]: number } = {};
  const allTypes = Object.keys(TYPE_RELATIONS);

  allTypes.forEach((attackType) => {
    let multiplier = 1;
    types.forEach((defenseType) => {
      multiplier *= TYPE_RELATIONS[attackType][defenseType] ?? 1;
    });
    effectiveness[attackType] = multiplier;
  });

  const grouped: TypeEffectiveness = {};
  Object.entries(effectiveness).forEach(([type, multiplier]) => {
    const key = multiplier.toString();
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(type);
  });
  return grouped;
};

const PokemonDetailView: React.FC<PokemonDetailViewProps> = ({
  pokemonId,
  onClose,
  onNext,
  onPrevious,
  onSelect,
  onAddToTeam,
  onRemoveFromTeam,
  onOpenDamageCalc,
  onOpenCatchCalc,
  onOpenMoveDex,
  onOpenAbilityDex,
  onOpenItemDex,
  isInTeam = false,
  teamIsFull = false,
}) => {
  const { theme, isShiny: globalShiny } = usePokemon();
  const [selectedForm, setSelectedForm] = useState<PokemonForm | null>(null);
  const [showShiny, setShowShiny] = useState(false);
  // Optimization: derived state instead of useState + useEffect
  // const [typeEffectiveness, setTypeEffectiveness] = useState<TypeEffectiveness>({});
  const [isMovesExpanded, setIsMovesExpanded] = useState(false);
  const [selectedGen, setSelectedGen] = useState<string | null>(null);

  const {
    data: pokemon,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['pokemonDetails', pokemonId],
    queryFn: () => fetchPokemonDetails(pokemonId),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const error = queryError
    ? 'Failed to fetch Pokemon details.'
    : pokemon === null && !loading
      ? 'Could not find details for this Pokemon.'
      : null;

  // Sync local shiny state with global shiny state when opening
  useEffect(() => {
    setShowShiny(globalShiny);
  }, [globalShiny, pokemonId]);

  useEffect(() => {
    if (pokemon) {
      const defaultForm = pokemon.forms.find((f) => f.isDefault) || pokemon.forms[0];
      setSelectedForm(defaultForm);
      setIsMovesExpanded(false);
      setSelectedGen(null);
    }
  }, [pokemon]);

  // Optimization: useMemo instead of useEffect to avoid double render
  const typeEffectiveness = useMemo(() => {
    if (selectedForm) {
      return calculateTypeEffectiveness(selectedForm.types);
    }
    return {};
  }, [selectedForm]);

  const { megaForm, defaultForm } = useMemo(() => {
    if (!pokemon) return { megaForm: null, defaultForm: null };
    const mega = pokemon.forms.find((f) => f.name.includes('-mega'));
    const def = pokemon.forms.find((f) => f.isDefault) || pokemon.forms[0];
    return { megaForm: mega, defaultForm: def };
  }, [pokemon]);

  const isMegaEvolved = selectedForm?.name.includes('-mega') ?? false;

  const handleMegaToggle = () => {
    if (isMegaEvolved && defaultForm) {
      setSelectedForm(defaultForm);
    } else if (!isMegaEvolved && megaForm) {
      setSelectedForm(megaForm);
    }
  };

  const handleAddToTeam = () => {
    if (!pokemon || !selectedForm || !onAddToTeam) {
      return;
    }

    const listItem: PokemonListItem = {
      id: pokemon.id,
      name: pokemon.name,
      imageUrl: selectedForm.imageUrl,
      shinyImageUrl: selectedForm.shinyImageUrl,
      types: selectedForm.types,
      flavorText: pokemon.flavorText,
      stats: selectedForm.stats,
      abilities: selectedForm.abilities.map((a) => a.name),
    };

    onAddToTeam(listItem);
  };

  const handleRemoveFromTeam = () => {
    if (!pokemon || !onRemoveFromTeam) {
      return;
    }

    onRemoveFromTeam(pokemon.id);
  };

  const primaryTypeHex = selectedForm
    ? TYPE_COLORS_HEX[selectedForm.types[0]] || '#A8A878'
    : '#A8A878';

  const statTotal = useMemo(() => {
    return selectedForm?.stats.reduce((total, stat) => total + stat.value, 0) || 0;
  }, [selectedForm]);

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
            className="h-full bg-blue-400 rounded-full"
            style={{ width: `${maleChance}%` }}
          ></div>
        </div>
        <span className="text-pink-400 font-bold text-sm">♀ {femaleChance}%</span>
      </div>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') onPrevious();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'Escape') onClose();
  };

  const currentPokemonData = selectedForm || pokemon;

  return (
    <div
      className={`fixed inset-0 backdrop-blur-sm flex items-end sm:items-center justify-center z-[1050] sm:p-4 ${
        theme === 'dark' ? 'bg-black/70' : 'bg-slate-500/50'
      }`}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`backdrop-blur-2xl w-full max-w-4xl overflow-y-auto relative shadow-2xl border rounded-t-2xl sm:rounded-2xl max-h-[95vh] sm:max-h-[90vh] ${
          theme === 'dark'
            ? 'bg-black/40 shadow-black/50 border-white/20'
            : 'bg-white/90 shadow-slate-400/50 border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag indicator */}
        <div className="sm:hidden flex justify-center pt-2 pb-0 sticky top-0 z-30">
          <div className={`w-10 h-1 rounded-full ${theme === 'dark' ? 'bg-white/30' : 'bg-slate-300'}`} />
        </div>

        {/* Navigation arrows - hidden on mobile to save space */}
        <button
          onClick={onPrevious}
          className={`hidden sm:block fixed left-4 top-1/2 -translate-y-1/2 transition-transform hover:scale-110 z-10 ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          aria-label="Previous Pokemon"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={onNext}
          className={`hidden sm:block fixed right-4 top-1/2 -translate-y-1/2 transition-transform hover:scale-110 z-10 ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          aria-label="Next Pokemon"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 rounded-lg transition-colors z-20 ${theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 sm:h-8 sm:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {(loading || !pokemon || !selectedForm) && (
          <div className="flex justify-center items-center h-96">
            <Loader size="h-16 w-16" />
          </div>
        )}
        {error && <div className="flex justify-center items-center h-96 text-red-400">{error}</div>}

        {pokemon && selectedForm && (
          <div>
            <DetailHeader
              theme={theme}
              pokemon={pokemon}
              selectedForm={selectedForm}
              primaryTypeHex={primaryTypeHex}
              showShiny={showShiny}
              onToggleShiny={() => setShowShiny((state) => !state)}
              onOpenDamageCalc={onOpenDamageCalc}
              onOpenCatchCalc={onOpenCatchCalc}
              onAddToTeam={onAddToTeam ? handleAddToTeam : undefined}
              onRemoveFromTeam={onRemoveFromTeam ? handleRemoveFromTeam : undefined}
              isInTeam={isInTeam}
              teamIsFull={teamIsFull}
              megaForm={megaForm}
              isMegaEvolved={isMegaEvolved}
              onMegaToggle={handleMegaToggle}
              selectedGen={selectedGen}
              onSelectGen={setSelectedGen}
            />

            <div className="p-4 sm:p-8">
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
              >
                <div className="flex flex-col gap-8">
                  <div
                    className={`flex justify-center items-center rounded-lg p-4 h-64 ${theme === 'dark' ? 'bg-black/10' : 'bg-slate-100'}`}
                  >
                    {(() => {
                      let currentImageUrl = showShiny
                        ? selectedForm.shinyImageUrl
                        : selectedForm.imageUrl;

                      // If a generation is selected and it exists in the data
                      if (selectedGen && pokemon.genSprites && pokemon.genSprites[selectedGen]) {
                        const genSpriteSet = pokemon.genSprites[selectedGen];
                        const genSprite =
                          showShiny && genSpriteSet.shiny
                            ? genSpriteSet.shiny
                            : genSpriteSet.default;
                        if (genSprite) {
                          currentImageUrl = genSprite;
                        }
                      }

                      return (
                        <img
                          src={currentImageUrl}
                          alt={selectedForm.name}
                          className="h-full object-contain drop-shadow-lg"
                          loading="lazy"
                        />
                      );
                    })()}
                  </div>
                  <p
                    className={`text-center italic p-4 rounded-lg ${theme === 'dark' ? 'text-slate-300 bg-black/10' : 'text-slate-600 bg-slate-100'}`}
                  >
                    "{pokemon.flavorText}"
                  </p>

                  <DetailSection title={`Base Stats (Total: ${statTotal})`} theme={theme}>
                    <div className="space-y-2">
                      {selectedForm.stats.map((stat) => (
                        <StatBar
                          key={stat.name}
                          name={stat.name}
                          value={stat.value}
                          theme={theme}
                        />
                      ))}
                    </div>
                  </DetailSection>

                  {pokemon.evolutionChain && pokemon.evolutionChain.length > 1 && (
                    <DetailSection title="Evolution Chain" theme={theme}>
                      <EvolutionGraph
                        chain={pokemon.evolutionChain}
                        onSelectPokemon={(id) => {
                          if (onSelect && id !== pokemon.id) {
                            onSelect(id);
                          }
                        }}
                        onOpenItemDex={onOpenItemDex}
                      />
                    </DetailSection>
                  )}
                </div>

                <div className="flex flex-col gap-6">
                  {pokemon.forms && pokemon.forms.length > 0 && (
                    <DetailSection title="Forms & Variants" theme={theme}>
                      <FormSelector
                        forms={pokemon.forms}
                        selectedForm={selectedForm}
                        onSelectForm={setSelectedForm}
                        isShiny={showShiny}
                      />
                    </DetailSection>
                  )}

                  <DetailSection title="Pokédex Data" theme={theme}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                      <InfoPill label="Habitat" value={pokemon.habitat} theme={theme} />
                      <InfoPill
                        label="Abilities"
                        value={
                          <div className="flex flex-wrap gap-1 justify-center">
                            {selectedForm.abilities.map((a, i) => (
                              <React.Fragment key={a.name}>
                                {i > 0 && ', '}
                                <button
                                  onClick={() => onOpenAbilityDex?.(a.name.replace(/-/g, ' '))}
                                  className={`hover:underline ${theme === 'dark' ? 'text-primary-300 hover:text-primary-200' : 'text-primary-600 hover:text-primary-500'}`}
                                >
                                  {a.name.replace(/-/g, ' ')}
                                </button>
                              </React.Fragment>
                            ))}
                          </div>
                        }
                        theme={theme}
                      />
                    </div>
                  </DetailSection>

                  <DetailSection title="Training" theme={theme}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                      <InfoPill label="Growth Rate" value={pokemon.growthRate} theme={theme} />
                    </div>
                  </DetailSection>

                  <DetailSection title="Breeding" theme={theme}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoPill
                        label="Gender"
                        value={renderGenderInfo(pokemon.genderRate)}
                        theme={theme}
                      />
                      <InfoPill
                        label="Egg Groups"
                        value={pokemon.eggGroups.join(', ')}
                        theme={theme}
                      />
                    </div>
                  </DetailSection>

                  <TypeDefenseSection theme={theme} typeEffectiveness={typeEffectiveness} />

                  <DetailSection title="Encounter Locations" theme={theme}>
                    <EncountersTab pokemonId={pokemon.id} theme={theme} />
                  </DetailSection>

                  <DetailSection title="Battle Mechanics" theme={theme}>
                    <GameMechanics pokemon={pokemon} />
                  </DetailSection>

                  {pokemon.moves && pokemon.moves.length > 0 && (
                    <MoveRecommender
                      moves={pokemon.moves}
                      stats={selectedForm.stats}
                      types={selectedForm.types}
                    />
                  )}
                </div>
              </div>

              {pokemon.moves && pokemon.moves.length > 0 && (
                <MovesSection
                  theme={theme}
                  moves={pokemon.moves}
                  isExpanded={isMovesExpanded}
                  onToggle={() => setIsMovesExpanded((prev) => !prev)}
                  onOpenMoveDex={onOpenMoveDex}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokemonDetailView;
