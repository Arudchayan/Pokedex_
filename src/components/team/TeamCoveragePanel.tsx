import React, { useMemo } from 'react';
import { TeamMember } from '../../types';
import { TYPE_COLORS } from '../../constants';
import { computeOffensiveCoverage } from '../../utils/teamCoverage';

interface TeamCoveragePanelProps {
  team: TeamMember[];
  theme: 'dark' | 'light';
}

const ALL_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

export const TeamCoveragePanel: React.FC<TeamCoveragePanelProps> = ({ team, theme }) => {
  const summary = useMemo(() => {
    const movesByMember = team.map((m) =>
      (m.selectedMoves || []).map((name): any =>
        name && (m as any).allMoves
          ? ((m as any).allMoves.find((mv: any) => mv.name === name) ?? null)
          : null
      )
    );
    return computeOffensiveCoverage(team, movesByMember);
  }, [team]);

  const isDark = theme === 'dark';

  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide opacity-70">
        Offensive Type Coverage
      </h3>
      <div
        className={`grid grid-cols-6 gap-1 rounded-xl p-3 text-[11px] ${
          isDark ? 'bg-black/30' : 'bg-slate-50'
        }`}
      >
        {ALL_TYPES.map((type) => {
          const count = summary.hits[type] ?? 0;
          const baseColor = TYPE_COLORS[type]?.split(' ')[0] ?? 'bg-slate-500';

          let intensity = 'bg-slate-800';
          if (count === 0) {
            intensity = isDark ? 'bg-red-900/60' : 'bg-red-100';
          } else if (count === 1) {
            intensity = `${baseColor} opacity-70`;
          } else if (count > 1) {
            intensity = `${baseColor} opacity-100`;
          }

          return (
            <div
              key={type}
              className={`flex flex-col items-center justify-center rounded-lg px-1 py-1 ${intensity}`}
            >
              <span className="capitalize leading-tight">{type}</span>
              <span className="text-[10px] font-mono opacity-80">x{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamCoveragePanel;
