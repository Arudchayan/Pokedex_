import type { TeamMember } from '../types';

/** Fields that decorate a roster slot beyond the species identity. */
export type TeamMemberCustomization = Partial<
  Pick<
    TeamMember,
    | 'selectedMoves'
    | 'selectedAbility'
    | 'selectedNature'
    | 'selectedItem'
    | 'evs'
    | 'ivs'
    | 'isShiny'
    | 'imageUrl'
  >
>;

const CUSTOMIZATION_KEYS = [
  'selectedMoves',
  'selectedAbility',
  'selectedNature',
  'selectedItem',
  'evs',
  'ivs',
  'isShiny',
  'imageUrl',
] as const satisfies ReadonlyArray<keyof TeamMemberCustomization>;

const isBlankString = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length === 0;

/**
 * Presentation-only values from a placeholder (for example `imageUrl: ''`)
 * must never override resolved species data or be persisted as a customization.
 */
const isBlankPresentationValue = (key: string, value: unknown): boolean =>
  (key === 'imageUrl' || key === 'shinyImageUrl') && isBlankString(value);

function shouldStoreCustomizationValue(
  key: keyof TeamMemberCustomization,
  value: unknown
): boolean {
  if (value === undefined) return false;
  if (isBlankPresentationValue(key, value)) return false;
  return true;
}

export function extractTeamCustomization(value: unknown): TeamMemberCustomization | null {
  if (!value || typeof value !== 'object') return null;

  const source = value as Record<string, unknown>;
  const result: TeamMemberCustomization = {};
  let hasFields = false;

  for (const key of CUSTOMIZATION_KEYS) {
    if (!(key in source)) continue;
    const field = source[key];
    if (!shouldStoreCustomizationValue(key, field)) continue;
    (result as Record<string, unknown>)[key] = field;
    hasFields = true;
  }

  return hasFields ? result : null;
}

export function mergeTeamCustomization(
  existing: TeamMemberCustomization | undefined,
  updates: Partial<TeamMember>
): TeamMemberCustomization {
  const next: TeamMemberCustomization = { ...(existing ?? {}) };
  for (const key of CUSTOMIZATION_KEYS) {
    if (!(key in updates)) continue;
    const field = updates[key];
    if (!shouldStoreCustomizationValue(key, field)) continue;
    (next as Record<string, unknown>)[key] = field;
  }
  return next;
}

/**
 * Apply slot customizations without allowing blank presentation fields to
 * replace resolved species details (defensive against older persisted data).
 */
export function applyTeamCustomization(
  base: TeamMember,
  customization: TeamMemberCustomization | undefined
): TeamMember {
  if (!customization) return base;

  const safe: TeamMemberCustomization = { ...customization };
  for (const key of CUSTOMIZATION_KEYS) {
    if (isBlankPresentationValue(key, safe[key])) {
      delete safe[key];
    }
  }

  return Object.keys(safe).length > 0 ? { ...base, ...safe } : base;
}
