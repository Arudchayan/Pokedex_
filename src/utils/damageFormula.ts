import { NATURES, TYPE_RELATIONS } from '../constants';

export interface BattleStat {
  name: string;
  value: number; // Base Stat
}

export interface BattleContext {
  attacker: {
    name: string;
    level: number;
    types: string[];
    stats: BattleStat[]; // Base Stats
    evs: { [key: string]: number };
    ivs: { [key: string]: number };
    nature: string;
    item: string;
    ability?: string;
    status?: string;
  };
  defender: {
    name: string;
    level: number;
    types: string[];
    stats: BattleStat[]; // Base Stats
    evs: { [key: string]: number };
    ivs: { [key: string]: number };
    nature: string;
    item: string;
    ability?: string;
  };
  move: {
    name: string;
    power: number;
    type: string;
    damageClass: string; // 'physical' | 'special'
  };
}

export interface DamageResult {
  min: number;
  max: number;
  rolls: number[]; // Array of possible damage rolls (16 rolls typically)
  minPercent: number;
  maxPercent: number;
  modifiers: {
    typeEffectiveness: number;
    stab: boolean;
    crit: boolean;
    item: number;
    weather: number;
  };
}

// Gen 3+ Stat Formula
// HP = floor(0.01 x (2 x Base + IV + floor(0.25 x EV)) x Level) + Level + 10
// Other = (floor(0.01 x (2 x Base + IV + floor(0.25 x EV)) x Level) + 5) x Nature

export const calculateStat = (
  statName: string,
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureName: string
): number => {
  if (statName === 'hp') {
    if (base === 1) return 1; // Shedinja case (rare edge case, usually ignored in simple calcs but good to know)
    return Math.floor(0.01 * (2 * base + iv + Math.floor(0.25 * ev)) * level) + level + 10;
  }

  let stat = Math.floor(0.01 * (2 * base + iv + Math.floor(0.25 * ev)) * level) + 5;

  const nature = NATURES[natureName];
  if (nature) {
    if (nature.up === statName) stat = Math.floor(stat * 1.1);
    if (nature.down === statName) stat = Math.floor(stat * 0.9);
  }

  return stat;
};

