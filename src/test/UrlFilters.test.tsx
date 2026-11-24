import { beforeEach, describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { applyUrlFilters } from '../app/urlState';
import { usePokemonStore } from '../store/usePokemonStore';
import type { PokemonListItem } from '../types';
import { renderWithProvider, setPokeapiServiceMock } from './utils';

const pokemon = (id: number, name: string): PokemonListItem => ({
  id,
  name,
  imageUrl: '',
  shinyImageUrl: '',
  types: [],
  flavorText: '',
  stats: [],
  abilities: [],
});

const bulbasaur = pokemon(1, 'bulbasaur');
const charmander = pokemon(4, 'charmander');
const pikachu = pokemon(25, 'pikachu');

const filteredIds = () => usePokemonStore.getState().filteredPokemon.map((entry) => entry.id);

describe('URL filter state', () => {
  beforeEach(() => {
    usePokemonStore.setState({
      masterPokemonList: [],
      filteredPokemon: [],
      searchTerm: '',
      selectedPokedex: 'national',
      sortBy: 'id',
      sortOrder: 'asc',
      favorites: new Set<number>(),
      loading: false,
      error: null,
      isFiltering: false,
    });
  });

  it('applies ?search and ?dex before the first filtered list renders', async () => {
    setPokeapiServiceMock({
      fetchAllPokemons: [charmander, pikachu, bulbasaur],
      fetchRegionalDexMap: new Map([
        [1, 1],
        [4, 2],
        [25, 3],
      ]),
    });

    applyUrlFilters('?search=pikachu&dex=kanto');
    renderWithProvider(<div />);

    await waitFor(() => {
      expect(filteredIds()).toEqual([25]);
    });

    const state = usePokemonStore.getState();
    expect(state.searchTerm).toBe('pikachu');
    expect(state.selectedPokedex).toBe('kanto');
    expect(state.sortBy).toBe('regional-dex');
  });

  it('sorts the list by the requested regional dex', async () => {
    setPokeapiServiceMock({
      fetchAllPokemons: [bulbasaur, charmander, pikachu],
      fetchRegionalDexMap: new Map([
        [25, 1],
        [4, 2],
        [1, 3],
      ]),
    });

    applyUrlFilters('?dex=kanto');
    renderWithProvider(<div />);

    await waitFor(() => {
      expect(filteredIds()).toEqual([25, 4, 1]);
    });

    expect(usePokemonStore.getState().selectedPokedex).toBe('kanto');
  });

  it('ignores an invalid dex without changing persisted defaults', () => {
    applyUrlFilters('?dex=not-a-dex');

    const state = usePokemonStore.getState();
    expect(state.selectedPokedex).toBe('national');
    expect(state.sortBy).toBe('id');
  });
});
