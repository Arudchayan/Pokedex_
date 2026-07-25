import { PokemonMove, TeamMember } from '../types';
import { TYPE_RELATIONS } from '../constants';

export interface OffensiveCoverageSummary {
  hits: Record<string, number>;
  coverageTypes: string[];
  gaps: string[];
  redundant: string[];
}

export const computeOffensiveCoverage = (
  team: TeamMember[],
  movesByMember: (PokemonMove | null)[][]
): OffensiveCoverageSummary => {
  const hits: Record<string, number> = {};

  for (const type of Object.keys(TYPE_RELATIONS)) {
    hits[type] = 0;
  }

  movesByMember.forEach((memberMoves) => {
    memberMoves.forEach((move) => {
      if (!move || !move.type || move.power === null) return;
      const relations = TYPE_RELATIONS[move.type];
      if (!relations) return;
      Object.entries(relations).forEach(([defType, mult]) => {
        if (mult > 1) {
          hits[defType] = (hits[defType] ?? 0) + 1;
        }
      });
    });
  });

  const coverageTypes = Object.keys(hits).filter((t) => hits[t] > 0);
  const gaps = Object.keys(hits).filter((t) => hits[t] === 0);
  const redundant = Object.keys(hits).filter((t) => hits[t] > 1);

  return { hits, coverageTypes, gaps, redundant };
};