export const calculateDamage = (ctx: BattleContext): DamageResult => {
  const { attacker, defender, move } = ctx;

  if (move.power === 0) {
    return {
      min: 0,
      max: 0,
      rolls: [],
      minPercent: 0,
      maxPercent: 0,
      modifiers: { typeEffectiveness: 0, stab: false, crit: false, item: 1, weather: 1 },
    };
  }

  const isSpecial = move.damageClass === 'special';
  const attackStatName = isSpecial ? 'special-attack' : 'attack';
  const defenseStatName = isSpecial ? 'special-defense' : 'defense';

  // Calculate Attacker's Attack Stat
  const baseAttack = attacker.stats.find((s) => s.name === attackStatName)?.value || 0;
  let A = calculateStat(
    attackStatName,
    baseAttack,
    attacker.ivs[attackStatName] ?? 31,
    attacker.evs[attackStatName] ?? 0,
    attacker.level,
    attacker.nature
  );

  // Apply Attacker Item Modifiers to Stat (Choice Band/Specs)
  if (attacker.item === 'Choice Band' && attackStatName === 'attack') A = Math.floor(A * 1.5);
  if (attacker.item === 'Choice Specs' && attackStatName === 'special-attack')
    A = Math.floor(A * 1.5);

  // Apply Ability Modifiers to Stat
  if (
    (attacker.ability === 'Huge Power' || attacker.ability === 'Pure Power') &&
    attackStatName === 'attack'
  ) {
    A = Math.floor(A * 2);
  }

  // Calculate Defender's Defense Stat
  const baseDefense = defender.stats.find((s) => s.name === defenseStatName)?.value || 0;
  const D = calculateStat(
    defenseStatName,
    baseDefense,
    defender.ivs[defenseStatName] ?? 31,
    defender.evs[defenseStatName] ?? 0,
    defender.level,
    defender.nature
  );

  // Apply Defender Item Modifiers to Stat (Eviolite - not implemented yet but placeholder logic)
  // if (defender.item === 'Eviolite' && ...) D = Math.floor(D * 1.5);

  // Apply Technician (Base Power Modifier)
  let movePower = move.power;
  if (attacker.ability === 'Technician' && movePower <= 60) {
    movePower = Math.floor(movePower * 1.5);
  }

  // Calculate Base Damage
  // Damage = ((((2 * Level / 5 + 2) * Power * A / D) / 50) + 2) * Modifier
  let damage =
    Math.floor(Math.floor((Math.floor((2 * attacker.level) / 5 + 2) * movePower * A) / D) / 50) + 2;

  // Apply Modifiers

  // 1. Weather (skipped for now, defaults to 1)

  // 2. Critical (skipped, defaults to 1)

  // 3. Random (0.85 to 1.00) - We apply this at the end to get range

  // 4. STAB
  const isStab = attacker.types.includes(move.type);
  if (isStab) {
    // Adaptability? Defaults to 1.5
    damage = Math.floor(damage * 1.5);
  }

  // 5. Type Effectiveness
  let typeMult = 1;
  defender.types.forEach((defType) => {
    const mult = TYPE_RELATIONS[move.type]?.[defType];
    if (mult !== undefined) typeMult *= mult;
  });

  // Ability Immunities
  if (defender.ability === 'Levitate' && move.type === 'ground') typeMult = 0;
  if (defender.ability === 'Flash Fire' && move.type === 'fire') typeMult = 0;
  if (
    (defender.ability === 'Volt Absorb' ||
      defender.ability === 'Motor Drive' ||
      defender.ability === 'Lightning Rod') &&
    move.type === 'electric'
  )
    typeMult = 0;
  if (
    (defender.ability === 'Water Absorb' ||
      defender.ability === 'Dry Skin' ||
      defender.ability === 'Storm Drain') &&
    move.type === 'water'
  )
    typeMult = 0;
  if (defender.ability === 'Sap Sipper' && move.type === 'grass') typeMult = 0;
  if (defender.ability === 'Wonder Guard' && typeMult <= 1) typeMult = 0;

  // Tinted Lens
  if (attacker.ability === 'Tinted Lens' && typeMult < 1 && typeMult > 0) {
    typeMult *= 2;
  }

  damage = Math.floor(damage * typeMult);

  // 6. Burn (if physical and not Guts) -> 0.5 (Skipped)

  // 7. Other (Life Orb, Expert Belt, etc.)
  let otherMult = 1;
  if (attacker.item === 'Life Orb') otherMult *= 1.3;
  if (attacker.item === 'Expert Belt' && typeMult > 1) otherMult *= 1.2;
  if (attacker.item === 'Muscle Band' && !isSpecial) otherMult *= 1.1;
  if (attacker.item === 'Wise Glasses' && isSpecial) otherMult *= 1.1;

  damage = Math.floor(damage * otherMult);

  // Calculate Range (0.85, 0.86, ..., 1.00) -> 16 rolls
  const rolls: number[] = [];
  for (let i = 85; i <= 100; i++) {
    rolls.push(Math.floor((damage * i) / 100));
  }

  const minDamage = rolls[0];
  const maxDamage = rolls[rolls.length - 1];

  // Calculate Defender HP
  const hpBase = defender.stats.find((s) => s.name === 'hp')?.value || 50;
  const defenderHP = calculateStat(
    'hp',
    hpBase,
    defender.ivs['hp'] ?? 31,
    defender.evs['hp'] ?? 0,
    defender.level,
    defender.nature
  );

  return {
    min: minDamage,
    max: maxDamage,
    rolls,
    minPercent: Number(((minDamage / defenderHP) * 100).toFixed(1)),
    maxPercent: Number(((maxDamage / defenderHP) * 100).toFixed(1)),
    modifiers: {
      typeEffectiveness: typeMult,
      stab: isStab,
      crit: false,
      item: otherMult,
      weather: 1,
    },
  };
};
