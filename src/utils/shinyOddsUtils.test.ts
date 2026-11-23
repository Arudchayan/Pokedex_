import { describe, expect, it } from 'vitest';
import {
  GENERATIONS,
  GenerationKey,
  SHINY_METHODS,
  SPARKLING_POWER_LEVELS,
  calculateShinyOdds,
  isShinyCharmAvailable,
  resolveShinyMethod,
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
    expect(calculateShinyOdds('gen9', 'random', true)).toEqual({
      odds: 3 / 4096,
      text: '1 in 1365',
    });
    expect(calculateShinyOdds('gen9', 'masuda', true)).toEqual({
      odds: 8 / 4096,
      text: '1 in 512',
    });
    expect(calculateShinyOdds('gen9', 'outbreak', true)).toEqual({
      odds: 5 / 4096,
      text: '1 in 819',
    });
  });
});

describe('Sparkling Power (Gen 9)', () => {
  it('is offered once, as a level modifier rather than a hunting method', () => {
    expect(SHINY_METHODS.gen9.some((method) => method.id === 'sandwich')).toBe(false);
    expect(SHINY_METHODS.gen9.some((method) => /sparkling power/i.test(method.name))).toBe(false);
  });

  it('adds one shiny roll per level to random encounters', () => {
    const expected = [
      { level: 0, odds: 1 / 4096, text: '1 in 4096' },
      { level: 1, odds: 2 / 4096, text: '1 in 2048' },
      { level: 2, odds: 3 / 4096, text: '1 in 1365' },
      { level: 3, odds: 4 / 4096, text: '1 in 1024' },
    ] as const;

    for (const { level, odds, text } of expected) {
      expect(calculateShinyOdds('gen9', 'random', false, level)).toEqual({ odds, text });
    }
  });

  it('stacks with the Shiny Charm and Mass Outbreaks up to eight rolls', () => {
    expect(calculateShinyOdds('gen9', 'random', true, 1)).toEqual({
      odds: 4 / 4096,
      text: '1 in 1024',
    });
    expect(calculateShinyOdds('gen9', 'random', true, 2)).toEqual({
      odds: 5 / 4096,
      text: '1 in 819',
    });
    expect(calculateShinyOdds('gen9', 'random', true, 3)).toEqual({
      odds: 6 / 4096,
      text: '1 in 683',
    });
    expect(calculateShinyOdds('gen9', 'outbreak', false, 3)).toEqual({
      odds: 6 / 4096,
      text: '1 in 683',
    });
    expect(calculateShinyOdds('gen9', 'outbreak', true, 3)).toEqual({
      odds: 8 / 4096,
      text: '1 in 512',
    });
  });

  it('does not apply to Masuda Method eggs', () => {
    expect(calculateShinyOdds('gen9', 'masuda', false, 3)).toEqual(
      calculateShinyOdds('gen9', 'masuda', false, 0)
    );
    expect(calculateShinyOdds('gen9', 'masuda', true, 3)).toEqual({
      odds: 8 / 4096,
      text: '1 in 512',
    });
  });

  it('does not affect generations without sandwiches', () => {
    for (const gen of ALL_GENERATIONS.filter((generation) => generation !== 'gen9')) {
      for (const method of SHINY_METHODS[gen]) {
        expect(calculateShinyOdds(gen, method.id, false, 3)).toEqual(
          calculateShinyOdds(gen, method.id, false, 0)
        );
      }
    }
  });

  it('exposes every selectable level including Off', () => {
    expect(SPARKLING_POWER_LEVELS).toEqual([0, 1, 2, 3]);
  });
});

describe('resolveShinyMethod', () => {
  it('falls back to the first method when a removed or unknown id is supplied', () => {
    expect(resolveShinyMethod('gen9', 'sandwich')).toEqual(SHINY_METHODS.gen9[0]);
    expect(resolveShinyMethod('gen9', 'not-a-method')).toEqual(SHINY_METHODS.gen9[0]);
    expect(calculateShinyOdds('gen9', 'sandwich', false)).toEqual(
      calculateShinyOdds('gen9', 'random', false)
    );
  });
});
