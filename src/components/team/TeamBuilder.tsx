import React, { useMemo, useState, memo, useCallback, useEffect, Suspense, useRef } from 'react';
import { TeamMember, PokemonListItem } from '../../types';
import TypeBadge from '../charts/TypeBadge';
import SpeedTierAnalysis from '../calculators/SpeedTierAnalysis';
import { SortableTeamMemberSlot } from './SortableTeamMemberSlot';
import TeamBuilderActions from './TeamBuilderActions';
import Loader from '../shared/Loader';
import { useTeamAnalytics } from '../../hooks/useTeamAnalytics';
import { playUISound } from '../../services/soundService';
import { validatePokemonListItem } from '../../services/pokeapiService';
import { useAchievements } from '../../context/AchievementContext';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Lazy loaded components
const TeamExportModal = React.lazy(() => import('./TeamExportModal'));
const TrainerCard = React.lazy(() => import('./TrainerCard'));
const SavedTeamsModal = React.lazy(() => import('./SavedTeamsModal'));
const TeamMemberEditor = React.lazy(() => import('./TeamMemberEditor'));
const RadarChart = React.lazy(() => import('../charts/RadarChart'));
const CoverageGrid = React.lazy(() => import('../charts/CoverageGrid'));
const TeamChecklist = React.lazy(() => import('./TeamChecklist'));
const EntryHazardAnalysis = React.lazy(() => import('../calculators/EntryHazardAnalysis'));

