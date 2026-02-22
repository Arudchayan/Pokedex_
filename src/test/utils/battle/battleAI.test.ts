import { describe, it, expect, vi } from 'vitest';
import { BattleAI } from '../../../utils/battle/battleAI';
import { Battle } from '../../../utils/battle/battleEngine';
import { BattlePokemon, TypeName } from '../../../utils/battle/types';

// Simplified helper to create mock Pokemon
const makeMockMon = (id: string, name: string, types: TypeName[], hpPercent: number = 100): BattlePokemon => {
    const maxHp = 100;
    const currentHp = Math.floor(maxHp * (hpPercent / 100));
    return {
        id,
        name,
        speciesId: 1,
        types: types as [TypeName, TypeName?],
        level: 50,
        gender: 'M',
        baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        stats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        currentHp,
        maxHp,
        status: 'none',
        statStages: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        moves: [], // No moves needed for this specific switch logic test
        ability: 'none',
        item: 'none',
        spriteBack: '',
        spriteFront: ''
    };
};

describe('BattleAI Switch Logic', () => {
    it('should prioritize type advantage over simple HP heuristic', () => {
        // Player: Fire type (Charizard)
        const playerMon = makeMockMon('p1', 'Charizard', ['fire', 'flying']);

        // AI Team
        // 0. Fainted Mon (so AI is forced to switch)
        const aiFainted = makeMockMon('ai0', 'Fainted', ['normal'], 0);

        // 1. Grass Type (Weak to Fire) - Full HP
        // Existing logic would pick this if it comes first and has high HP
        const aiGrass = makeMockMon('ai1', 'Venusaur', ['grass', 'poison'], 100);

        // 2. Water Type (Resists Fire, SE against Fire) - Full HP
        // New logic should pick this
        const aiWater = makeMockMon('ai2', 'Blastoise', ['water'], 100);

        // 3. Normal Type (Neutral) - Full HP
        const aiNormal = makeMockMon('ai3', 'Snorlax', ['normal'], 100);

        const battle = new Battle(
            [playerMon],
            [aiFainted, aiGrass, aiWater, aiNormal],
            () => {}
        );

        // Force turn 1 state where AI needs to switch
        // In reality, if active is fainted, getBestAction calls getBestSwitch
        const ai = new BattleAI(battle);

        const action = ai.getBestSwitch();

        console.log('Switch Action chosen:', action);

        // Expectation:
        // Before fix: Likely returns index 1 (Grass) because it's the first full HP mon.
        // After fix: Should return index 2 (Water) because Water > Fire.

        // We assert strictly for the correct behavior.
        // If this fails, it confirms we need the fix.
        expect(action.type).toBe('switch');
        expect(action.switchTargetIndex).toBe(2); // Blastoise
    });

    it('should avoid switching into a weakness even if HP is higher', () => {
        const playerMon = makeMockMon('p1', 'ElectricMon', ['electric']);

        const aiFainted = makeMockMon('ai0', 'Fainted', ['normal'], 0);

        // 1. Water Type (Weak to Electric) - 100% HP
        const aiWater = makeMockMon('ai1', 'WaterMon', ['water'], 100);

        // 2. Ground Type (Immune to Electric) - 80% HP
        const aiGround = makeMockMon('ai2', 'GroundMon', ['ground'], 80);

        const battle = new Battle(
            [playerMon],
            [aiFainted, aiWater, aiGround],
            () => {}
        );

        const ai = new BattleAI(battle);
        const action = ai.getBestSwitch();

        // Should pick Ground (immunity) over Water (weakness) despite HP difference
        expect(action.type).toBe('switch');
        expect(action.switchTargetIndex).toBe(2);
    });
});
