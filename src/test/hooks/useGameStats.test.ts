import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStats } from '../../hooks/useGameStats';
import { usePokemonStore } from '../../store/usePokemonStore';

describe('useGameStats', () => {
    beforeEach(() => {
        // Reset the Zustand store gameStats before each test to avoid cross-test leakage
        usePokemonStore.setState({ gameStats: {} });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with empty stats', () => {
        const { result } = renderHook(() => useGameStats());
        const stats = result.current.getStats('test-game');
        expect(stats.gamesPlayed).toBe(0);
        expect(stats.currentStreak).toBe(0);
    });

    it('should record a win and start streak', () => {
        // Use a fixed date
        vi.setSystemTime(new Date(2023, 0, 1, 12)); // Jan 1 2023
        const { result } = renderHook(() => useGameStats());

        act(() => {
            result.current.recordResult('test-game', true);
        });

        const stats = result.current.getStats('test-game');
        expect(stats.gamesPlayed).toBe(1);
        expect(stats.gamesWon).toBe(1);
        expect(stats.currentStreak).toBe(1);
        expect(stats.lastPlayedDate).toBe('2023-01-01');
    });

    it('should increment streak on consecutive daily wins', () => {
        const { result } = renderHook(() => useGameStats());

        // Day 1
        vi.setSystemTime(new Date(2023, 0, 1, 12));
        act(() => {
            result.current.recordResult('test-game', true);
        });

        // Day 2
        vi.setSystemTime(new Date(2023, 0, 2, 12));
        act(() => {
            result.current.recordResult('test-game', true);
        });

        const stats = result.current.getStats('test-game');
        expect(stats.currentStreak).toBe(2);
        expect(stats.maxStreak).toBe(2);
    });

    it('should reset streak on loss', () => {
        const { result } = renderHook(() => useGameStats());

        // Day 1 Win
        vi.setSystemTime(new Date(2023, 0, 1, 12));
        act(() => {
            result.current.recordResult('test-game', true);
        });

        // Day 2 Loss
        vi.setSystemTime(new Date(2023, 0, 2, 12));
        act(() => {
            result.current.recordResult('test-game', false);
        });

        const stats = result.current.getStats('test-game');
        expect(stats.currentStreak).toBe(0);
        expect(stats.maxStreak).toBe(1); // Max preserved
    });

    it('should reset streak on skipped day', () => {
        const { result } = renderHook(() => useGameStats());

        // Day 1 Win
        vi.setSystemTime(new Date(2023, 0, 1, 12));
        act(() => {
            result.current.recordResult('test-game', true);
        });

        // Day 3 Win (Day 2 skipped)
        vi.setSystemTime(new Date(2023, 0, 3, 12));
        act(() => {
            result.current.recordResult('test-game', true);
        });

        const stats = result.current.getStats('test-game');
        expect(stats.currentStreak).toBe(1); // Reset to 1
        expect(stats.maxStreak).toBe(1);
    });

    it('should prevent double recording on same day', () => {
        vi.setSystemTime(new Date(2023, 0, 1, 12));
        const { result } = renderHook(() => useGameStats());

        act(() => {
            result.current.recordResult('test-game', true);
        });

        act(() => {
            result.current.recordResult('test-game', false); // Should be ignored
        });

        const stats = result.current.getStats('test-game');
        expect(stats.gamesPlayed).toBe(1);
        expect(stats.gamesWon).toBe(1);
        expect(stats.currentStreak).toBe(1);
    });
});
