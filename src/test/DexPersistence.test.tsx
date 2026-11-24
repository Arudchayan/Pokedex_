import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import SortingControls from '../components/layout/SortingControls';
import { usePokemonStore } from '../store/usePokemonStore';

const PERSIST_KEY = 'pokedex-storage';

const seedPersistedDex = (selectedPokedex: unknown) => {
  localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: { selectedPokedex }, version: 0 }));
};

const readStoredDex = () =>
  JSON.parse(localStorage.getItem(PERSIST_KEY) ?? 'null')?.state?.selectedPokedex;

const resetStore = () => {
  usePokemonStore.setState({
    team: [],
    favorites: new Set(),
    sortBy: 'id',
    sortOrder: 'asc',
    selectedPokedex: 'national',
    searchTerm: '',
    selectedGeneration: 'all',
    selectedTypes: [],
    flavorTextSearch: '',
    minStats: {},
    selectedAbility: '',
    isMonoType: false,
    minBST: 0,
  });
};

const DexSelectorHarness = () => {
  const sortBy = usePokemonStore((state) => state.sortBy);
  const sortOrder = usePokemonStore((state) => state.sortOrder);
  const selectedPokedex = usePokemonStore((state) => state.selectedPokedex);
  const setSort = usePokemonStore((state) => state.setSort);
  const setPokedex = usePokemonStore((state) => state.setPokedex);

  return (
    <SortingControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={(value) => setSort(value, sortOrder)}
      onOrderChange={(order) => setSort(sortBy, order)}
      theme="dark"
      selectedPokedex={selectedPokedex}
      onPokedexChange={setPokedex}
    />
  );
};

const renderRestoredSelector = async (storedDex: unknown) => {
  seedPersistedDex(storedDex);
  await usePokemonStore.persist.rehydrate();
  render(<DexSelectorHarness />);
};

const getDexSelect = () => {
  const option = screen.getByRole('option', { name: 'Kanto' });
  return option.closest('select') as HTMLSelectElement;
};

describe('Dex selection persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it('restores a valid persisted regional dex and its list sort', async () => {
    await renderRestoredSelector('kanto');

    expect(usePokemonStore.getState().selectedPokedex).toBe('kanto');
    expect(usePokemonStore.getState().sortBy).toBe('regional-dex');
    expect(getDexSelect()).toHaveValue('kanto');
    expect(readStoredDex()).toBe('kanto');
  });

  it('restores the national dex and default id sort', async () => {
    await renderRestoredSelector('national');

    expect(usePokemonStore.getState().selectedPokedex).toBe('national');
    expect(usePokemonStore.getState().sortBy).toBe('id');
    expect(getDexSelect()).toHaveValue('national');
  });

  it('falls back to the national dex for an unsupported persisted value', async () => {
    await renderRestoredSelector('johto');

    expect(usePokemonStore.getState().selectedPokedex).toBe('national');
    expect(usePokemonStore.getState().sortBy).toBe('id');
    expect(getDexSelect()).toHaveValue('national');
    expect(readStoredDex()).toBe('national');
  });

  it('keeps the restored dex when filters are cleared', async () => {
    await renderRestoredSelector('kanto');

    act(() => {
      usePokemonStore.getState().clearFilters();
    });

    expect(usePokemonStore.getState().selectedPokedex).toBe('kanto');
    expect(usePokemonStore.getState().sortBy).toBe('regional-dex');
    expect(getDexSelect()).toHaveValue('kanto');
    expect(readStoredDex()).toBe('kanto');
  });
});
