import { describe, it, expect } from 'vitest';
import { calculateTypeEffectiveness } from '../../domain/typeEffectiveness';
import { TYPE_RELATIONS } from '../../domain/typeRelations';

describe('TYPE_RELATIONS', () => {
  it('marks ground as immune to electric', () => {
    expect(TYPE_RELATIONS.electric.ground).toBe(0);
  });

  it('marks water as strong against fire', () => {
    expect(TYPE_RELATIONS.water.fire).toBe(2);
  });
});

describe('calculateTypeEffectiveness', () => {
  it('groups immunities for pure ground (vs electric)', () => {
    const result = calculateTypeEffectiveness(['ground']);
    expect(result['0']).toContain('electric');
  });

  it('multiplies dual-type weaknesses', () => {
    const result = calculateTypeEffectiveness(['fire', 'flying']);
    // Rock is 2× vs fire and 2× vs flying → 4×
    expect(result['4']).toContain('rock');
  });
});
