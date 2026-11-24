import type { TourDefinition } from '../context/WalkthroughContext';

export type TourAccessDefinition = Pick<TourDefinition, 'id' | 'name' | 'requiredTours'>;

export interface TourUnlockState {
  isLocked: boolean;
  /** User-facing sentence explaining how to unlock the tour. */
  reason: string | null;
  /** e.g. "1 of 2 prerequisites complete"; null when the tour is unlocked. */
  progressLabel: string | null;
}

function formatNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/**
 * Derives the unlock reason for a tour from its `requiredTours` gate.
 *
 * Mirrors `WalkthroughContext.isTourAvailable`: a tour is available once every
 * prerequisite id appears in `completedTours`. Unknown prerequisite ids fall
 * back to a generic message instead of crashing or naming a missing tour.
 */
export function getTourUnlockState(
  tour: TourAccessDefinition,
  tours: readonly TourAccessDefinition[],
  completedTours: readonly string[]
): TourUnlockState {
  const prerequisites = tour.requiredTours ?? [];
  if (prerequisites.length === 0) {
    return { isLocked: false, reason: null, progressLabel: null };
  }

  const completed = new Set(completedTours);
  const missingPrerequisiteIds = prerequisites.filter((id) => !completed.has(id));

  if (missingPrerequisiteIds.length === 0) {
    return { isLocked: false, reason: null, progressLabel: null };
  }

  const names = missingPrerequisiteIds.map(
    (id) => tours.find((candidate) => candidate.id === id)?.name
  );
  const allNamesKnown = names.every((name): name is string => name !== undefined);

  const reason = allNamesKnown
    ? `Complete the ${formatNames(names)} ${names.length === 1 ? 'tour' : 'tours'} to unlock.`
    : 'Complete the prerequisite tours to unlock.';

  const completedCount = prerequisites.length - missingPrerequisiteIds.length;
  const noun = prerequisites.length === 1 ? 'prerequisite' : 'prerequisites';

  return {
    isLocked: true,
    reason,
    progressLabel: `${completedCount} of ${prerequisites.length} ${noun} complete.`,
  };
}
