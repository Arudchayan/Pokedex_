import { describe, expect, it } from 'vitest';
import { clampStatFilterValue } from './statFilters';

describe('clampStatFilterValue', () => {
  it.each([
    [0, 0],
    [42, 42],
    [255, 255],
    [256, 255],
    [9999, 255],
    [-1, 0],
    [-9999, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [42.9, 42],
  ])('clamps %s to %s', (input, expected) => {
    expect(clampStatFilterValue(input)).toBe(expected);
  });
});
