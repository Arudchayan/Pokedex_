import { describe, expect, it } from 'vitest';
import {
  GENERATIONS,
  GenerationKey,
  SHINY_METHODS,
  calculateShinyOdds,
  isShinyCharmAvailable,
} from './shinyOddsUtils';

const ALL_GENERATIONS = Object.keys(GENERATIONS) as GenerationKey[];
const CHARM_GENERATIONS: GenerationKey[] = ['gen5', 'gen6', 'gen7', 'gen8', 'gen9'];
const UNSUPPORTED_GENERATIONS: GenerationKey[] = ['gen2', 'gen3', 'gen4'];

describe('isShinyCharmAvailable', () => {
  it('reports the Shiny Charm as available from Generation 5 onwards only', () => {
    for (const gen of ALL_GENERATIONS) {
      expect(isShinyCharmAvailable(gen)).toBe(CHARM_GENERATIONS.includes(gen));
    }
  });
});

describe('calculateShinyOdds with the Shiny Charm', () => {
  it('ignores the Shiny Charm in generations where it does not exist', () => {
    for (const gen of UNSUPPORTED_GENERATIONS) {
      for (const method of SHINY_METHODS[gen]) {
        expect(calculateShinyOdds(gen, method.id, true)).toEqual(
          calculateShinyOdds(gen, method.id, false)
        );
      }
    }
  });

  it('keeps the existing no-Charm values for unsupported generations', () => {
    expect(calculateShinyOdds('gen3', 'random', true)).toEqual({
      odds: 1 / 8192,
      text: '1 in 8192',
    });
    expect(calculateShinyOdds('gen4', 'random', true)).toEqual({
      odds: 1 / 8192,
      text: '1 in 8192',
    });
    expect(calculateShinyOdds('gen4', 'masuda', true)).toEqual({
      odds: 5 / 8192,
      text: '1 in 1638',
    });
  });

  it('applies the existing Charm bonus from Generation 5 onwards', () => {
    expect(calculateShinyOdds('gen5', 'random', true)).toEqual({
      odds: 1 / 2730,
      text: '1 in 2730',
    });
    expect(calculateShinyOdds('gen5', 'masuda', true)).toEqual({
      odds: 8 / 8192,
      text: '1 in 1024',
    });
    expect(calculateShinyOdds('gen6', 'random', true)).toEqual({
      odds: 3 / 4096,
      text: '1 in 1365',
    });
    expect(calculateShinyOdds('gen6', 'masuda', true)).toEqual({
      odds: 1 / 512,
      text: '1 in 512',
    });
    expect(calculateShinyOdds('gen8', 'dynamax_adventures', true)).toEqual({
      odds: 1 / 100,
      text: '1 in 100',
    });
    expect(calculateShinyOdds('gen9', 'sandwich', true)).toEqual({
      odds: 1 / 683,
      text: '1 in 683',
    });
  });
});
