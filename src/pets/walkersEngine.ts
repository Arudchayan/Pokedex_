import type { WalkerInstance } from './walkersTypes';
import type { WalkersPackIndexEntry } from './walkersPack';

function randBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function id() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export interface WalkersEngineConfig {
  playgroundHeightPx: number;
  speedPxPerSec: number;
  spriteSizePx: number;
  /** When true, skip all position/animation updates in tick (walkers stay static). */
  reducedMotion?: boolean;
}

export interface WalkersWorld {
  width: number;
  height: number; // viewport height
}

export interface WalkersEngineState {
  walkers: WalkerInstance[];
}

export type WalkersSpawnStrategy = 'randomWithReplacement' | 'uniqueThenCycle';

export class WalkersEngine {
  private config: WalkersEngineConfig;
  private state: WalkersEngineState;
  private lastTs: number | null = null;

  constructor(config: WalkersEngineConfig) {
    this.config = config;
    this.state = { walkers: [] };
  }

  setConfig(config: WalkersEngineConfig) {
    this.config = config;
  }

  getState() {
    return this.state;
  }

  setWalkers(walkers: WalkerInstance[]) {
    this.state.walkers = walkers;
  }

  spawnFromEntries(
    count: number,
    entries: WalkersPackIndexEntry[],
    world: WalkersWorld,
    strategy: WalkersSpawnStrategy = 'randomWithReplacement'
  ): WalkerInstance[] {
    const safeCount = Math.max(0, Math.round(count));
    if (safeCount === 0) return [];
    if (entries.length === 0) return [];

    const sprite = Math.max(1, this.config.spriteSizePx || 48);

    const walkers: WalkerInstance[] = [];
    const pickEntryAt = (i: number): WalkersPackIndexEntry => {
      if (strategy === 'uniqueThenCycle') {
        return entries[i % entries.length];
      }
      return entries[Math.floor(Math.random() * entries.length)];
    };

    for (let i = 0; i < safeCount; i++) {
      const entry = pickEntryAt(i);
      const baseSpeed = this.config.speedPxPerSec;
      const dir = Math.random() < 0.5 ? -1 : 1;
      const vx = dir * randBetween(baseSpeed * 0.6, baseSpeed * 1.2);
      const x = randBetween(0, Math.max(0, world.width - sprite));
      const y = randBetween(0, Math.max(0, world.height - sprite));

      walkers.push({
        id: id(),
        species: entry.species,
        generation: entry.generation,
        color: 'default',
        originalSpriteSize: 32,
        x,
        y,
        vx,
        facing: vx >= 0 ? 1 : -1,
        anim: 'walk',
        dragging: false,
      });
    }

    return walkers;
  }

  tick(ts: number, world: WalkersWorld) {
    if (this.config.reducedMotion) {
      this.lastTs = ts;
      return;
    }

    if (this.lastTs === null) {
      this.lastTs = ts;
      return;
    }
    const dt = clamp((ts - this.lastTs) / 1000, 0, 0.06);
    this.lastTs = ts;

    const sprite = Math.max(1, this.config.spriteSizePx || 48);
    const minX = 0;
    const maxX = Math.max(0, world.width - sprite);
    const minY = 0;
    const maxY = Math.max(0, world.height - sprite);

    for (const w of this.state.walkers) {
      if (w.dragging) continue;

      w.x += w.vx * dt;
      if (w.x < minX) {
        w.x = minX;
        w.vx = Math.abs(w.vx);
      } else if (w.x > maxX) {
        w.x = maxX;
        w.vx = -Math.abs(w.vx);
      }

      // Keep them within playground strip vertically (they can be dragged within it).
      w.y = clamp(w.y, minY, maxY);

      w.facing = w.vx >= 0 ? 1 : -1;
      w.anim = Math.abs(w.vx) < 5 ? 'idle' : w.facing === 1 ? 'walk' : 'walk_left';
    }
  }
}
