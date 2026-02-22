import { useMemo } from 'react';
import { TeamMember } from '../types';
import { TYPE_RELATIONS } from '../constants';

/**
 * Custom hook for calculating team analytics
 * Extracts complex team analysis logic from TeamBuilder component
 */
export function useTeamAnalytics(team: TeamMember[]) {
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    team.forEach((member) => {
      member.types.forEach((type) => {
        counts[type] = (counts[type] || 0) + 1;
      });
    });
    return counts;
  }, [team]);

  const teamWeaknesses = useMemo<Record<string, number>>(() => {
    if (team.length === 0) return {};
    
    const allTypes = Object.keys(TYPE_RELATIONS);
    const weaknessCounts: Record<string, number> = {};

    team.forEach((member) => {
      allTypes.forEach((attackType) => {
        let multiplier = 1;
        member.types.forEach((defenseType) => {
          multiplier *= TYPE_RELATIONS[attackType][defenseType] ?? 1;
        });
        if (multiplier > 1) {
          weaknessCounts[attackType] = (weaknessCounts[attackType] || 0) + 1;
        }
      });
    });

    return weaknessCounts;
  }, [team]);

  const teamResistances = useMemo<Record<string, number>>(() => {
    if (team.length === 0) return {};
    
    const allTypes = Object.keys(TYPE_RELATIONS);
    const resistanceCounts: Record<string, number> = {};

    team.forEach((member) => {
      allTypes.forEach((attackType) => {
        let multiplier = 1;
        member.types.forEach((defenseType) => {
          multiplier *= TYPE_RELATIONS[attackType][defenseType] ?? 1;
        });
        if (multiplier < 1 && multiplier > 0) {
          resistanceCounts[attackType] = (resistanceCounts[attackType] || 0) + 1;
        }
      });
    });

    return resistanceCounts;
  }, [team]);

  const offensiveCoverage = useMemo<Record<string, number>>(() => {
    if (team.length === 0) return {};

    const allTypes = Object.keys(TYPE_RELATIONS);
    const coverageCounts: Record<string, number> = {};
    const teamTypes = new Set<string>();

    // Collect all unique types present in the team (assuming STAB)
    team.forEach((member) => {
      member.types.forEach((type) => teamTypes.add(type));
    });

    // Check which types are hit super-effectively by the team's types
    allTypes.forEach((defenseType) => {
        let isCovered = false;
        teamTypes.forEach((attackType) => {
            if ((TYPE_RELATIONS[attackType][defenseType] ?? 1) > 1) {
                isCovered = true;
            }
        });
        if (isCovered) {
             // Calculate how many types we have that hit this super effectively
             let count = 0;
             teamTypes.forEach((attackType) => {
                 if ((TYPE_RELATIONS[attackType][defenseType] ?? 1) > 1) {
                     count++;
                 }
             });
             coverageCounts[defenseType] = count;
        }
    });

    return coverageCounts;
  }, [team]);

  const majorThreats = useMemo<Array<[string, number]>>(() => {
    return (Object.entries(teamWeaknesses) as Array<[string, number]>)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a);
  }, [teamWeaknesses]);

  const teamStats = useMemo(() => {
      if (team.length === 0) return null;

      const stats = {
          hp: 0,
          attack: 0,
          defense: 0,
          'special-attack': 0,
          'special-defense': 0,
          speed: 0
      };

      let count = 0;
      team.forEach(p => {
          if(p.stats) {
              p.stats.forEach(s => {
                  if (stats[s.name as keyof typeof stats] !== undefined) {
                      stats[s.name as keyof typeof stats] += s.value;
                  }
              });
              count++;
          }
      });

      if (count === 0) return null;

      return [
          { name: 'HP', value: Math.round(stats.hp / count) },
          { name: 'Attack', value: Math.round(stats.attack / count) },
          { name: 'Defense', value: Math.round(stats.defense / count) },
          { name: 'Sp. Atk', value: Math.round(stats['special-attack'] / count) },
          { name: 'Sp. Def', value: Math.round(stats['special-defense'] / count) },
          { name: 'Speed', value: Math.round(stats.speed / count) },
      ];
  }, [team]);

  return {
    typeCounts,
    teamWeaknesses,
    teamResistances,
    offensiveCoverage,
    majorThreats,
    teamStats,
  };
}
