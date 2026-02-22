import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import SearchBar from './SearchBar';
import ThemeSelector from './ThemeSelector';
import MobileDrawer from './MobileDrawer';
import { playUISound, toggleAudio as toggleAudioService, isAudioEnabled } from '../../services/soundService';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useAchievements } from '../../context/AchievementContext';
import { usePokemonUI } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import { useModalStore } from '../../store/useModalStore';
import { useFilterController } from '../../hooks/useFilterController';

interface AppHeaderProps {
  onRandomPokemon: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = memo(({ onRandomPokemon }) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(isAudioEnabled());
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // UI state from stores / context
  const { theme, isCyberpunk, isShiny } = usePokemonUI();
  const searchTerm = usePokemonStore((s) => s.searchTerm);
  const comparisonListLength = usePokemonStore((s) => s.comparisonList.length);
  const { handleSearchChange } = useFilterController();
  const { unlockAchievement } = useAchievements();

  // Modal store (useShallow so we only re-render when showMenu changes; actions are stable)
  const {
    showMenu,
    toggleMenu,
    closeMenu,
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
    openBattleCalc,
    openStatCalc,
    openShinyCalc,
    openComparison,
    openAchievements,
  } = useModalStore(useShallow((s) => ({
    showMenu: s.showMenu,
    toggleMenu: s.toggleMenu,
    closeMenu: s.closeMenu,
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
    openBattleCalc: s.openBattleCalc,
    openStatCalc: s.openStatCalc,
    openShinyCalc: s.openShinyCalc,
    openComparison: s.openComparison,
    openAchievements: s.openAchievements,
  })));

  // Local handlers
  const handleToggleAudio = useCallback(() => {
    const newState = toggleAudioService();
    setAudioEnabled(newState);
    playUISound('click');
  }, []);

  useClickOutside(menuRef, () => closeMenu(), showMenu);

  useEffect(() => {
    if (!showMenu) {
      // If focus was inside the menu, restore it to the trigger.
      const lastActive = lastActiveElementRef.current;
      const shouldRestore =
        !!lastActive &&
        (menuRef.current?.contains(lastActive) || lastActive === menuButtonRef.current);

      if (shouldRestore) {
        menuButtonRef.current?.focus();
      }

      lastActiveElementRef.current = null;
      return;
    }

    lastActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Move focus into the menu for keyboard users.
    requestAnimationFrame(() => {
      firstMenuItemRef.current?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      closeMenu();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showMenu, closeMenu]);

  // Achievement Wrappers
  const handleToggleShiny = () => {
    usePokemonStore.getState().toggleShiny();
    unlockAchievement('shiny_hunter');
  };

  const handleShowBreeding = () => {
    openBreedingCalc();
    unlockAchievement('breeder');
  };

  const handleShowBattle = () => {
    openBattleCalc();
    unlockAchievement('strategist');
  };

  const handleShowCatchCalc = () => {
    openCatchCalc();
  };

  const handleShowTypeChart = () => {
    openTypeChart();
    unlockAchievement('strategist');
  };

  const handleShowGameHub = () => {
    openGameHub();
    unlockAchievement('knowledge_seeker');
  };

  return (
    <header className={`sticky top-0 z-sticky border-b backdrop-blur-xl ${isCyberpunk
      ? 'cyber-header'
      : theme === 'dark'
        ? 'border-white/10 bg-slate-950/90'
        : 'border-slate-200 bg-white/90'
      }`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
              alt="Pokeball"
              className="h-11 w-11 drop-shadow-lg"
            />
            <div>
              <h1 className={`text-4xl font-black tracking-tight sm:text-5xl ${isCyberpunk
                ? 'cyber-title'
                : theme === 'dark'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300'
                  : 'text-slate-800'
                }`}>
                Pokedex
              </h1>
              <p className={`text-sm ${isCyberpunk
                ? 'cyber-text opacity-70'
                : theme === 'dark'
                  ? 'text-slate-400'
                  : 'text-slate-500'
                }`}>
                {isCyberpunk
                  ? 'PC Box System Online - Digital Pokemon Mode Active'
                  : 'Explore every species with instant filtering, encounter data, and team analytics.'
                }
              </p>
            </div>

            {/* Utility buttons */}
            <div className="flex gap-2 items-center">
              {/* Mobile drawer toggle - visible below md */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className={`md:hidden p-2 rounded-lg border transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                aria-label="Open navigation menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
                </svg>
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={toggleMenu}
                  ref={menuButtonRef}
                  className={`p-2 rounded-lg border transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900'}`}
                  aria-label="Menu"
                  aria-expanded={showMenu}
                  aria-haspopup="menu"
                  aria-controls={menuId}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                {showMenu && (
                  <div
                    id={menuId}
                    role="menu"
                    aria-label="Quick tools"
                    className={`absolute top-full mt-2 right-0 w-56 rounded-xl shadow-2xl border p-2 z-50 flex flex-col gap-1 ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
                      }`}
                  >
                    <button ref={firstMenuItemRef} type="button" role="menuitem" onClick={() => { openMoveDex(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Move Dex</button>
                    <button type="button" role="menuitem" onClick={() => { openAbilityDex(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Ability Dex</button>
                    <button type="button" role="menuitem" onClick={() => { openItemDex(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Item Dex</button>
                    <button type="button" role="menuitem" onClick={() => { handleShowBreeding(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Breeding Calculator</button>
                    <button type="button" role="menuitem" onClick={() => { openNatureChart(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Nature Chart</button>
                    <button type="button" role="menuitem" onClick={() => { handleShowTypeChart(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Type Chart</button>
                    <div className={`h-px w-full my-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                    <button type="button" role="menuitem" onClick={() => { openDataManagement(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Data Management</button>
                    <button type="button" role="menuitem" onClick={() => { openWalkersSettings(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Pokemon Walkers</button>
                    <div className={`h-px w-full my-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                    <button type="button" role="menuitem" onClick={() => { handleShowGameHub(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Game Hub</button>
                    <button type="button" role="menuitem" onClick={() => { handleShowBattle(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Damage Calculator</button>
                    <button type="button" role="menuitem" onClick={() => { openStatCalc(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Stat Calculator</button>
                    <button type="button" role="menuitem" onClick={() => { handleShowCatchCalc(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Catch Calculator</button>
                    <button type="button" role="menuitem" onClick={() => { openShinyCalc(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Shiny Odds Calculator</button>
                    <div className={`h-px w-full my-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                    <button type="button" role="menuitem" onClick={() => { openAchievements(); closeMenu(); }} className={`p-2 text-left rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Achievements</button>
                  </div>
                )}
              </div>

              <ThemeSelector />

              <button
                type="button"
                onClick={handleToggleShiny}
                className={`p-2 rounded-lg border transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none ${isShiny
                  ? 'bg-pink-500/20 border-pink-400/40 hover:bg-pink-500/30 text-pink-300'
                  : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-pink-300' : 'bg-slate-200 border-slate-300 text-slate-500 hover:text-pink-500'
                  }`}
                title={isShiny ? 'Disable Shiny Mode (Shift+S)' : 'Enable Shiny Mode (Shift+S)'}
                aria-label={isShiny ? 'Disable Shiny Mode' : 'Enable Shiny Mode'}
                aria-pressed={isShiny}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </button>

              {comparisonListLength > 0 && (
                <button
                  type="button"
                  onClick={openComparison}
                  className="relative p-2 rounded-lg bg-primary-500/20 border border-primary-400/40 hover:bg-primary-500/30 transition-all hover:scale-105 animate-pulse-glow focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none"
                  title={`Compare ${comparisonListLength} Pokemon`}
                  aria-label={`Compare ${comparisonListLength} Pokemon`}
                >
                  <svg className="w-5 h-5 text-primary-500 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {comparisonListLength}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`p-2 rounded-lg border transition-all focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
                title={audioEnabled ? 'Mute sounds' : 'Enable sounds'}
                aria-label={audioEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {audioEnabled ? (
                  <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>
              <a
                href="https://github.com/Arudchayan/Pokedex_"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg border transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
                title="View on GitHub"
                aria-label="View on GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div className="flex gap-2 w-full max-w-md md:max-w-sm">
            <SearchBar
              id="main-search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={isCyberpunk ? "Scan database..." : "Search Pokemon..."}
              className="w-full"
              isCyberpunk={isCyberpunk}
              theme={theme}
              inputRef={searchInputRef}
            />
            <button
              type="button"
              onClick={onRandomPokemon}
              className={`p-2 rounded-lg border transition-all hover:scale-105 flex-shrink-0 ${theme === 'dark' ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-100 border-indigo-200 text-indigo-600 hover:bg-indigo-200'}`}
              title="Random Pokemon (Shift + R)"
              aria-label="Random Pokemon"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onRandomPokemon={onRandomPokemon}
      />
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
