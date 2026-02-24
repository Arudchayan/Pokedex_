import { describe, it, expect } from 'vitest';
import { calculateDamage, calculateStat, BattleContext } from '../../utils/damageFormula';

describe('Damage Formula Logic', () => {
  // Garchomp (Level 50) Stats
  // Base: 108 HP, 130 Atk, 95 Def, 80 SpA, 85 SpD, 102 Spe
  const garchompBase = [
    { name: 'hp', value: 108 },
    { name: 'attack', value: 130 },
    { name: 'defense', value: 95 },
    { name: 'special-attack', value: 80 },
    { name: 'special-defense', value: 85 },
    { name: 'speed', value: 102 },
  ];

  // Tyranitar (Level 50) Stats
  // Base: 100 HP, 134 Atk, 110 Def, 95 SpA, 100 SpD, 61 Spe
  const tyranitarBase = [
    { name: 'hp', value: 100 },
    { name: 'attack', value: 134 },
    { name: 'defense', value: 110 },
    { name: 'special-attack', value: 95 },
    { name: 'special-defense', value: 100 },
    { name: 'speed', value: 61 },
  ];

  describe('calculateStat', () => {
    it('calculates HP correctly (Garchomp Lvl 50, 31 IV, 0 EV)', () => {
      // Formula: floor(0.01 * (2 * 108 + 31 + 0) * 50) + 50 + 10
      // = floor(0.01 * 247 * 50) + 60
      // = floor(123.5) + 60 = 123 + 60 = 183
      const hp = calculateStat('hp', 108, 31, 0, 50, 'Hardy');
      expect(hp).toBe(183);
    });

    it('calculates Attack correctly (Garchomp Lvl 50, 31 IV, 252 EV, Jolly)', () => {
      // Formula: (floor(0.01 * (2 * 130 + 31 + 63) * 50) + 5) * 1.0 (Neutral nature for Attack)
      // = (floor(0.01 * 354 * 50) + 5)
      // = (177 + 5) = 182
      const atk = calculateStat('attack', 130, 31, 252, 50, 'Jolly');
      expect(atk).toBe(182);
    });

    it('calculates Speed correctly with Nature Boost (Garchomp Lvl 50, 31 IV, 252 EV, Jolly)', () => {
      // Base 102
      // Inner = floor(0.01 * (2 * 102 + 31 + 63) * 50) + 5
      // = floor(0.01 * 298 * 50) + 5
      // = 149 + 5 = 154
      // Nature (Jolly +Spe) = floor(154 * 1.1) = 169
      const spe = calculateStat('speed', 102, 31, 252, 50, 'Jolly');
      expect(spe).toBe(169);
    });
  });

  describe('calculateDamage', () => {
    it('calculates Earthquake Damage (Garchomp vs Tyranitar)', () => {
      // Garchomp (Atk 182) uses Earthquake (100 BP) vs Tyranitar (Def 130 - assuming 0 EV/IV neutral for simplicity, let's verify)

      // Tyranitar Def (Base 110, 31 IV, 0 EV, Neutral)
      // = floor(0.01 * (220 + 31) * 50) + 5 = floor(125.5) + 5 = 130
      const defStat = calculateStat('defense', 110, 31, 0, 50, 'Hardy');
      expect(defStat).toBe(130);

      // Attacker: Garchomp (182 Atk)
      // Defender: Tyranitar (130 Def)
      // Move: Earthquake (100 BP, Ground, Physical)
      // Modifiers:
      // STAB (Yes, 1.5)
      // Type (Ground vs Rock/Dark) -> Ground vs Rock = 2x, Ground vs Dark = 1x -> 2x
      // Total Mult = 3.0

      // Base Damage Formula:
      // Lvl term = (2 * 50 / 5 + 2) = 22
      // Numerator = 22 * 100 * 182 / 130 = 3080
      // Term = floor(3080 / 50) + 2 = 61 + 2 = 63
      // Final = 63 * 3 = 189 (Max)

      const ctx: BattleContext = {
        attacker: {
          name: 'Garchomp',
          level: 50,
          types: ['dragon', 'ground'],
          stats: garchompBase,
          evs: { attack: 252 },
          ivs: { attack: 31 },
          nature: 'Jolly', // +Spe, -SpA (Neutral Atk)
          item: 'None',
        },
        defender: {
          name: 'Tyranitar',
          level: 50,
          types: ['rock', 'dark'],
          stats: tyranitarBase,
          evs: { defense: 0, hp: 0 },
          ivs: { defense: 31, hp: 31 },
          nature: 'Hardy',
          item: 'None',
        },
        move: {
          name: 'Earthquake',
          power: 100,
          type: 'ground',
          damageClass: 'physical',
        },
      };

      const result = calculateDamage(ctx);

      // 63 base * 1.5 (STAB) -> 94 * 2 (Type) -> 188
      expect(result.max).toBe(188);
      expect(result.modifiers.typeEffectiveness).toBe(2);
      expect(result.modifiers.stab).toBe(true);
    });

    it('applies Life Orb correctly', () => {
      const ctx: BattleContext = {
        attacker: {
          name: 'Garchomp',
          level: 50,
          types: ['dragon', 'ground'],
          stats: garchompBase,
          evs: { attack: 252 },
          ivs: { attack: 31 },
          nature: 'Jolly',
          item: 'Life Orb', // 1.3x
        },
        defender: {
          name: 'Tyranitar',
          level: 50,
          types: ['rock', 'dark'],
          stats: tyranitarBase,
          evs: { defense: 0, hp: 0 },
          ivs: { defense: 31, hp: 31 },
          nature: 'Hardy',
          item: 'None',
        },
        move: {
          name: 'Earthquake',
          power: 100,
          type: 'ground',
          damageClass: 'physical',
        },
      };

      const result = calculateDamage(ctx);
      // Previous max 189 * 1.3 = 245.7 -> floor(245)
      expect(result.max).toBeGreaterThan(200);
      expect(result.modifiers.item).toBeCloseTo(1.3);
    });
  });

  describe('Ability Logic', () => {
    const createPokemon = (
      name: string,
      types: string[],
      ability: string = 'None',
      stats: any = {}
    ) => ({
      name,
      level: 50,
      types,
      stats: [
        { name: 'hp', value: stats.hp || 100 },
        { name: 'attack', value: stats.atk || 100 },
        { name: 'defense', value: stats.def || 100 },
        { name: 'special-attack', value: stats.spa || 100 },
        { name: 'special-defense', value: stats.spd || 100 },
        { name: 'speed', value: stats.spe || 100 },
      ],
      evs: { hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 },
      ivs: {
        hp: 31,
        attack: 31,
        defense: 31,
        'special-attack': 31,
        'special-defense': 31,
        speed: 31,
      },
      nature: 'Hardy',
      item: 'None',
      ability,
      status: 'None',
    });

    const createMove = (
      name: string,
      type: string,
      power: number,
      damageClass: 'physical' | 'special' = 'physical'
    ) => ({
      name,
      power,
      type,
      damageClass,
    });

    it('should double attack with Huge Power', () => {
      const attacker = createPokemon('Azumarill', ['water', 'fairy'], 'Huge Power', { atk: 50 });
      const defender = createPokemon('Dummy', ['normal'], 'None', { def: 100 });
      const move = createMove('Tackle', 'normal', 40);

      const ctxWith: BattleContext = { attacker, defender, move };
      const resultWith = calculateDamage(ctxWith);

      const attackerWithout = { ...attacker, ability: 'Thick Fat' };
      const ctxWithout: BattleContext = { attacker: attackerWithout, defender, move };
      const resultWithout = calculateDamage(ctxWithout);

      expect(resultWith.max).toBeGreaterThan(resultWithout.max * 1.8);
    });

    it('should apply Levitate immunity', () => {
      const attacker = createPokemon('Garchomp', ['dragon', 'ground'], 'None');
      const defender = createPokemon('Rotom', ['electric', 'ghost'], 'Levitate');
      const move = createMove('Earthquake', 'ground', 100);

      const ctx: BattleContext = { attacker, defender, move };
      const result = calculateDamage(ctx);

      expect(result.max).toBe(0);
      expect(result.modifiers.typeEffectiveness).toBe(0);
    });

    it('should apply Flash Fire immunity', () => {
      const attacker = createPokemon('Charizard', ['fire', 'flying'], 'None');
      const defender = createPokemon('Heatran', ['fire', 'steel'], 'Flash Fire');
      const move = createMove('Flamethrower', 'fire', 90, 'special');

      const ctx: BattleContext = { attacker, defender, move };
      const result = calculateDamage(ctx);

      expect(result.max).toBe(0);
      expect(result.modifiers.typeEffectiveness).toBe(0);
    });

    it('should apply Technician boost', () => {
      const attacker = createPokemon('Scizor', ['bug', 'steel'], 'Technician');
      const defender = createPokemon('Dummy', ['normal'], 'None');
      const move = createMove('Bullet Punch', 'steel', 40); // 40 <= 60

      const ctxWith: BattleContext = { attacker, defender, move };
      const resultWith = calculateDamage(ctxWith);

      const attackerWithout = { ...attacker, ability: 'Swarm' };
      const ctxWithout: BattleContext = { attacker: attackerWithout, defender, move };
      const resultWithout = calculateDamage(ctxWithout);

      expect(resultWith.max).toBeGreaterThan(resultWithout.max * 1.4);
    });

    it('should not apply Technician boost if power > 60', () => {
      const attacker = createPokemon('Scizor', ['bug', 'steel'], 'Technician');
      const defender = createPokemon('Dummy', ['normal'], 'None');
      const move = createMove('Iron Head', 'steel', 80); // > 60

      const ctxWith: BattleContext = { attacker, defender, move };
      const resultWith = calculateDamage(ctxWith);

      const attackerWithout = { ...attacker, ability: 'Swarm' };
      const ctxWithout: BattleContext = { attacker: attackerWithout, defender, move };
      const resultWithout = calculateDamage(ctxWithout);

      expect(resultWith.max).toBe(resultWithout.max);
    });

    it('should apply Wonder Guard immunity', () => {
      const attacker = createPokemon('Pikachu', ['electric'], 'None');
      const defender = createPokemon('Shedinja', ['bug', 'ghost'], 'Wonder Guard');
      const move = createMove('Thunderbolt', 'electric', 90, 'special');

      const ctx: BattleContext = { attacker, defender, move };
      const result = calculateDamage(ctx);

      expect(result.max).toBe(0);
    });

    it('should NOT apply Wonder Guard if Super Effective', () => {
      const attacker = createPokemon('Charizard', ['fire'], 'None');
      const defender = createPokemon('Shedinja', ['bug', 'ghost'], 'Wonder Guard');
      const move = createMove('Flamethrower', 'fire', 90, 'special');

      const ctx: BattleContext = { attacker, defender, move };
      const result = calculateDamage(ctx);

      expect(result.max).toBeGreaterThan(0);
    });

    it('should apply Tinted Lens', () => {
      const attacker = createPokemon('Venomoth', ['bug', 'poison'], 'Tinted Lens');
      const defender = createPokemon('Steelix', ['steel', 'ground'], 'None');
      const moveBug = createMove('Bug Buzz', 'bug', 90, 'special');

      const ctxWith: BattleContext = { attacker, defender, move: moveBug };
      const resultWith = calculateDamage(ctxWith);

      const attackerWithout = { ...attacker, ability: 'Shield Dust' };
      const ctxWithout: BattleContext = { attacker: attackerWithout, defender, move: moveBug };
      const resultWithout = calculateDamage(ctxWithout);

      expect(resultWith.max).toBeGreaterThan(resultWithout.max * 1.9);
    });
  });
});
