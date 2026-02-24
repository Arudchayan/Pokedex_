import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/utils';
import BattleControls from './BattleControls';
import { BattlePokemon } from '../../../utils/battle/types';

const createBattlePokemon = (overrides: Partial<BattlePokemon> = {}): BattlePokemon => ({
  id: 'p1_bulbasaur',
  speciesId: 1,
  name: 'Bulbasaur',
  types: ['grass', 'poison'],
  level: 10,
  gender: 'M',
  baseStats: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 },
  stats: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 },
  currentHp: 30,
  maxHp: 30,
  status: 'none',
  statStages: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  moves: [
    {
      id: 'tackle',
      name: 'Tackle',
      type: 'normal',
      power: 40,
      accuracy: 100,
      pp: 35,
      maxPp: 35,
      priority: 0,
      category: 'physical',
      target: 'normal',
      desc: '',
    },
  ],
  ability: 'overgrow',
  item: 'none',
  spriteBack: 'back.png',
  spriteFront: 'front.png',
  ...overrides,
});

describe('BattleControls', () => {
  it('opens the switch menu and triggers onSwitch', () => {
    const activePokemon = createBattlePokemon();
    const benchPokemon = createBattlePokemon({
      id: 'p1_charmander',
      speciesId: 4,
      name: 'Charmander',
      currentHp: 25,
      maxHp: 25,
    });
    const onSwitch = vi.fn();

    renderWithProvider(
      <BattleControls
        activePokemon={activePokemon}
        playerTeam={[activePokemon, benchPokemon]}
        onMove={vi.fn()}
        onRun={vi.fn()}
        onSwitch={onSwitch}
        disabled={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /switch pokémon/i }));
    fireEvent.click(screen.getByRole('button', { name: /charmander/i }));

    expect(onSwitch).toHaveBeenCalledWith(1);
    expect(screen.getByRole('button', { name: /switch pokémon/i })).toBeInTheDocument();
  });
});
