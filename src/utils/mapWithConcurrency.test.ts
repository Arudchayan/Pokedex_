import { describe, it, expect, vi } from 'vitest';
import { mapWithConcurrency } from './mapWithConcurrency';

describe('mapWithConcurrency', () => {
  it('preserves order and respects concurrency limit', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight--;
      return n * 10;
    });

    expect(results).toEqual([10, 20, 30, 40, 50]);
    expect(maxInFlight).toBeLessThanOrEqual(2);
  });

  it('returns empty array for empty input', async () => {
    const fn = vi.fn();
    await expect(mapWithConcurrency([], 5, fn)).resolves.toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });
});