interface TeamBuilderProps {
  team: TeamMember[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onSelect: (id: number) => void;
  teamCapacity?: number;
  theme: 'dark' | 'light';
  onUpdateTeamMember: (id: number, updates: Partial<TeamMember>) => void;
  onLoadTeam: (team: TeamMember[]) => void;
  onRandomize: () => void;
  hasFilteredPokemon: boolean;
  isCyberpunk?: boolean;
  onAddPokemon?: () => void;
  onAddToTeam?: (pokemon: PokemonListItem) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onReorderTeam: (fromIndex: number, toIndex: number) => void;
}

const TeamBuilder: React.FC<TeamBuilderProps> = ({
  team,
  onRemove,
  onClear,
  onSelect,
  teamCapacity = 6,
  theme,
  onUpdateTeamMember,
  onLoadTeam,
  onRandomize,
  hasFilteredPokemon,
  isCyberpunk = false,
  onAddPokemon,
  onAddToTeam,
  undo,
  redo,
  canUndo,
  canRedo,
  onReorderTeam,
}) => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showTrainerCard, setShowTrainerCard] = useState(false);
  const [showSavedTeams, setShowSavedTeams] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [shareLinkStatus, setShareLinkStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);
  const reorderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { unlockAchievement } = useAchievements();

  useEffect(() => {
    if (team.length >= 1) {
      unlockAchievement('novice_trainer');
    }
    if (team.length >= teamCapacity) {
      unlockAchievement('full_squad');
    }
  }, [team.length, teamCapacity, unlockAchievement]);

  useEffect(() => {
    return () => {
      if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
    };
  }, []);

  const slots = useMemo(
    () => Array.from({ length: Math.max(teamCapacity - team.length, 0) }),
    [teamCapacity, team.length]
  );

  // Use custom hook for team analytics
  const {
    typeCounts,
    teamWeaknesses,
    teamResistances,
    offensiveCoverage,
    majorThreats,
    teamStats,
  } = useTeamAnalytics(team);

  const uniqueTypes = Object.keys(typeCounts);
  const isTeamFull = team.length >= teamCapacity;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const pokemonData = e.dataTransfer.getData('application/x-pokedex-pokemon');
    if (pokemonData) {
      // SECURITY: Prevent DoS with large payloads
      if (pokemonData.length > MAX_INPUT_LENGTH) {
        console.warn('Sentinel: Dropped data too large. Blocked DoS attempt.');
        return;
      }

      try {
        const rawPokemon = JSON.parse(pokemonData);
        const pokemon = validatePokemonListItem(rawPokemon);

        if (pokemon) {
          if (onAddToTeam) {
            onAddToTeam(pokemon);
          }
        } else {
          console.warn('Sentinel: Dropped data failed validation. Blocked potential injection.');
        }
      } catch (err) {
        console.error('Failed to parse dropped pokemon', err);
      }
    }
  };

  // DnD Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = team.findIndex((item) => item.id === active.id);
      const newIndex = team.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderTeam(oldIndex, newIndex);

        const movedMember = team[oldIndex];
        setReorderMessage(`Moved ${movedMember.name} to position ${newIndex + 1}`);
        if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
        reorderTimeoutRef.current = setTimeout(() => setReorderMessage(null), 1000);
      }
    }
  };

  return (
    <aside
      className={`rounded-2xl border p-4 shadow-xl backdrop-blur-lg lg:sticky lg:top-24 ${
        isCyberpunk
          ? 'cyber-panel cyber-corners'
          : theme === 'dark'
            ? 'border-white/10 bg-slate-950/85 shadow-black/40'
            : 'border-slate-200 bg-white/85 shadow-slate-200/50'
      }`}
      aria-label="Team builder"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              isCyberpunk ? 'cyber-text' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {isCyberpunk ? 'Party' : 'Team'}
          </p>
          <h2
            className={`text-xl font-bold ${
              isCyberpunk ? 'cyber-text-pink' : theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            {team.length}/{teamCapacity}{' '}
            <span
              className={`text-sm font-medium ${
                isCyberpunk
                  ? 'cyber-text opacity-70'
                  : theme === 'dark'
                    ? 'text-slate-400'
                    : 'text-slate-500'
              }`}
            >
              slots
            </span>
          </h2>
          <p
            className={`text-xs ${
              isCyberpunk
                ? 'cyber-text opacity-60'
                : theme === 'dark'
                  ? 'text-slate-400'
                  : 'text-slate-500'
            }`}
          >
            {isTeamFull
              ? isCyberpunk
                ? 'Party is full! Move Pokemon to PC Box.'
                : 'Team is full. Remove a teammate to add another.'
              : isCyberpunk
                ? 'Select Pokemon to add to your party.'
                : 'Select cards to pin them here.'}
          </p>
        </div>
        <TeamBuilderActions
          team={team}
          theme={theme}
          isCyberpunk={isCyberpunk}
          copyStatus={copyStatus}
          shareLinkStatus={shareLinkStatus}
          onCopyStatusChange={setCopyStatus}
          onShareLinkStatusChange={setShareLinkStatus}
          onShowExport={() => setShowExport(true)}
          onShowSavedTeams={() => setShowSavedTeams(true)}
          onShowTrainerCard={() => setShowTrainerCard(true)}
          onShowAnalytics={() => setShowAnalytics(!showAnalytics)}
          showAnalytics={showAnalytics}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onClear={onClear}
          onRandomize={onRandomize}
          hasFilteredPokemon={hasFilteredPokemon}
        />
      </header>

      {/* Screen Reader Announcements */}
      <div aria-live="polite" className="sr-only">
        {reorderMessage}
      </div>

      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Loader message="Loading..." />
          </div>
        }
      >
        {showExport && (
          <TeamExportModal isOpen={showExport} onClose={() => setShowExport(false)} team={team} />
        )}
        {showTrainerCard && <TrainerCard onClose={() => setShowTrainerCard(false)} />}
        {showSavedTeams && (
          <SavedTeamsModal
            isOpen={showSavedTeams}
            onClose={() => setShowSavedTeams(false)}
            currentTeam={team}
            onLoadTeam={onLoadTeam}
            theme={theme}
          />
        )}

        {editingMember && (
          <TeamMemberEditor
            member={editingMember}
            onClose={() => setEditingMember(null)}
            onSave={(updates) => onUpdateTeamMember(editingMember.id, updates)}
            theme={theme}
          />
        )}
      </Suspense>

      <div className="mt-4 space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={team.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {team.map((member, index) => (
              <SortableTeamMemberSlot
                key={member.id}
                member={member}
                index={index}
                theme={theme}
                onRemove={onRemove}
                onSelect={onSelect}
                onEdit={setEditingMember}
              />
            ))}
          </SortableContext>
        </DndContext>

        {slots.length > 0 && (
          <div className="space-y-2">
            {slots.map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className={`flex h-16 items-center justify-center gap-2 rounded-xl border border-dashed text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer outline-none ${
                  theme === 'dark'
                    ? 'border-white/15 bg-white/5 text-slate-500 hover:border-white/30 hover:bg-white/10 hover:shadow-lg hover:shadow-primary-500/10 focus:ring-2 focus:ring-primary-500/50'
                    : 'border-slate-300 bg-slate-50 text-slate-400 hover:border-primary-400 hover:bg-primary-300/10 hover:shadow-lg hover:shadow-primary-500/10 focus:ring-2 focus:ring-primary-500/50'
                }`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  playUISound('click');
                  onAddPokemon?.();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playUISound('click');
                    onAddPokemon?.();
                  }
                }}
                aria-label={`Empty slot ${team.length + index + 1} of ${teamCapacity}. Click to search for Pokemon.`}
                title="Add a Pokemon to fill this slot"
              >
                <svg
                  className="h-4 w-4 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Slot {team.length + index + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`mt-5 space-y-3 rounded-xl border p-3 ${
          theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex justify-between items-center">
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
          >
            Team Analytics
          </p>
          {team.length > 0 && (
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`text-xs transition-colors ${theme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-500'}`}
            >
              {showAnalytics ? 'Hide' : 'Show'} Details
            </button>
          )}
        </div>

        {team.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            {/* Pokeball SVG Illustration */}
            <svg
              className={`h-16 w-16 mb-3 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="5" />
              <line x1="4" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="5" />
              <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="5" />
              <circle cx="50" cy="50" r="7" fill="currentColor" />
            </svg>
            <p
              className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
            >
              Your team is empty
            </p>
            <p
              className={`text-xs mt-1 text-center ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
            >
              Browse the Pokedex and add Pokemon to your team
            </p>
          </div>
        ) : (
          <>
            <div>
              <p
                className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Type Coverage
              </p>
              <div className="flex flex-wrap gap-2">
                {uniqueTypes.map((type) => (
                  <span
                    key={type}
                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/10 text-slate-100'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {type}{' '}
                    <span className={theme === 'dark' ? 'text-primary-300' : 'text-primary-600'}>
                      x{typeCounts[type]}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {showAnalytics && (
              <Suspense
                fallback={
                  <div className="p-4 flex justify-center">
                    <Loader size="h-6 w-6" message="Loading analytics..." />
                  </div>
                }
              >
                {/* Coverage Grid */}
                <CoverageGrid team={team} theme={theme} />

                {/* Team Checklist */}
                <TeamChecklist team={team} theme={theme} />

                {/* Entry Hazard Analysis */}
                <EntryHazardAnalysis team={team} theme={theme} />

                {/* Speed Tier Analysis */}
                <SpeedTierAnalysis team={team} theme={theme} />

                {/* Team Stats Radar Chart */}
                {teamStats && (
                  <div
                    className={`py-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
                  >
                    <p
                      className={`text-xs font-semibold mb-2 text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      Average Base Stats
                    </p>
                    <div className="flex justify-center -ml-4">
                      <RadarChart
                        datasets={[{ label: 'Team Average', color: '#6366f1', stats: teamStats }]}
                        width={220}
                        height={220}
                        theme={theme}
                        maxValue={150} // 150 is a reasonable max for base stats average
                      />
                    </div>
                  </div>
                )}

                {/* Major Threats */}
                {majorThreats.length > 0 && (
                  <div className="py-2">
                    <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-2 animate-pulse">
                      ⚠️ Major Threats ⚠️
                    </p>
                    <p
                      className={`text-[10px] mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      3+ teammates are weak to these types:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {majorThreats.map(([type, count]) => (
                        <div key={type} className="relative">
                          <TypeBadge type={type} />
                          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white/20">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p
                    className={`text-xs font-semibold mb-2 mt-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}
                  >
                    All Weaknesses ({Object.keys(teamWeaknesses).length})
                  </p>
                  {Object.keys(teamWeaknesses).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(teamWeaknesses) as Array<[string, number]>)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([type, count]) => (
                          <TypeBadge key={type} type={type} />
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No common weaknesses!</p>
                  )}
                </div>

                <div>
                  <p
                    className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}
                  >
                    All Resistances ({Object.keys(teamResistances).length})
                  </p>
                  {Object.keys(teamResistances).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(teamResistances) as Array<[string, number]>)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([type, count]) => (
                          <TypeBadge key={type} type={type} />
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No common resistances.</p>
                  )}
                </div>

                <div>
                  <p
                    className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    Offensive Coverage (Types Hit SE)
                  </p>
                  {Object.keys(offensiveCoverage).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(offensiveCoverage) as Array<[string, number]>)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <div key={type} className="relative group/tooltip">
                            <TypeBadge type={type} />
                            {/* Tooltip */}
                            <div
                              className={`absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition pointer-events-none whitespace-nowrap z-10 ${theme === 'dark' ? 'bg-black text-white' : 'bg-slate-800 text-white'}`}
                            >
                              Hit by {count} types
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No super effective coverage.</p>
                  )}
                </div>

                <div
                  className={`pt-2 border-t mt-2 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
                >
                  <p
                    className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    💡 <span className="font-semibold">Tip:</span> Diversify types to cover more
                    weaknesses!
                  </p>
                </div>
              </Suspense>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default memo(TeamBuilder);
