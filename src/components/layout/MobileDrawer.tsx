import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { usePokemonUI } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import { useModalStore } from '../../store/useModalStore';
import { useAchievements } from '../../context/AchievementContext';
import { useFocusTrap } from '../../hooks';
import ThemeSelector from './ThemeSelector';
import { openWalkthroughModal } from '../walkthrough/WalkthroughManager';
import {
  playUISound,
  toggleAudio as toggleAudioService,
  isAudioEnabled,
} from '../../services/soundService';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRandomPokemon: () => void;
}

interface DrawerItem {
  label: string;
  icon: string;
  onClick: () => void;
  accent?: string;
  badge?: number;
  pressed?: boolean;
}

interface DrawerSection {
  title: string;
  items: DrawerItem[];
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, onRandomPokemon }) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const themeLabelId = useId();

  // UI state from stores / context
  const { theme, isCyberpunk, isShiny } = usePokemonUI();
  const comparisonListLength = usePokemonStore((s) => s.comparisonList.length);
  const { unlockAchievement } = useAchievements();

  // Local audio state
  const [audioEnabled, setAudioEnabled] = useState(isAudioEnabled());

  const handleToggleAudio = useCallback(() => {
    const newState = toggleAudioService();
    setAudioEnabled(newState);
    playUISound('click');
  }, []);

  // Modal actions (all stable references, only subscribed via useShallow)
  const {
    openMoveDex,
    openAbilityDex,
    openItemDex,
    openBreedingCalc,
    openCatchCalc,
    openNatureChart,
    openTypeChart,
    openDataManagement,
    openWalkersSettings,
    openGameHub,
    openDamageCalc,
    openStatCalc,
    openShinyCalc,
    openComparison,
    openAchievements,
  } = useModalStore(
    useShallow((s) => ({
      openMoveDex: s.openMoveDex,
      openAbilityDex: s.openAbilityDex,
      openItemDex: s.openItemDex,
      openBreedingCalc: s.openBreedingCalc,
      openCatchCalc: s.openCatchCalc,
      openNatureChart: s.openNatureChart,
      openTypeChart: s.openTypeChart,
      openDataManagement: s.openDataManagement,
      openWalkersSettings: s.openWalkersSettings,
      openGameHub: s.openGameHub,
      openDamageCalc: s.openDamageCalc,
      openStatCalc: s.openStatCalc,
      openShinyCalc: s.openShinyCalc,
      openComparison: s.openComparison,
      openAchievements: s.openAchievements,
    }))
  );

  // Achievement wrappers
  const handleToggleShiny = () => {
    usePokemonStore.getState().toggleShiny();
    unlockAchievement('shiny_hunter');
  };

  const handleShowBreeding = () => {
    openBreedingCalc();
    unlockAchievement('breeder');
  };

  const handleShowDamageCalc = () => {
    openDamageCalc();
    unlockAchievement('strategist');
  };

  const handleShowTypeChart = () => {
    openTypeChart();
    unlockAchievement('strategist');
  };

  const handleShowGameHub = () => {
    openGameHub();
    unlockAchievement('knowledge_seeker');
  };

  // Trap focus inside the open drawer and restore it to the trigger on close.
  useFocusTrap({
    active: isOpen,
    containerRef: drawerRef,
    initialFocusRef: firstItemRef,
    onEscape: onClose,
  });

  // Lock body scroll when drawer is open
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

  const handleItemClick = (callback: () => void) => {
    callback();
    onClose();
  };

  const isDark = theme === 'dark' || isCyberpunk;

  const sections: DrawerSection[] = [
    {
      title: 'Pokédex',
      items: [
        { label: 'Move Dex', icon: '⚔️', onClick: openMoveDex },
        { label: 'Ability Dex', icon: '🧬', onClick: openAbilityDex },
        { label: 'Item Dex', icon: '🎒', onClick: openItemDex },
      ],
    },
    {
      title: 'Tools',
      items: [
        { label: 'Damage Calculator', icon: '💥', onClick: handleShowDamageCalc, accent: 'purple' },
        { label: 'Stat Calculator', icon: '📊', onClick: openStatCalc, accent: 'blue' },
        { label: 'Catch Calculator', icon: '🎯', onClick: openCatchCalc },
        { label: 'Breeding Calculator', icon: '🥚', onClick: handleShowBreeding },
        { label: 'Shiny Odds Calculator', icon: '✨', onClick: openShinyCalc, accent: 'pink' },
        { label: 'Nature Chart', icon: '📋', onClick: openNatureChart },
        { label: 'Type Chart', icon: '🔥', onClick: handleShowTypeChart },
        ...(comparisonListLength > 0
          ? [
              {
                label: `Compare (${comparisonListLength})`,
                icon: '⚖️',
                onClick: openComparison,
                accent: 'primary' as string,
                badge: comparisonListLength,
              },
            ]
          : []),
      ],
    },
    {
      title: 'Games',
      items: [{ label: 'Game Hub', icon: '🎮', onClick: handleShowGameHub, accent: 'green' }],
    },
    {
      title: 'Settings',
      items: [
        {
          label: isShiny ? 'Shiny Mode: ON' : 'Shiny Mode: OFF',
          icon: '💎',
          onClick: handleToggleShiny,
          accent: isShiny ? 'pink' : undefined,
          pressed: isShiny,
        },
        {
          label: audioEnabled ? 'Sound: ON' : 'Sound: OFF',
          icon: audioEnabled ? '🔊' : '🔇',
          onClick: handleToggleAudio,
          pressed: audioEnabled,
        },
        { label: 'Random Pokémon', icon: '🎲', onClick: onRandomPokemon },
        { label: 'Achievements', icon: '🏆', onClick: openAchievements },
        { label: 'Start Walkthrough', icon: '🧭', onClick: openWalkthroughModal },
        { label: 'Pokémon Walkers', icon: '🚶', onClick: openWalkersSettings },
        { label: 'Data Management', icon: '💾', onClick: openDataManagement },
      ],
    },
  ];

  // Base style classes
  const backdropClass = `fixed inset-0 z-drawer-backdrop bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`;

  const panelBg = isCyberpunk
    ? 'bg-gradient-to-b from-[#141428] to-[#1e1e3c] border-r-2 border-cyan-500/40'
    : isDark
      ? 'bg-slate-950 border-r border-white/10'
      : 'bg-white border-r border-slate-200';

  const drawerClass = `fixed z-drawer flex w-80 max-w-full flex-col shadow-2xl transform transition-transform duration-300 ease-out md:hidden overscroll-contain ${panelBg} ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  }`;

  const drawerStyle: React.CSSProperties = {
    top: 0,
    left: 0,
    bottom: 0,
    height: '100dvh',
  };

  const sectionTitleClass = isCyberpunk
    ? 'text-xs font-bold uppercase tracking-widest text-cyan-400/70 px-3 py-2'
    : isDark
      ? 'text-xs font-bold uppercase tracking-widest text-slate-500 px-3 py-2'
      : 'text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2';

  const itemBaseClass = `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`;

  const itemClass = (accent?: string, pressed?: boolean) => {
    if (isCyberpunk) {
      return `${itemBaseClass} text-cyan-300 hover:bg-cyan-500/10 active:bg-cyan-500/20 ${
        pressed ? 'bg-cyan-500/15' : ''
      }`;
    }
    if (isDark) {
      if (pressed) {
        return `${itemBaseClass} text-slate-200 bg-white/10 hover:bg-white/15 active:bg-white/20`;
      }
      return `${itemBaseClass} text-slate-300 hover:bg-white/10 active:bg-white/15`;
    }
    if (pressed) {
      return `${itemBaseClass} text-slate-800 bg-slate-100 hover:bg-slate-200 active:bg-slate-200`;
    }
    return `${itemBaseClass} text-slate-700 hover:bg-slate-100 active:bg-slate-200`;
  };

  const dividerClass = isCyberpunk
    ? 'h-px mx-3 my-1 bg-cyan-500/20'
    : isDark
      ? 'h-px mx-3 my-1 bg-white/10'
      : 'h-px mx-3 my-1 bg-slate-200';

  const drawerContent = (
    <div data-testid="mobile-drawer-root" inert={!isOpen}>
      {/* Backdrop */}
      <div
        className={backdropClass}
        onClick={onClose}
        aria-hidden="true"
        data-testid="mobile-drawer-backdrop"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={drawerClass}
        style={drawerStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-4 border-b ${
            isCyberpunk ? 'border-cyan-500/30' : isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <img
              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
              alt=""
              className="h-8 w-8"
              aria-hidden="true"
            />
            <span
              className={`text-lg font-bold ${
                isCyberpunk ? 'text-cyan-300' : isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Pokédex
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/10'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            aria-label="Close menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Appearance stays outside the scroll area so the theme panel is not clipped */}
        <div className="pt-3 shrink-0">
          <div className={sectionTitleClass}>Appearance</div>
          <div
            className={`flex items-center justify-between gap-3 pl-3 ${
              isCyberpunk ? 'pr-0' : 'pr-3'
            } py-1 border-b ${
              isCyberpunk ? 'border-cyan-500/20' : isDark ? 'border-white/10' : 'border-slate-200'
            }`}
            role="group"
            aria-labelledby={themeLabelId}
            data-tour="theme-mobile"
          >
            <span
              id={themeLabelId}
              className={`flex items-center gap-3 text-sm font-medium ${
                isCyberpunk ? 'text-cyan-300' : isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              <span className="text-base w-6 text-center flex-shrink-0" aria-hidden="true">
                🎨
              </span>
              Theme
            </span>
            {/* Nudge past the 2px cyberpunk border so the 20rem panel starts on-screen */}
            <div className={isCyberpunk ? '-mr-0.5' : undefined}>
              <ThemeSelector />
            </div>
          </div>
        </div>

        {/* Sections */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-3 flex flex-col gap-1">
          {sections.map((section, sIdx) => (
            <React.Fragment key={section.title}>
              {sIdx > 0 && <div className={dividerClass} />}
              <div className={sectionTitleClass}>{section.title}</div>
              {section.items.map((item, iIdx) => (
                <button
                  key={item.label}
                  ref={sIdx === 0 && iIdx === 0 ? firstItemRef : undefined}
                  type="button"
                  onClick={() => handleItemClick(item.onClick)}
                  className={itemClass(item.accent, item.pressed)}
                  aria-pressed={item.pressed !== undefined ? item.pressed : undefined}
                >
                  <span className="text-base w-6 text-center flex-shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* Bottom padding for safe area */}
        <div className="h-8" />
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;

  // Portal out of the header: its backdrop-filter makes it a containing block
  // for fixed descendants, which would clip the backdrop to the header height.
  return ReactDOM.createPortal(drawerContent, document.body);
};

export default MobileDrawer;
