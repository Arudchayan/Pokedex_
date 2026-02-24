import React, { useMemo, memo } from 'react';
import { TeamMember } from '../../types';
import { calculateStat } from '../../utils/damageFormula';

interface SpeedTierAnalysisProps {
  team: TeamMember[];
  theme: 'dark' | 'light';
}

interface SpeedTierItem {
  id: string;
  name: string;
  speed: number;
  isBenchmark: boolean;
  imageUrl?: string;
  description?: string;
  color?: string;
}

// Benchmarks at Level 100 (Max Speed = 31 IV, 252 EV, +Speed Nature)
const BENCHMARKS = [
  { name: 'Regieleki (Max)', speed: 548, color: 'text-yellow-400' },
  { name: 'Scarf Garchomp', speed: 499, description: '102 Base +1', color: 'text-blue-400' },
  { name: 'Dragapult (Max)', speed: 421, color: 'text-purple-400' },
  { name: 'Iron Bundle (Max)', speed: 408, color: 'text-cyan-400' },
  { name: 'Flutter Mane (Max)', speed: 405, color: 'text-pink-400' },
  { name: 'Meowscarada (Max)', speed: 379, color: 'text-green-400' },
  { name: 'Roaring Moon (Max)', speed: 370, color: 'text-indigo-400' },
  { name: 'Iron Valiant (Max)', speed: 364, color: 'text-pink-300' },
  { name: 'Garchomp (Max)', speed: 333, color: 'text-blue-500' },
  { name: 'Palafin (Max)', speed: 328, color: 'text-blue-400' },
  { name: 'Urshifu (Max)', speed: 322, color: 'text-gray-400' },
  { name: 'Landorus-T (Max)', speed: 309, color: 'text-orange-400' },
  { name: 'Great Tusk (Max)', speed: 300, color: 'text-amber-700' },
  { name: 'Gholdengo (Max)', speed: 293, color: 'text-yellow-600' },
  { name: 'Dragonite (Max)', speed: 284, color: 'text-orange-500' },
  { name: 'Heatran (Max)', speed: 278, color: 'text-red-500' },
  { name: 'Kingambit (Max)', speed: 218, color: 'text-red-800' },
  { name: '0 Speed Torkoal', speed: 40, description: 'Min Speed', color: 'text-orange-600' }, // Lvl 100 Min Speed
];

const SpeedTierAnalysis: React.FC<SpeedTierAnalysisProps> = ({ team, theme }) => {
  const tiers = useMemo(() => {
    const items: SpeedTierItem[] = [];

    // Add Team Members
    team.forEach((member) => {
      // Calculate Speed
      // 1. Base Speed
      const baseSpeed = member.stats?.find((s) => s.name === 'speed')?.value || 0;

      // 2. Calculate Stat
      let speed = calculateStat(
        'speed',
        baseSpeed,
        member.ivs?.speed ?? 31,
        member.evs?.speed ?? 0,
        100, // Assuming Lvl 100 for standard comparison against benchmarks
        member.selectedNature || 'Hardy'
      );

      // 3. Modifiers (Item)
      const item = (member.selectedItem || '').toLowerCase();
      if (item === 'choice scarf') {
        speed = Math.floor(speed * 1.5);
      } else if (item === 'iron ball' || item === 'macho brace' || item === 'power anklet') {
        speed = Math.floor(speed * 0.5);
      }

      // Modifiers (Ability) - Simplified
      // Unburden, Chlorophyll, etc. depend on conditions.
      // We will just show the "Active" speed.

      items.push({
        id: member.id.toString(),
        name: member.name,
        speed,
        isBenchmark: false,
        imageUrl: member.imageUrl,
      });
    });

    // Add Benchmarks
    // Only add benchmarks that are relevant (within range of the team)
    // Or just add the top ones and some surrounding ones?
    // For now, add all defined benchmarks.
    BENCHMARKS.forEach((b, i) => {
      items.push({
        id: `benchmark-${i}`,
        name: b.name,
        speed: b.speed,
        isBenchmark: true,
        description: b.description,
        color: b.color,
      });
    });

    // Sort descending
    return items.sort((a, b) => b.speed - a.speed);
  }, [team]);

  if (team.length === 0) return null;

  return (
    <div
      className={`mt-4 rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-200'}`}
    >
      <div
        className={`px-4 py-3 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}
      >
        <h3
          className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
        >
          <span className="text-lg">⚡</span> Speed Tiers (Lvl 100)
        </h3>
      </div>

      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        <div className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
          {tiers.map((item) => (
            <div
              key={item.id}
              className={`flex items-center px-4 py-2 text-sm ${
                item.isBenchmark
                  ? theme === 'dark'
                    ? 'bg-white/5 opacity-60'
                    : 'bg-slate-50 text-slate-500'
                  : theme === 'dark'
                    ? 'bg-primary-500/10'
                    : 'bg-primary-50'
              }`}
            >
              <div className="w-12 font-mono font-bold text-right mr-4 opacity-80">
                {item.speed}
              </div>

              <div className="flex-1 flex items-center gap-3">
                {!item.isBenchmark && item.imageUrl && (
                  <img src={item.imageUrl} className="w-6 h-6 object-contain" alt="" />
                )}
                <div className="flex flex-col">
                  <span
                    className={`font-semibold ${
                      !item.isBenchmark
                        ? theme === 'dark'
                          ? 'text-white'
                          : 'text-slate-900'
                        : item.color || ''
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.description && (
                    <span className="text-[10px] opacity-60">{item.description}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className={`px-3 py-2 text-[10px] text-center border-t italic ${
          theme === 'dark'
            ? 'bg-white/5 border-white/10 text-slate-500'
            : 'bg-slate-50 border-slate-100 text-slate-400'
        }`}
      >
        Calculated at Lvl 100. Accounts for IVs, EVs, Nature, and Choice Scarf.
      </div>
    </div>
  );
};

export default memo(SpeedTierAnalysis);
