import { describe, expect, it } from 'vitest';
import { WalkersEngine } from './walkersEngine';
import type { WalkersPackIndexEntry } from './walkersPack';

const world = { width: 800, height: 200 };
const entries: WalkersPackIndexEntry[] = [
  { generation: 'gen1', species: 'pikachu' },
  { generation: 'gen1', species: 'bulbasaur' },
  { generation: 'gen1', species: 'charmander' },
  { generation: 'gen1', species: 'squirtle' },
];

describe('WalkersEngine spawn strategy', () => {
  it('spawns selected species without duplicates when count matches chosen size', () => {
    const engine = new WalkersEngine({
      playgroundHeightPx: 150,
      speedPxPerSec: 50,
      spriteSizePx: 48,
    });

    const spawned = engine.spawnFromEntries(4, entries, world, 'uniqueThenCycle');
    expect(spawned.map((w) => w.species)).toEqual([
      'pikachu',
      'bulbasaur',
      'charmander',
      'squirtle',
    ]);
  });

  it('cycles chosen species order only after exhausting unique entries', () => {
    const engine = new WalkersEngine({
      playgroundHeightPx: 150,
      speedPxPerSec: 50,
      spriteSizePx: 48,
    });

    const spawned = engine.spawnFromEntries(6, entries, world, 'uniqueThenCycle');
    expect(spawned.map((w) => w.species)).toEqual([
      'pikachu',
      'bulbasaur',
      'charmander',
      'squirtle',
      'pikachu',
      'bulbasaur',
    ]);
  });
});
