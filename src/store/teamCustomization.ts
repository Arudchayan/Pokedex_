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

export function extractTeamCustomization(
  value: unknown
): TeamMemberCustomization | null {
  if (!value || typeof value !== 'object') return null;

  const source = value as Record<string, unknown>;
  const result: TeamMemberCustomization = {};
  let hasFields = false;

  for (const key of CUSTOMIZATION_KEYS) {
    if (!(key in source) || source[key] === undefined) continue;
    (result as Record<string, unknown>)[key] = source[key];
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
    if (key in updates && updates[key] !== undefined) {
      (next as Record<string, unknown>)[key] = updates[key];
    }
  }
  return next;
}
