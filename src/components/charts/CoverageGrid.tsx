import React, { useState, useMemo, memo, useEffect } from 'react';
import { PokemonListItem } from '../../types';
import { TYPE_RELATIONS } from '../../constants';
import TypeBadge from './TypeBadge';
import { fetchAllMoves } from '../../services/pokeapiService';
import { logger } from '../../utils/logger';

interface CoverageGridProps {
  team: PokemonListItem[];
  theme: string;
}

const ALL_TYPES = Object.keys(TYPE_RELATIONS);
type CoverageMember = PokemonListItem & { selectedMoves?: Array<string | null> };

const CoverageGrid: React.FC<CoverageGridProps> = ({ team, theme }) => {
  const [mode, setMode] = useState<'defensive' | 'offensive'>('defensive');
  const [moveMap, setMoveMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    // Fetch all moves on mount to support offensive coverage calculation.
    void fetchAllMoves()
      .then((moves) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        moves.forEach((m) => {
          // Normalize: lowercased, hyphens to spaces to match user selection format
          const normalized = m.name.toLowerCase().replace(/-/g, ' ');
          map[normalized] = m.type;
          // Also store original just in case
          map[m.name.toLowerCase()] = m.type;
        });

        // Avoid no-op async updates that create test noise.
        if (Object.keys(map).length === 0) return;

        setMoveMap((prev) => {
          const prevKeys = Object.keys(prev);
          const nextKeys = Object.keys(map);
          if (prevKeys.length === nextKeys.length && nextKeys.every((key) => prev[key] === map[key])) {
            return prev;
          }
          return map;
        });
      })
      .catch((error) => {
        logger.warn('CoverageGrid move map load failed', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Defensive: How much damage the team MEMBER takes from the TYPE (Column)
  // Offensive: Does the team MEMBER hit the TYPE (Column) for Super Effective damage (checking Moves or STAB)

  const gridData = useMemo(() => {
    return team.map(member => {
      const row: Record<string, number> = {};

      ALL_TYPES.forEach(type => {
        if (mode === 'defensive') {
           // Calculation: Attack Type (Col) vs Defender Member (Row)
           let multiplier = 1;
           member.types.forEach(defType => {
             // If relation is undefined, it defaults to 1
             const mod = TYPE_RELATIONS[type][defType] ?? 1;
             multiplier *= mod;
           });
           row[type] = multiplier;
        } else {
           // Calculation: Attacker Member (Row) vs Defender Type (Col)
           let maxHit = 0;

           // Team members can include selected move names from team builder state.
           const memberWithMoves = member as CoverageMember;
           // Ensure selectedMoves has at least one non-null string
           const hasSelectedMoves = memberWithMoves.selectedMoves && memberWithMoves.selectedMoves.some((m: string | null) => !!m);

           if (hasSelectedMoves) {
                // Use moves
                memberWithMoves.selectedMoves?.forEach((moveName: string | null) => {
                   if (!moveName) return;
                   const normalized = moveName.toLowerCase();
                   const moveType = moveMap[normalized];
                   if (moveType) {
                       const mod = TYPE_RELATIONS[moveType][type] ?? 1;
                       if (mod > maxHit) maxHit = mod;
                   }
                });
           } else {
               // Fallback to STAB (Pokemon Types)
               member.types.forEach(atkType => {
                 const mod = TYPE_RELATIONS[atkType][type] ?? 1;
                 if (mod > maxHit) maxHit = mod;
               });
           }

           row[type] = maxHit;
        }
      });
      return { member, row };
    });
  }, [team, mode, moveMap]);

  const summary = useMemo(() => {
    const stats: Record<string, { weak: number, resist: number, effective: number }> = {};
    ALL_TYPES.forEach(t => stats[t] = { weak: 0, resist: 0, effective: 0 });

    gridData.forEach(({ row }) => {
      ALL_TYPES.forEach(type => {
        const val = row[type];
        if (mode === 'defensive') {
          if (val > 1) stats[type].weak++;
          if (val < 1 && val > 0) stats[type].resist++;
          if (val === 0) stats[type].resist++; // Immunity counts as resist
        } else {
          if (val > 1) stats[type].effective++;
        }
      });
    });
    return stats;
  }, [gridData, mode]);

  const getCellContent = (value: number) => {
    if (mode === 'defensive') {
      if (value === 0) return <span className="text-slate-400 font-black">0</span>;
      if (value === 0.25) return <span className="text-green-500 font-bold">¼</span>;
      if (value === 0.5) return <span className="text-green-400 font-bold">½</span>;
      if (value === 1) return <span className="opacity-10">-</span>;
      if (value === 2) return <span className="text-orange-400 font-bold">2</span>;
      if (value === 4) return <span className="text-red-500 font-black">4</span>;
    } else {
      if (value > 1) return <span className="text-green-500 font-bold">✓</span>;
      return <span className="opacity-10">-</span>;
    }
    return null;
  };

  const getCellClass = (value: number) => {
     const base = "h-8 w-8 flex items-center justify-center text-xs border rounded transition-colors";
     const dark = theme === 'dark';

     if (mode === 'defensive') {
       if (value === 0) return `${base} ${dark ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300'}`;
       if (value < 1) return `${base} ${dark ? 'bg-green-900/30 border-green-800/50' : 'bg-green-100 border-green-200'}`;
       if (value > 1) return `${base} ${dark ? 'bg-red-900/30 border-red-800/50' : 'bg-red-50 border-red-200'}`;
       return `${base} border-transparent`;
     } else {
       if (value > 1) return `${base} ${dark ? 'bg-green-900/30 border-green-800/50' : 'bg-green-100 border-green-200'}`;
       return `${base} border-transparent`;
     }
  };

  if (team.length === 0) return null;

  return (
    <div className={`mt-4 overflow-hidden rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-200'}`}>
       <div className="flex items-center justify-between p-3 border-b border-inherit">
         <h3 className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
           Coverage Analysis
         </h3>
         <div className="flex bg-slate-500/10 p-1 rounded-lg">
           <button
             onClick={() => setMode('defensive')}
             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'defensive' ? 'bg-primary-500 text-white shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'}`}
           >
             Defensive
           </button>
           <button
             onClick={() => setMode('offensive')}
             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'offensive' ? 'bg-primary-500 text-white shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'}`}
           >
             Offensive
           </button>
         </div>
       </div>

       <div className="overflow-x-auto">
         <table className="w-full text-center border-collapse">
           <thead>
             <tr>
               <th className={`p-2 sticky left-0 z-10 text-left min-w-[120px] ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>Pokemon</th>
               {ALL_TYPES.map(t => (
                 <th key={t} className="p-1 min-w-[36px]">
                    <div className="flex justify-center" title={t}>
                        <TypeBadge type={t} iconOnly size="sm" />
                    </div>
                 </th>
               ))}
             </tr>
           </thead>
           <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
             {gridData.map(({ member, row }) => (
               <tr key={member.id}>
                 <td className={`p-2 sticky left-0 z-10 text-left flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                   <img src={member.imageUrl || undefined} className="w-6 h-6 object-contain" alt="" />
                   <span className={`text-xs font-semibold truncate max-w-[80px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                     {member.name}
                   </span>
                 </td>
                 {ALL_TYPES.map(type => (
                   <td key={type} className="p-1">
                     <div className="flex justify-center">
                        <div className={getCellClass(row[type])}>
                          {getCellContent(row[type])}
                        </div>
                     </div>
                   </td>
                 ))}
               </tr>
             ))}

             {/* Summary Row */}
             <tr className={`border-t-2 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
               <td className={`p-2 sticky left-0 z-10 text-left font-bold text-xs ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                 {mode === 'defensive' ? 'Team Weakness' : 'Team Coverage'}
               </td>
               {ALL_TYPES.map(type => (
                 <td key={type} className="p-1">
                   <div className="flex flex-col items-center gap-0.5">
                      {mode === 'defensive' ? (
                        <>
                           {summary[type].weak > 0 && <span className="text-[10px] font-bold text-red-500">{summary[type].weak}</span>}
                           {summary[type].resist > 0 && <span className="text-[10px] font-bold text-green-500">{summary[type].resist}</span>}
                        </>
                      ) : (
                        <>
                           {summary[type].effective > 0 && <span className="text-[10px] font-bold text-green-500">{summary[type].effective}</span>}
                        </>
                      )}
                   </div>
                 </td>
               ))}
             </tr>
           </tbody>
         </table>
       </div>

       <div className={`p-2 text-[10px] italic text-center ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          {mode === 'defensive'
            ? 'Numbers indicate damage multiplier. Red = Weak, Green = Resistant.'
            : '✓ indicates this Pokemon has a move (or STAB) super effective against this type.'}
       </div>
    </div>
  );
};

export default memo(CoverageGrid);
