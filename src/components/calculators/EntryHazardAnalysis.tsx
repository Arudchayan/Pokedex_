import React, { useMemo, memo } from 'react';
import { TeamMember } from '../../types';
import { TYPE_RELATIONS } from '../../constants';

interface EntryHazardAnalysisProps {
  team: TeamMember[];
  theme: 'dark' | 'light';
}

const EntryHazardAnalysis: React.FC<EntryHazardAnalysisProps> = ({ team, theme }) => {
  const analysis = useMemo(() => {
    return team.map(member => {
      // 1. Check Immunities (Item/Ability)
      const item = (member.selectedItem || '').toLowerCase();
      // Use selectedAbility if set, otherwise check the abilities list for Levitate/Magic Guard
      // Note: member.abilities is string[]
      const abilityName = (member.selectedAbility || '').toLowerCase();
      const possibleAbilities = (member.abilities || []).map(a => a.toLowerCase());

      const hasHeavyDutyBoots = item === 'heavy-duty boots';
      const hasMagicGuard = abilityName === 'magic guard' || (!member.selectedAbility && possibleAbilities.includes('magic guard'));
      const hasLevitate = abilityName === 'levitate' || (!member.selectedAbility && possibleAbilities.includes('levitate'));
      const hasAirBalloon = item === 'air balloon';
      const hasClearBody = abilityName === 'clear body' || (!member.selectedAbility && possibleAbilities.includes('clear body'));
      const hasWhiteSmoke = abilityName === 'white smoke' || (!member.selectedAbility && possibleAbilities.includes('white smoke')); // similar to Clear Body
      // Full Metal Body?

      const isFlying = member.types.some(t => t.toLowerCase() === 'flying');
      const isGrounded = !isFlying && !hasLevitate && !hasAirBalloon;

      const isPoison = member.types.some(t => t.toLowerCase() === 'poison');
      const isSteel = member.types.some(t => t.toLowerCase() === 'steel');

      // --- Stealth Rock ---
      // Rock effectiveness against the pokemon
      let rockWeakness = 1;
      member.types.forEach(t => {
          // TYPE_RELATIONS[attacker][defender]
          rockWeakness *= (TYPE_RELATIONS['rock'][t.toLowerCase()] ?? 1);
      });

      let stealthRockDamage = 12.5 * rockWeakness;
      let stealthRockStatus = `${stealthRockDamage}%`;

      if (hasHeavyDutyBoots || hasMagicGuard) {
          stealthRockDamage = 0;
          stealthRockStatus = 'Immune';
      }

      // --- Spikes ---
      // Grounded pokemon take damage.
      // Immune if: Not grounded OR Magic Guard OR Heavy-Duty Boots
      let spikesStatus = 'Susceptible';
      if (hasHeavyDutyBoots || hasMagicGuard || !isGrounded) {
          spikesStatus = 'Immune';
      }

      // --- Toxic Spikes ---
      // Grounded pokemon are poisoned.
      // Immune if: Not grounded OR Poison OR Steel OR Heavy-Duty Boots OR Magic Guard (immune to damage but maybe gets status? No, Magic Guard prevents status damage but not status itself? Actually Magic Guard prevents hazard damage).
      // Toxic Spikes poisons the pokemon upon entry.
      // Poison types (grounded) remove them.
      let toxicSpikesStatus = 'Susceptible';
      if (hasHeavyDutyBoots || !isGrounded || isSteel) {
          toxicSpikesStatus = 'Immune';
      } else if (isPoison && isGrounded) {
          toxicSpikesStatus = 'Absorbs';
      } else if (hasMagicGuard) {
           // Magic Guard prevents poison *damage*, but they still get poisoned?
           // In Showdown, Magic Guard prevents taking damage from hazards, but Toxic Spikes applies status.
           // However, for simplicity, usually listed as Immune to the *hazard effect* which is damage over time?
           // Actually, Toxic Spikes applies Poison/Badly Poison status. Magic Guard users don't take poison damage.
           // So functionally immune.
           toxicSpikesStatus = 'Immune';
           // Technically they get the status, but take no damage.
      }

      // --- Sticky Web ---
      // Lowers speed by 1 stage if grounded.
      // Immune if: Not grounded OR Heavy-Duty Boots OR Clear Body/White Smoke/Full Metal Body?
      // Actually Clear Body prevents stat drops.
      let stickyWebStatus = 'Susceptible';
      if (hasHeavyDutyBoots || !isGrounded || hasClearBody || hasWhiteSmoke) {
          stickyWebStatus = 'Immune';
      } else {
          stickyWebStatus = '-1 Speed';
      }

      return {
          member,
          stealthRock: { damage: stealthRockDamage, status: stealthRockStatus, weakness: rockWeakness },
          spikes: { status: spikesStatus },
          toxicSpikes: { status: toxicSpikesStatus },
          stickyWeb: { status: stickyWebStatus }
      };
    });
  }, [team]);

  if (team.length === 0) return null;

  return (
    <div className={`mt-4 rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white border-slate-200'}`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
        <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          <span className="text-lg">🚧</span> Entry Hazard Analysis
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500 bg-white/5' : 'text-slate-400 bg-slate-50'}`}>
                    <th className="p-3 font-semibold">Pokemon</th>
                    <th className="p-3 font-semibold text-center">Stealth Rock</th>
                    <th className="p-3 font-semibold text-center">Spikes</th>
                    <th className="p-3 font-semibold text-center">Toxic Spikes</th>
                    <th className="p-3 font-semibold text-center">Sticky Web</th>
                </tr>
            </thead>
            <tbody className={`divide-y text-xs font-medium ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                {analysis.map(({ member, stealthRock, spikes, toxicSpikes, stickyWeb }) => (
                    <tr key={member.id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <td className="p-3 flex items-center gap-2">
                            <img
                              src={member.imageUrl || undefined}
                              className="w-8 h-8 object-contain"
                              alt={member.name}
                            />
                             <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>{member.name}</span>
                        </td>

                        {/* Stealth Rock */}
                        <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded ${
                                stealthRock.status === 'Immune' ? (theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') :
                                stealthRock.damage >= 25 ? (theme === 'dark' ? 'bg-red-500/20 text-red-400 font-bold' : 'bg-red-100 text-red-700 font-bold') :
                                (theme === 'dark' ? 'text-slate-400' : 'text-slate-600')
                            }`}>
                                {stealthRock.status}
                            </span>
                        </td>

                        {/* Spikes */}
                        <td className="p-3 text-center">
                             <span className={`px-2 py-1 rounded ${
                                spikes.status === 'Immune' ? (theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') :
                                (theme === 'dark' ? 'text-slate-400' : 'text-slate-600')
                            }`}>
                                {spikes.status}
                            </span>
                        </td>

                        {/* Toxic Spikes */}
                        <td className="p-3 text-center">
                             <span className={`px-2 py-1 rounded ${
                                toxicSpikes.status === 'Absorbs' ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-400 font-bold' : 'bg-purple-100 text-purple-700 font-bold') :
                                toxicSpikes.status === 'Immune' ? (theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') :
                                (theme === 'dark' ? 'text-slate-400' : 'text-slate-600')
                            }`}>
                                {toxicSpikes.status}
                            </span>
                        </td>

                         {/* Sticky Web */}
                         <td className="p-3 text-center">
                             <span className={`px-2 py-1 rounded ${
                                stickyWeb.status === 'Immune' ? (theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') :
                                (theme === 'dark' ? 'text-slate-400' : 'text-slate-600')
                            }`}>
                                {stickyWeb.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      <div className={`px-3 py-2 text-[10px] text-center border-t italic ${
        theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400'
      }`}>
        Calculations account for Types, Items (e.g. Heavy-Duty Boots, Air Balloon), and Abilities (e.g. Levitate, Magic Guard).
      </div>
    </div>
  );
};

export default memo(EntryHazardAnalysis);
