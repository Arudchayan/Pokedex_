import { create } from 'zustand';

interface ModalStoreState {
  showComparison: boolean;
  showBattleCalc: boolean;
  showStatCalc: boolean;
  showBreedingCalc: boolean;
  showCatchCalc: boolean;
  showGameHub: boolean;
  showShinyCalc: boolean;
  showMoveDex: boolean;
  showAbilityDex: boolean;
  showItemDex: boolean;
  showNatureChart: boolean;
  showTypeChart: boolean;
  showDataManagement: boolean;
  showAchievements: boolean;
  showWalkersSettings: boolean;
  showMenu: boolean;
  dexSearchTerm: string;
}

interface ModalStoreActions {
  setShowComparison: (v: boolean) => void;
  setShowBattleCalc: (v: boolean) => void;
  setShowStatCalc: (v: boolean) => void;
  setShowBreedingCalc: (v: boolean) => void;
  setShowCatchCalc: (v: boolean) => void;
  setShowGameHub: (v: boolean) => void;
  setShowShinyCalc: (v: boolean) => void;
  setShowMoveDex: (v: boolean) => void;
  setShowAbilityDex: (v: boolean) => void;
  setShowItemDex: (v: boolean) => void;
  setShowNatureChart: (v: boolean) => void;
  setShowTypeChart: (v: boolean) => void;
  setShowDataManagement: (v: boolean) => void;
  setShowAchievements: (v: boolean) => void;
  setShowWalkersSettings: (v: boolean) => void;
  setShowMenu: (v: boolean) => void;
  setDexSearchTerm: (v: string) => void;
  closeAll: () => void;
  openComparison: () => void;
  openBattleCalc: () => void;
  openStatCalc: () => void;
  openBreedingCalc: () => void;
  openCatchCalc: () => void;
  openGameHub: () => void;
  openShinyCalc: () => void;
  openMoveDex: (search?: string) => void;
  openAbilityDex: (search?: string) => void;
  openItemDex: (search?: string) => void;
  openNatureChart: () => void;
  openTypeChart: () => void;
  openDataManagement: () => void;
  openAchievements: () => void;
  openWalkersSettings: () => void;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const initialState: ModalStoreState = {
  showComparison: false,
  showBattleCalc: false,
  showStatCalc: false,
  showBreedingCalc: false,
  showCatchCalc: false,
  showGameHub: false,
  showShinyCalc: false,
  showMoveDex: false,
  showAbilityDex: false,
  showItemDex: false,
  showNatureChart: false,
  showTypeChart: false,
  showDataManagement: false,
  showAchievements: false,
  showWalkersSettings: false,
  showMenu: false,
  dexSearchTerm: '',
};

export const useModalStore = create<ModalStoreState & ModalStoreActions>((set) => ({
  ...initialState,

  setShowComparison: (v) => set({ showComparison: v }),
  setShowBattleCalc: (v) => set({ showBattleCalc: v }),
  setShowStatCalc: (v) => set({ showStatCalc: v }),
  setShowBreedingCalc: (v) => set({ showBreedingCalc: v }),
  setShowCatchCalc: (v) => set({ showCatchCalc: v }),
  setShowGameHub: (v) => set({ showGameHub: v }),
  setShowShinyCalc: (v) => set({ showShinyCalc: v }),
  setShowMoveDex: (v) => set({ showMoveDex: v }),
  setShowAbilityDex: (v) => set({ showAbilityDex: v }),
  setShowItemDex: (v) => set({ showItemDex: v }),
  setShowNatureChart: (v) => set({ showNatureChart: v }),
  setShowTypeChart: (v) => set({ showTypeChart: v }),
  setShowDataManagement: (v) => set({ showDataManagement: v }),
  setShowAchievements: (v) => set({ showAchievements: v }),
  setShowWalkersSettings: (v) => set({ showWalkersSettings: v }),
  setShowMenu: (v) => set({ showMenu: v }),
  setDexSearchTerm: (v) => set({ dexSearchTerm: v }),

  closeAll: () => set(initialState),

  openComparison: () => set({ showComparison: true }),
  openBattleCalc: () => set({ showBattleCalc: true }),
  openStatCalc: () => set({ showStatCalc: true }),
  openBreedingCalc: () => set({ showBreedingCalc: true }),
  openCatchCalc: () => set({ showCatchCalc: true }),
  openGameHub: () => set({ showGameHub: true }),
  openShinyCalc: () => set({ showShinyCalc: true }),
  openMoveDex: (search) =>
    set({ showMoveDex: true, dexSearchTerm: typeof search === 'string' ? search : '' }),
  openAbilityDex: (search) =>
    set({ showAbilityDex: true, dexSearchTerm: typeof search === 'string' ? search : '' }),
  openItemDex: (search) =>
    set({ showItemDex: true, dexSearchTerm: typeof search === 'string' ? search : '' }),
  openNatureChart: () => set({ showNatureChart: true }),
  openTypeChart: () => set({ showTypeChart: true }),
  openDataManagement: () => set({ showDataManagement: true }),
  openAchievements: () => set({ showAchievements: true }),
  openWalkersSettings: () => set({ showWalkersSettings: true }),
  openMenu: () => set({ showMenu: true }),
  closeMenu: () => set({ showMenu: false }),
  toggleMenu: () => set((s) => ({ showMenu: !s.showMenu })),
}));
