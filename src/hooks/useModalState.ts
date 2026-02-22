import { useModalStore } from '../store/useModalStore';

/**
 * Hook for managing multiple modal states.
 * Backed by a shared Zustand store so state is consistent across all callers.
 */
export function useModalState() {
  const store = useModalStore();

  const modals = {
    comparison: { show: store.showComparison, setShow: store.setShowComparison },
    battleCalc: { show: store.showBattleCalc, setShow: store.setShowBattleCalc },
    statCalc: { show: store.showStatCalc, setShow: store.setShowStatCalc },
    breedingCalc: { show: store.showBreedingCalc, setShow: store.setShowBreedingCalc },
    catchCalc: { show: store.showCatchCalc, setShow: store.setShowCatchCalc },
    gameHub: { show: store.showGameHub, setShow: store.setShowGameHub },
    shinyCalc: { show: store.showShinyCalc, setShow: store.setShowShinyCalc },
    moveDex: { show: store.showMoveDex, setShow: store.setShowMoveDex },
    abilityDex: { show: store.showAbilityDex, setShow: store.setShowAbilityDex },
    itemDex: { show: store.showItemDex, setShow: store.setShowItemDex },
    natureChart: { show: store.showNatureChart, setShow: store.setShowNatureChart },
    typeChart: { show: store.showTypeChart, setShow: store.setShowTypeChart },
    dataManagement: { show: store.showDataManagement, setShow: store.setShowDataManagement },
    achievements: { show: store.showAchievements, setShow: store.setShowAchievements },
    walkersSettings: { show: store.showWalkersSettings, setShow: store.setShowWalkersSettings },
    menu: { show: store.showMenu, setShow: store.setShowMenu },
  };

  return {
    modals,
    closeAll: store.closeAll,
    // Individual getters and setters for convenience
    showComparison: store.showComparison,
    setShowComparison: store.setShowComparison,
    showBattleCalc: store.showBattleCalc,
    setShowBattleCalc: store.setShowBattleCalc,
    showStatCalc: store.showStatCalc,
    setShowStatCalc: store.setShowStatCalc,
    showBreedingCalc: store.showBreedingCalc,
    setShowBreedingCalc: store.setShowBreedingCalc,
    showCatchCalc: store.showCatchCalc,
    setShowCatchCalc: store.setShowCatchCalc,
    showGameHub: store.showGameHub,
    setShowGameHub: store.setShowGameHub,
    showShinyCalc: store.showShinyCalc,
    setShowShinyCalc: store.setShowShinyCalc,
    showMoveDex: store.showMoveDex,
    setShowMoveDex: store.setShowMoveDex,
    showAbilityDex: store.showAbilityDex,
    setShowAbilityDex: store.setShowAbilityDex,
    showItemDex: store.showItemDex,
    setShowItemDex: store.setShowItemDex,
    showNatureChart: store.showNatureChart,
    setShowNatureChart: store.setShowNatureChart,
    showTypeChart: store.showTypeChart,
    setShowTypeChart: store.setShowTypeChart,
    showDataManagement: store.showDataManagement,
    setShowDataManagement: store.setShowDataManagement,
    showAchievements: store.showAchievements,
    setShowAchievements: store.setShowAchievements,
    showWalkersSettings: store.showWalkersSettings,
    setShowWalkersSettings: store.setShowWalkersSettings,
    showMenu: store.showMenu,
    setShowMenu: store.setShowMenu,
    dexSearchTerm: store.dexSearchTerm,
    setDexSearchTerm: store.setDexSearchTerm,
    // Stable handlers
    openComparison: store.openComparison,
    openBattleCalc: store.openBattleCalc,
    openStatCalc: store.openStatCalc,
    openBreedingCalc: store.openBreedingCalc,
    openCatchCalc: store.openCatchCalc,
    openGameHub: store.openGameHub,
    openShinyCalc: store.openShinyCalc,
    openMoveDex: store.openMoveDex,
    openAbilityDex: store.openAbilityDex,
    openItemDex: store.openItemDex,
    openNatureChart: store.openNatureChart,
    openTypeChart: store.openTypeChart,
    openDataManagement: store.openDataManagement,
    openAchievements: store.openAchievements,
    openWalkersSettings: store.openWalkersSettings,
    openMenu: store.openMenu,
    closeMenu: store.closeMenu,
    toggleMenu: store.toggleMenu,
  };
}
