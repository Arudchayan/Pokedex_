import { PokemonMove, PokemonStat } from '../types';
import { TYPE_RELATIONS } from '../constants';

interface ScoredMove extends PokemonMove {
  score: number;
  reason: string[];
}

export const getRecommendedMoves = (
  moves: PokemonMove[],
  stats: PokemonStat[],
  types: string[]
): ScoredMove[] => {
  // Deduplicate moves by name
  const uniqueMoves = new Map<string, PokemonMove>();
  for (const move of moves) {
    if (!uniqueMoves.has(move.name)) {
      uniqueMoves.set(move.name, move);
    }
  }
  const dedupedMoves = Array.from(uniqueMoves.values());

  // Identify key stats
  const attackStat = stats.find(s => s.name === 'attack')?.value || 0;
  const spAttackStat = stats.find(s => s.name === 'special-attack')?.value || 0;
  const isPhysicalAttacker = attackStat > spAttackStat;
  const isMixedAttacker = Math.abs(attackStat - spAttackStat) < 20; // Close stats

  return dedupedMoves
    .filter(move => move.power && move.power > 0) // Only damaging moves for now
    .map(move => {
      let score = 0;
      const reasons: string[] = [];

      // 1. STAB (Same Type Attack Bonus)
      if (types.includes(move.type)) {
        score += 50;
        reasons.push('STAB Bonus');
      }

      // 2. Stat Synergy
      if (move.damageClass === 'physical') {
        if (attackStat > spAttackStat) {
            score += 30;
            reasons.push('High Physical Stat');
        } else if (attackStat < spAttackStat) {
            score -= 20; // Penalty
        }
      } else if (move.damageClass === 'special') {
         if (spAttackStat > attackStat) {
            score += 30;
            reasons.push('High Special Stat');
         } else if (spAttackStat < attackStat) {
            score -= 20; // Penalty
         }
      }

      // 3. Power Scaling
      score += (move.power || 0) / 2;

      // 4. Accuracy Scaling
      if (move.accuracy && move.accuracy < 100) {
          score -= (100 - move.accuracy) / 2;
      }

      return { ...move, score, reason: reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4); // Top 4 moves
};
