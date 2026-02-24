export type TypeName =
  | 'normal'
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'steel'
  | 'dark'
  | 'fairy';

export type StatusCondition = 'none' | 'brn' | 'psn' | 'par' | 'slp' | 'frz';

export interface StatSet {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface BattleMove {
  id: string;
  name: string;
  type: TypeName;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  priority: number;
  category: 'physical' | 'special' | 'status';
  target: 'normal' | 'self' | 'all';
  desc: string;
  // Logic ID for our engine to map to effect code
  logicId?: string;
}

export interface BattlePokemon {
  id: string; // Unique instance ID (e.g. "p1_charizard")
  speciesId: number; // Dex ID
  name: string;
  types: [TypeName, TypeName?];
  level: number;
  gender: 'M' | 'F' | 'N';

  // Stats
  baseStats: StatSet;
  stats: StatSet; // Calced stats at level
  currentHp: number;
  maxHp: number;

  // Battle Volatiles
  status: StatusCondition;
  statStages: StatSet; // -6 to +6 (HP ignored)

  moves: BattleMove[];
  ability: string; // Name only for now
  item: string; // Name only for now

  // UI helpers
  spriteBack: string;
  spriteFront: string;
}

export interface SideState {
  id: 'player' | 'ai';
  name: string;
  active: BattlePokemon | null;
  team: BattlePokemon[];
  sideConditions: string[]; // e.g. "stealth_rock"
}

export interface FieldState {
  weather: 'none' | 'sun' | 'rain' | 'sand' | 'hail';
  terrain: 'none' | 'electric' | 'grassy' | 'misty' | 'psychic';
  weatherTurns: number;
  terrainTurns: number;
}

export interface BattleState {
  turn: number;
  playerSide: SideState;
  enemySide: SideState;
  field: FieldState;
  lastMove: string | null;
  log: string[]; // Simple log for now
}

export type ActionType = 'move' | 'switch';

export interface BattleAction {
  type: ActionType;
  actorId: string; // Pokemon instance ID
  moveIndex?: number; // 0-3
  switchTargetIndex?: number; // Index in team array
}
