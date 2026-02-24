import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useToast } from './ToastContext';
import { playUISound } from '../services/soundService';
import { usePokemonStore } from '../store/usePokemonStore';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number; // timestamp
}

export const ACHIEVEMENTS_LIST: Omit<Achievement, 'unlockedAt'>[] = [
  {
    id: 'novice_trainer',
    title: 'Novice Trainer',
    description: 'Add your first Pokémon to the team.',
    icon: '🧢',
  },
  {
    id: 'full_squad',
    title: 'Full Squad',
    description: 'Build a full team of 6 Pokémon.',
    icon: '👥',
  },
  {
    id: 'shiny_hunter',
    title: 'Shiny Hunter',
    description: 'Enable Shiny Mode.',
    icon: '✨',
  },
  {
    id: 'breeder',
    title: 'Master Breeder',
    description: 'Open the Breeding Calculator.',
    icon: '🥚',
  },
  {
    id: 'strategist',
    title: 'Battle Strategist',
    description: 'Use the Battle Calculator or Type Chart.',
    icon: '⚔️',
  },
  {
    id: 'data_hoarder',
    title: 'Data Hoarder',
    description: 'Import a team from JSON or Showdown.',
    icon: '💾',
  },
  {
    id: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    description: 'Visit the Game Hub.',
    icon: '🎮',
  },
  {
    id: 'quiz_master',
    title: 'Quiz Master',
    description: 'Guess correctly in "Who\'s That Pokémon?".',
    icon: '❓',
  },
  {
    id: 'tour_graduate',
    title: 'Tour Graduate',
    description: 'Complete all walkthrough tours.',
    icon: '🎓',
  },
];

interface AchievementContextType {
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  progress: number; // 0 to 100
  totalUnlocked: number;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  // Read achievements from Zustand (single source of truth)
  const unlocked = usePokemonStore((s) => s.achievements);
  const storeUnlock = usePokemonStore((s) => s.unlockAchievement);

  const unlockAchievement = useCallback(
    (id: string) => {
      if (unlocked[id]) return; // Already unlocked

      const achievement = ACHIEVEMENTS_LIST.find((a) => a.id === id);
      if (!achievement) return;

      // Dispatch to Zustand store — persisted automatically via Zustand persist middleware
      storeUnlock(id);

      playUISound('success');
      addToast(`Achievement Unlocked: ${achievement.title}!`, 'success');
    },
    [unlocked, storeUnlock, addToast]
  );

  const achievements: Achievement[] = useMemo(
    () => ACHIEVEMENTS_LIST.map((a) => ({ ...a, unlockedAt: unlocked[a.id] })),
    [unlocked]
  );

  const totalUnlocked = Object.keys(unlocked).length;
  const progress = Math.round((totalUnlocked / ACHIEVEMENTS_LIST.length) * 100);

  const value = useMemo(
    () => ({ achievements, unlockAchievement, progress, totalUnlocked }),
    [achievements, unlockAchievement, progress, totalUnlocked]
  );

  return <AchievementContext.Provider value={value}>{children}</AchievementContext.Provider>;
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
