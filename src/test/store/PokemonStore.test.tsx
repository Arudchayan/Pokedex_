import { describe, it, expect, beforeEach } from 'vitest';
import { usePokemonStore } from '../../store/usePokemonStore';
import { PokemonListItem } from '../../types';

describe('PokemonStore', () => {
  const _createPokemon = (id: number, name: string): PokemonListItem =>
    ({
      id,
      name,
      types: [],
      imageUrl: '',
    }) as any;

  beforeEach(() => {
    usePokemonStore.setState({
      team: [],
      history: [],
      future: [],
      favorites: new Set(),
      masterPokemonList: [],
      loading: false,
      error: null,
      minStats: {},
    });
  });

  describe('setMinStat legal stat bounds', () => {
    it('clamps values above 255 at the store boundary', () => {
      usePokemonStore.getState().setMinStat('hp', 9999);

      expect(usePokemonStore.getState().minStats).toEqual({ hp: 255 });
    });

    it('does not store negative or non-finite values', () => {
      usePokemonStore.getState().setMinStat('attack', -5);
      usePokemonStore.getState().setMinStat('speed', Number.NaN);

      expect(usePokemonStore.getState().minStats).toEqual({});
    });
  });

  it('should reorder team members correctly', () => {
    // team is now number[] (ID array)
    usePokemonStore.setState({ team: [1, 2, 3] });

    usePokemonStore.getState().reorderTeam(0, 1);

    const newState = usePokemonStore.getState();

    expect(newState.team[0]).toBe(2);
    expect(newState.team[1]).toBe(1);
    expect(newState.team[2]).toBe(3);
    expect(newState.team).toHaveLength(3);
  });

  it('should ignore invalid indices', () => {
    usePokemonStore.setState({ team: [1, 2] });

    usePokemonStore.getState().reorderTeam(0, 5); // Out of bounds

    const newState = usePokemonStore.getState();
    expect(newState.team[0]).toBe(1); // No change
  });
});
