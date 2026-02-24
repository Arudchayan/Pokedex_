import { BattleMove, StatSet, StatusCondition } from './types';

export interface MoveEffect {
  type?: 'damage' | 'status' | 'stat' | 'heal';
  status?: StatusCondition;
  chance?: number;
  statChanges?: Partial<StatSet>;
  healPercent?: number;
  recoil?: number; // percent
  priority?: number;
  drain?: number; // percent
}

// Map specific Logic IDs to code-friendly effect objects
// We will assign these Logic IDs when parsing Pokedex data based on move name or effect text
export const MOVE_LOGIC: Record<string, MoveEffect> = {
  // Status
  burn_10: { type: 'damage', status: 'brn', chance: 10 },
  freeze_10: { type: 'damage', status: 'frz', chance: 10 },
  paralyze_10: { type: 'damage', status: 'par', chance: 10 },
  poison_30: { type: 'damage', status: 'psn', chance: 30 },
  sleep: { type: 'status', status: 'slp' },
  toxic: { type: 'status', status: 'psn' }, // Badly poisoned to be added later
  thunder_wave: { type: 'status', status: 'par' },
  will_o_wisp: { type: 'status', status: 'brn' },

  // Stats
  atk_down_1: { type: 'stat', statChanges: { atk: -1 } },
  def_down_1: { type: 'stat', statChanges: { def: -1 } },
  spe_down_1: { type: 'stat', statChanges: { spe: -1 } },
  atk_up_2: { type: 'stat', statChanges: { atk: 2 } }, // Swords Dance
  spe_up_2: { type: 'stat', statChanges: { spe: 2 } }, // Agility

  // Healing
  heal_50: { type: 'heal', healPercent: 50 },

  // Recoil
  recoil_25: { type: 'damage', recoil: 25 },
  recoil_33: { type: 'damage', recoil: 33 },

  // Default
  basic_damage: { type: 'damage' },
};

export const getLogicId = (moveName: string, desc: string): string => {
  // Heuristic mapper to assign logic IDs based on name or description
  const n = moveName.replace('-', ' ').toLowerCase();

  if (n === 'swords dance') return 'atk_up_2';
  if (n === 'agility') return 'spe_up_2';
  if (n === 'recover' || n === 'roost' || n === 'slack off') return 'heal_50';
  if (n === 'will o wisp') return 'will_o_wisp';
  if (n === 'thunder wave') return 'thunder_wave';
  if (n === 'toxic') return 'toxic';
  if (n === 'spore' || n === 'sleep powder') return 'sleep';

  // Secondary effects (naive parsing)
  if (desc.includes('10% chance to burn')) return 'burn_10';
  if (desc.includes('10% chance to freeze')) return 'freeze_10';
  if (desc.includes('10% chance to paralyze')) return 'paralyze_10';
  if (desc.includes('30% chance to poison')) return 'poison_30';

  if (desc.includes('recoil')) return 'recoil_25'; // Simplify

  return 'basic_damage';
};
