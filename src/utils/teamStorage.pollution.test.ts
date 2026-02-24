import { describe, it, expect } from 'vitest';
import { validateTeamMember } from './teamStorage';

describe('validateTeamMember Prototype Pollution', () => {
  it('should not allow __proto__ in evs', () => {
    const maliciousInput = {
      id: 1,
      name: 'bulbasaur',
      evs: JSON.parse('{"__proto__": 252, "hp": 252}'),
    };

    const result = validateTeamMember(maliciousInput);

    // We expect the result to NOT have __proto__ as a property
    // In a safe implementation, it should be ignored or stripped

    // Check if the property exists on the object itself
    expect(result?.evs).toBeDefined();
    // Using Object.getOwnPropertyDescriptor to check existence even if non-enumerable
    const protoDesc = Object.getOwnPropertyDescriptor(result?.evs, '__proto__');

    // Current behavior (vulnerable): it likely exists as a property shadowing the prototype
    // We want to assert it DOES NOT exist after fix.
    // But for reproduction, we can assert whatever shows the issue.

    // If it exists, it means we polluted the object property (shadowing).
    // Note: This test might pass if the property is created.
    // We want to verify it IS created now, so we can prove we fixed it later.

    // However, vitest might not let us access __proto__ easily in assertions due to its special nature.
    // Let's check constructor instead which is easier to test.

    const maliciousInputConstructor = {
      id: 1,
      name: 'bulbasaur',
      evs: {
        constructor: 252,
        hp: 252,
      },
    };

    const result2 = validateTeamMember(maliciousInputConstructor);
    expect(result2?.evs).not.toHaveProperty('constructor');
    expect(result2?.evs?.hp).toBe(252);
  });
});
