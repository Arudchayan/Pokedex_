import React, { useState, useEffect, useRef } from 'react';
import { TeamMember, PokemonListItem } from '../../types';
import TypeBadge from '../charts/TypeBadge';
import { useTeamAnalytics } from '../../hooks/useTeamAnalytics';
import { playUISound } from '../../services/soundService';
import ReactDOM from 'react-dom';

interface MobileTeamSheetProps {
  team: TeamMember[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onSelect: (id: number) => void;
  teamCapacity: number;
  theme: 'dark' | 'light';
  isCyberpunk?: boolean;
  onAddPokemon?: () => void;
  onAddToTeam?: (pokemon: PokemonListItem) => void;
}

const MobileTeamSheet: React.FC<MobileTeamSheetProps> = ({
  team,
  onRemove,
  onClear,
  onSelect,
  teamCapacity,
  theme,
  isCyberpunk = false,
  onAddPokemon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark' || isCyberpunk;

  const safeTeam = team ?? [];
  const { typeCounts, majorThreats } = useTeamAnalytics(safeTeam);
  const uniqueTypes = Object.keys(typeCounts);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleFabClick = () => {
    playUISound('click');
    setIsOpen(true);
  };

  const handleSelectAndClose = (id: number) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button - only on mobile */}
      <button
        type="button"
        onClick={handleFabClick}
        className={`lg:hidden fixed bottom-20 right-4 z-[55] flex items-center gap-2 rounded-2xl px-4 py-3.5 shadow-2xl transition-all active:scale-95 ${
          safeTeam.length > 0 ? 'animate-fab-pulse' : ''
        } ${
          isDark
            ? 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400/30'
            : 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400/30'
        }`}
        aria-label={`Team: ${safeTeam.length}/${teamCapacity}. Tap to manage team.`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="text-sm font-bold">{safeTeam.length}/{teamCapacity}</span>
      </button>

      {/* Bottom Sheet */}
      {isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1060] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className={`absolute bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto overscroll-contain ${
              isDark ? 'bg-slate-950' : 'bg-white'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Team Builder"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
            </div>

            {/* Sheet header */}
            <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Team Builder
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {safeTeam.length}/{teamCapacity} slots filled
                </p>
              </div>
              <div className="flex items-center gap-2">
                {safeTeam.length > 0 && (
                  <button
                    type="button"
                    onClick={onClear}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isDark
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/10'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  aria-label="Close team builder"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Team members */}
            <div className="px-4 py-3 space-y-2">
              {safeTeam.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'border-white/10 bg-white/5'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.id}.png`}
                    alt={member.name}
                    className="w-12 h-12 pixelated"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold capitalize truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {member.name}
                    </p>
                    <div className="flex gap-1 mt-0.5">
                      {member.types.map((type) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectAndClose(member.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'text-slate-400 hover:text-white hover:bg-white/10'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      aria-label={`View ${member.name} details`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(member.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'text-red-400 hover:bg-red-500/10'
                          : 'text-red-500 hover:bg-red-50'
                      }`}
                      aria-label={`Remove ${member.name} from team`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: Math.max(teamCapacity - safeTeam.length, 0) }).map((_, i) => (
                <button
                  key={`empty-${i}`}
                  type="button"
                  onClick={() => {
                    playUISound('click');
                    onAddPokemon?.();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed text-xs font-semibold uppercase tracking-wide transition-colors ${
                    isDark
                      ? 'border-white/15 text-slate-500 hover:border-white/30 hover:bg-white/5'
                      : 'border-slate-300 text-slate-400 hover:border-primary-400 hover:bg-primary-50'
                  }`}
                >
                  <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Slot {safeTeam.length + i + 1}</span>
                </button>
              ))}
            </div>

            {/* Team Analytics summary */}
            {safeTeam.length > 0 && (
              <div className={`mx-4 mb-4 p-3 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Type Coverage
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueTypes.map((type) => (
                    <span
                      key={type}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        isDark
                          ? 'border-white/10 bg-white/10 text-slate-100'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {type} <span className={isDark ? 'text-primary-300' : 'text-primary-600'}>x{typeCounts[type]}</span>
                    </span>
                  ))}
                </div>

                {majorThreats.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">
                      Major Threats
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {majorThreats.map(([type]) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Safe area padding */}
            <div className="h-6" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MobileTeamSheet;
