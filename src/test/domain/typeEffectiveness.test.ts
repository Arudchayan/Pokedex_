import { describe, it, expect } from 'vitest';
import { calculateTypeEffectiveness } from './typeEffectiveness';
import { TYPE_RELATIONS } from './typeRelations';

describe('TYPE_RELATIONS', () => {
  it('marks ground as immune to electric', () => {
    expect(TYPE_RELATIONS.electric.ground).toBe(0);
  });

  it('marks water as strong against fire', () => {
    expect(TYPE_RELATIONS.water.fire).toBe(2);
  });
});

describe('calculateTypeEffectiveness', () => {
  it('groups immunities for pure electric', () => {
    const result = calculateTypeEffectiveness(['electric']);
    expect(result['0']).toContain('ground');
  });

  it('multiplies dual-type weaknesses', () => {
    const result = calculateTypeEffectiveness(['fire', 'flying']);
    // Rock is 2× vs fire and 2× vs flying → 4×
    expect(result['4']).toContain('rock');
  });
});
