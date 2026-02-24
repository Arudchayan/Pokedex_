import React, { useMemo, useState } from 'react';
import { BattlePokemon } from '../../../utils/battle/types';
import { usePokemon } from '../../../context/PokemonContext';
import { PokemonListItem } from '../../../types';

interface Props {
  activePokemon: BattlePokemon;
  playerTeam: BattlePokemon[];
  onMove: (moveIndex: number) => void;
  onSwitch: (switchTargetIndex: number) => void;
  onRun: () => void;
  disabled: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-slate-400',
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-400 text-slate-900',
  ice: 'bg-cyan-300 text-slate-900',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-amber-600',
  flying: 'bg-indigo-300 text-slate-900',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-stone-500',
  ghost: 'bg-purple-800',
  dragon: 'bg-violet-600',
  steel: 'bg-slate-400',
  dark: 'bg-slate-800',
  fairy: 'bg-pink-300 text-slate-900',
};

const BattleControls: React.FC<Props> = ({
  activePokemon,
  playerTeam,
  onMove,
  onSwitch,
  onRun,
  disabled,
}) => {
  const { theme, teamPokemon } = usePokemon();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  const displayTeam = useMemo<PokemonListItem[]>(() => {
    if (teamPokemon.length > 0) return teamPokemon;
    return playerTeam.map((mon) => ({
      id: mon.speciesId,
      name: mon.name,
      imageUrl: mon.spriteFront,
      shinyImageUrl: mon.spriteFront,
      types: mon.types.filter(Boolean) as string[],
      flavorText: '',
      stats: mon.stats
        ? [
            { name: 'hp', value: mon.stats.hp },
            { name: 'attack', value: mon.stats.atk },
            { name: 'defense', value: mon.stats.def },
            { name: 'special-attack', value: mon.stats.spa },
            { name: 'special-defense', value: mon.stats.spd },
            { name: 'speed', value: mon.stats.spe },
          ]
        : [],
      abilities: [],
    }));
  }, [playerTeam, teamPokemon]);

  const switchOptions = useMemo(() => {
    return displayTeam.map((member) => {
      const battleIndex = playerTeam.findIndex(
        (mon) => mon.speciesId === member.id || mon.name.toLowerCase() === member.name.toLowerCase()
      );
      const battleMon = battleIndex >= 0 ? playerTeam[battleIndex] : null;
      const isActive = battleMon?.id === activePokemon.id;
      const isFainted = battleMon ? battleMon.currentHp <= 0 : true;
      const canSwitch = Boolean(battleMon && !isActive && !isFainted);

      return {
        member,
        battleIndex,
        battleMon,
        isActive,
        isFainted,
        canSwitch,
      };
    });
  }, [activePokemon.id, displayTeam, playerTeam]);

  const canOpenSwitchMenu = switchOptions.some((option) => option.canSwitch);

  const handleSwitchClick = (option: (typeof switchOptions)[number]) => {
    if (disabled || !option.canSwitch || option.battleIndex < 0) return;
    onSwitch(option.battleIndex);
    setShowSwitchMenu(false);
  };

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {activePokemon.moves.map((move, idx) => (
        <button
          key={idx}
          onClick={() => onMove(idx)}
          disabled={disabled}
          className={`relative p-4 rounded-xl text-left transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 shadow-md'}`}
        >
          <div
            className={`absolute top-0 right-0 px-2 py-1 text-xs font-bold uppercase rounded-bl-lg text-white ${TYPE_COLORS[move.type] || 'bg-slate-500'}`}
          >
            {move.type}
          </div>
          <div className="font-bold text-lg">{move.name}</div>
          <div className="text-xs opacity-70">
            {move.category} | PP: {move.pp}/{move.maxPp}
          </div>
        </button>
      ))}

      <div className="col-span-2 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowSwitchMenu((prev) => !prev)}
          disabled={disabled || !canOpenSwitchMenu}
          aria-expanded={showSwitchMenu}
          className={`p-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
        >
          {showSwitchMenu ? 'Close Switch Menu' : 'Switch Pokémon'}
        </button>

        {showSwitchMenu && (
          <div
            className={`rounded-xl border p-3 grid gap-2 ${theme === 'dark' ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white/80'}`}
          >
            {switchOptions.map((option) => (
              <button
                key={`${option.member.id}-${option.member.name}`}
                type="button"
                onClick={() => handleSwitchClick(option)}
                disabled={disabled || !option.canSwitch}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold capitalize">{option.member.name}</span>
                  <span className="text-xs opacity-70">
                    {option.isActive && 'Active'}
                    {!option.isActive && option.isFainted && 'Fainted'}
                    {!option.isActive && !option.isFainted && 'Ready'}
                  </span>
                </div>
                <span className="text-xs font-semibold">
                  {option.battleMon
                    ? `HP ${option.battleMon.currentHp}/${option.battleMon.maxHp}`
                    : 'Unavailable'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onRun}
        className="col-span-2 mt-2 p-2 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
      >
        Run Away (Forfeit)
      </button>
    </div>
  );
};

export default BattleControls;
