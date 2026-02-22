import { useCallback } from 'react';
import { usePokemonStore } from '../store/usePokemonStore';
import type { GameStats } from '../store/pokemonStoreTypes';

export type { GameStats };

export interface GameStatsHook {
  stats: Record<string, GameStats>;
  getStats: (gameId: string) => GameStats;
  recordResult: (gameId: string, win: boolean) => void;
  hasPlayedToday: (gameId: string) => boolean;
}

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialStats = (gameId: string): GameStats => ({
  gameId,
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: null,
  history: [],
});

/**
 * Game stats hook backed by the Zustand store (persisted via Zustand persist middleware).
 * Replaces the former manual localStorage read/write implementation.
 */
export const useGameStats = (): GameStatsHook => {
  // Read from Zustand store — single source of truth
  const allStats = usePokemonStore((s) => s.gameStats);
  const storeRecordResult = usePokemonStore((s) => s.recordGameResult);

  const getStats = useCallback((gameId: string): GameStats => {
    return allStats[gameId] || initialStats(gameId);
  }, [allStats]);

  const hasPlayedToday = useCallback((gameId: string): boolean => {
    const stats = allStats[gameId];
    if (!stats || !stats.lastPlayedDate) return false;
    return stats.lastPlayedDate === getTodayDateString();
  }, [allStats]);

  const recordResult = useCallback((gameId: string, win: boolean) => {
    // Delegate to Zustand store action — the reducer handles dedup and streak logic
    storeRecordResult(gameId, win);
  }, [storeRecordResult]);

  return {
    stats: allStats,
    getStats,
    recordResult,
    hasPlayedToday,
  };
};
