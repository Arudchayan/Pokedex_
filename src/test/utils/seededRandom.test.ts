import { describe, it, expect, vi } from 'vitest';
import { mulberry32, dateToSeed } from '../../utils/seededRandom';

describe('Seeded Random', () => {
  it('should generate consistent sequences for the same seed', () => {
    const seed = 12345;
    const rng1 = mulberry32(seed);
    const rng2 = mulberry32(seed);

    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
  });

  it('should generate different sequences for different seeds', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(67890);

    expect(rng1()).not.toBe(rng2());
  });

  it('dateToSeed should produce same hash for same string', () => {
    const str = '2023-10-27-game';
    expect(dateToSeed(str)).toBe(dateToSeed(str));
  });
});
