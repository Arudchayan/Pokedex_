import { describe, it, expect } from 'vitest';
import { calculateCatchProbability, getBallMultiplier, BALL_TYPES } from '../utils/catchUtils';

describe('Catch Calculator Logic', () => {
    it('calculates probability correctly for Master Ball', () => {
        const prob = calculateCatchProbability({
            captureRate: 45,
            ballMultiplier: 255,
            statusMultiplier: 1,
            hpPercent: 100,
            isMasterBall: true
        });
        expect(prob).toBe(100);
    });

    it('calculates higher probability for lower HP', () => {
        const highHpProb = calculateCatchProbability({
            captureRate: 45,
            ballMultiplier: 1,
            statusMultiplier: 1,
            hpPercent: 100
        });

        const lowHpProb = calculateCatchProbability({
            captureRate: 45,
            ballMultiplier: 1,
            statusMultiplier: 1,
            hpPercent: 1
        });

        expect(lowHpProb).toBeGreaterThan(highHpProb);
    });

    it('calculates higher probability for better balls', () => {
        const pokeBallProb = calculateCatchProbability({
            captureRate: 45,
            ballMultiplier: BALL_TYPES.POKE_BALL.multiplier,
            statusMultiplier: 1,
            hpPercent: 50
        });

        const ultraBallProb = calculateCatchProbability({
            captureRate: 45,
            ballMultiplier: BALL_TYPES.ULTRA_BALL.multiplier,
            statusMultiplier: 1,
            hpPercent: 50
        });

        expect(ultraBallProb).toBeGreaterThan(pokeBallProb);
    });

    it('calculates status condition bonus', () => {
        const normalProb = calculateCatchProbability({
            captureRate: 45,
            ballMultiplier: 1,
            statusMultiplier: 1,
            hpPercent: 50
        });

        const sleepProb = calculateCatchProbability({
            captureRate: 45,
            ballMultiplier: 1,
            statusMultiplier: 2.5,
            hpPercent: 50
        });

        expect(sleepProb).toBeGreaterThan(normalProb);
    });

    it('getBallMultiplier handles Net Ball condition correctly', () => {
        expect(getBallMultiplier('NET_BALL', ['water'])).toBe(3.5);
        expect(getBallMultiplier('NET_BALL', ['bug'])).toBe(3.5);
        expect(getBallMultiplier('NET_BALL', ['fire'])).toBe(1);
    });

    it('getBallMultiplier handles Dusk Ball condition correctly', () => {
        expect(getBallMultiplier('DUSK_BALL', [], true)).toBe(3.0);
        expect(getBallMultiplier('DUSK_BALL', [], false)).toBe(1);
    });

    it('getBallMultiplier handles Quick Ball condition correctly', () => {
        expect(getBallMultiplier('QUICK_BALL', [], false, 1)).toBe(5.0);
        expect(getBallMultiplier('QUICK_BALL', [], false, 2)).toBe(1);
    });
});
