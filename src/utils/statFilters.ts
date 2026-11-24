import { MAX_STAT_VALUE, MIN_STAT_VALUE } from '../constants';

/**
 * Clamp a user-entered minimum-stat filter to the legal base-stat range.
 * Non-finite input (NaN/Infinity) collapses to the minimum, which clears the filter.
 */
export const clampStatFilterValue = (value: number): number => {
  if (!Number.isFinite(value)) return MIN_STAT_VALUE;
  return Math.min(MAX_STAT_VALUE, Math.max(MIN_STAT_VALUE, Math.trunc(value)));
};
