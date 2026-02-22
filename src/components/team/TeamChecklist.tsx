import React, { useMemo, memo } from 'react';
import { TeamMember } from '../../types';

interface TeamChecklistProps {
  team: TeamMember[];
  theme: 'dark' | 'light';
}

const CHECKLIST_CATEGORIES = {
  hazards: {
    label: 'Entry Hazards',
    moves: ['stealth rock', 'spikes', 'toxic spikes', 'sticky web', 'stone axe', 'ceaseless edge'],
    description: 'Moves that damage or debilitate foes upon switching in.',
    icon: '🚧'
  },
  removal: {
    label: 'Hazard Removal',
    moves: ['rapid spin', 'defog', 'mortal spin', 'tidy up', 'court change'],
    description: 'Moves to clear entry hazards from your side.',
    icon: '🧹'
  },
  recovery: {
    label: 'Reliable Recovery',
    moves: ['recover', 'roost', 'slack off', 'soft boiled', 'milk drink', 'moonlight', 'morning sun', 'synthesis', 'shore up', 'strength sap', 'wish', 'jungle healing', 'life dew'],
    description: 'Moves to restore HP and improve longevity.',
    icon: '💖'
  },
  momentum: {
    label: 'Momentum / Pivot',
    moves: ['u turn', 'volt switch', 'flip turn', 'parting shot', 'teleport', 'chilly reception', 'shed tail', 'baton pass'],
    description: 'Moves that allow switching out while dealing damage or gaining advantage.',
    icon: '🔄'
  },
  setup: {
    label: 'Setup Sweeper',
    moves: ['swords dance', 'dragon dance', 'nasty plot', 'calm mind', 'quiver dance', 'shell smash', 'bulk up', 'coil', 'shift gear', 'belly drum', 'iron defense', 'amnesia', 'rock polish', 'agility', 'autotomize', 'tail glow', 'victory dance', 'geomancy'],
    description: 'Moves that boost stats to enable sweeping.',
    icon: '💪'
  },
  phazing: {
    label: 'Phazing / Disrupt',
    moves: ['roar', 'whirlwind', 'dragon tail', 'circle throw', 'yawn', 'perish song', 'haze', 'clear smog'],
    description: 'Moves that force the opponent to switch or reset stat changes.',
    icon: '🛑'
  },
  status: {
    label: 'Status Control',
    moves: ['heal bell', 'aromatherapy', 'refresh', 'purify', 'will o wisp', 'thunder wave', 'toxic', 'glare', 'spore', 'hypnosis'],
    description: 'Moves to cure team status or inflict status on opponents.',
    icon: '✨'
  }
};

const TeamChecklist: React.FC<TeamChecklistProps> = ({ team, theme }) => {
  const analysis = useMemo(() => {
    const results: Record<string, { present: boolean; count: number; carriers: string[] }> = {};

    Object.entries(CHECKLIST_CATEGORIES).forEach(([key, category]) => {
      let count = 0;
      const carriers: string[] = [];

      team.forEach(member => {
        if (member.selectedMoves) {
          const hasMove = member.selectedMoves.some(moveName =>
            moveName && category.moves.includes(moveName.toLowerCase())
          );
          if (hasMove) {
            count++;
            carriers.push(member.name);
          }
        }
      });

      results[key] = {
        present: count > 0,
        count,
        carriers
      };
    });

    return results;
  }, [team]);

  if (team.length === 0) return null;

  return (
    <div className={`mt-4 rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-200'}`}>
      <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
        <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Team Checklist
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-white/5">
        {Object.entries(CHECKLIST_CATEGORIES).map(([key, category]) => {
          const { present, count, carriers } = analysis[key];

          return (
            <div
              key={key}
              className={`p-3 flex items-start gap-3 transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-900/50 hover:bg-slate-800'
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm shadow-sm ${
                  present
                    ? 'bg-green-500 text-white'
                    : theme === 'dark' ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-300'
                }`}
              >
                {present ? '✓' : '–'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-bold uppercase tracking-wide ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                    {category.label}
                  </span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      theme === 'dark' ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </div>

                <p className={`text-[10px] mb-1.5 truncate ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {category.description}
                </p>

                {present ? (
                   <div className="flex flex-wrap gap-1">
                     {carriers.map(name => (
                       <span
                         key={name}
                         className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${
                           theme === 'dark'
                             ? 'border-green-500/30 bg-green-500/10 text-green-300'
                             : 'border-green-200 bg-green-50 text-green-700'
                         }`}
                       >
                         {name}
                       </span>
                     ))}
                   </div>
                ) : (
                  <span className={`text-[10px] italic ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Not detected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className={`px-3 py-2 text-[10px] text-center border-t ${
        theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400'
      }`}>
        Based on standard competitive move lists.
      </div>
    </div>
  );
};

export default memo(TeamChecklist);
