import React, { Suspense } from 'react';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import Loader from '../components/shared/Loader';
import type { AppController } from './useAppController';

const PokemonDetailView = React.lazy(() => import('../components/shared/PokemonDetailView'));
const GameHub = React.lazy(() => import('../components/games/GameHub'));
const DamageCalculator = React.lazy(() => import('../components/calculators/DamageCalculator'));
const BreedingCalculator = React.lazy(() => import('../components/calculators/BreedingCalculator'));
const CatchCalculator = React.lazy(() => import('../components/calculators/CatchCalculator'));
const StatCalculator = React.lazy(() => import('../components/calculators/StatCalculator'));
const ComparisonView = React.lazy(() => import('../components/charts/ComparisonView'));
const ShinyOddsCalculator = React.lazy(
  () => import('../components/calculators/ShinyOddsCalculator')
);
const MoveDex = React.lazy(() => import('../components/dex/MoveDex'));
const AbilityDex = React.lazy(() => import('../components/dex/AbilityDex'));
const ItemDex = React.lazy(() => import('../components/dex/ItemDex'));
const NatureChart = React.lazy(() => import('../components/charts/NatureChart'));
const TypeChart = React.lazy(() => import('../components/charts/TypeChart'));
const DataManagement = React.lazy(() => import('../components/shared/DataManagement'));
const AchievementModal = React.lazy(() => import('../components/shared/AchievementModal'));
const PokemonWalkersSettingsModal = React.lazy(
  () => import('../components/shared/PokemonWalkersSettingsModal')
);

type Props = {
  controller: AppController;
};

export default function AppModals({ controller }: Props) {
  const {
    selectedPokemonId,
    teamIds,
    teamIsFull,
    comparisonList,
    comparisonPokemon,
    dexSearchTerm,
    showComparison,
    setShowComparison,
    showBattleCalc,
    setShowBattleCalc,
    showStatCalc,
    setShowStatCalc,
    showBreedingCalc,
    setShowBreedingCalc,
    showCatchCalc,
    setShowCatchCalc,
    showShinyCalc,
    setShowShinyCalc,
    showGameHub,
    setShowGameHub,
    showMoveDex,
    setShowMoveDex,
    showAbilityDex,
    setShowAbilityDex,
    showItemDex,
    setShowItemDex,
    showNatureChart,
    setShowNatureChart,
    showTypeChart,
    setShowTypeChart,
    showDataManagement,
    setShowDataManagement,
    showAchievements,
    setShowAchievements,
    showWalkersSettings,
    setShowWalkersSettings,
    handleCloseDetail,
    handleNext,
    handlePrevious,
    handleSelectPokemon,
    handleAddToTeam,
    handleRemoveFromTeam,
    handleRemoveFromComparison,
    openBattleCalc,
    openCatchCalc,
    openMoveDex,
    openAbilityDex,
    openItemDex,
  } = controller;

  return (
    <>
      <ErrorBoundary
        fallback={
          <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md text-center">
              <p className="text-red-500 font-semibold mb-4">Failed to load Pokemon details</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Loader message="Loading details..." />
            </div>
          }
        >
          {selectedPokemonId !== null && (
            <PokemonDetailView
              pokemonId={selectedPokemonId}
              onClose={handleCloseDetail}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSelect={handleSelectPokemon}
              onAddToTeam={handleAddToTeam}
              onRemoveFromTeam={handleRemoveFromTeam}
              onOpenDamageCalc={openBattleCalc}
              onOpenCatchCalc={openCatchCalc}
              onOpenMoveDex={openMoveDex}
              onOpenAbilityDex={openAbilityDex}
              onOpenItemDex={openItemDex}
              isInTeam={teamIds.has(selectedPokemonId)}
              teamIsFull={teamIsFull}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary
        fallback={
          <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md text-center">
              <p className="text-red-500 font-semibold mb-4">Something went wrong</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        }
      >
        <Suspense fallback={<Loader message="Loading..." />}>
          {showComparison && (
            <ComparisonView
              pokemon={comparisonPokemon}
              onClose={() => setShowComparison(false)}
              onRemove={handleRemoveFromComparison}
            />
          )}

          {showBattleCalc && (
            <DamageCalculator
              onClose={() => setShowBattleCalc(false)}
              initialAttackerId={selectedPokemonId}
            />
          )}

          {showStatCalc && (
            <StatCalculator
              onClose={() => setShowStatCalc(false)}
              initialPokemonId={selectedPokemonId}
            />
          )}

          {showBreedingCalc && <BreedingCalculator onClose={() => setShowBreedingCalc(false)} />}

          {showCatchCalc && (
            <CatchCalculator
              onClose={() => setShowCatchCalc(false)}
              initialPokemonId={selectedPokemonId}
            />
          )}

          {showShinyCalc && <ShinyOddsCalculator onClose={() => setShowShinyCalc(false)} />}

          {showGameHub && <GameHub onClose={() => setShowGameHub(false)} />}

          {showMoveDex && (
            <MoveDex onClose={() => setShowMoveDex(false)} initialSearch={dexSearchTerm} />
          )}
          {showAbilityDex && (
            <AbilityDex onClose={() => setShowAbilityDex(false)} initialSearch={dexSearchTerm} />
          )}
          {showItemDex && (
            <ItemDex onClose={() => setShowItemDex(false)} initialSearch={dexSearchTerm} />
          )}
          {showNatureChart && <NatureChart onClose={() => setShowNatureChart(false)} />}
          {showTypeChart && <TypeChart onClose={() => setShowTypeChart(false)} />}
          {showDataManagement && <DataManagement onClose={() => setShowDataManagement(false)} />}
          {showAchievements && <AchievementModal onClose={() => setShowAchievements(false)} />}
          {showWalkersSettings && (
            <PokemonWalkersSettingsModal onClose={() => setShowWalkersSettings(false)} />
          )}
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
