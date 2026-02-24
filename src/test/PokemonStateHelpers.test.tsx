import { describe, it, expect } from 'vitest';
import { applyFilters, applySort } from '../domain/pokemonList';
import { PokemonListItem } from '../types';

const samplePokemon: PokemonListItem[] = [
  {
    id: 1,
    name: 'bulbasaur',
    imageUrl: '',
    shinyImageUrl: '',
    types: ['grass', 'poison'],
    flavorText: '',
    stats: [
      { name: 'hp', value: 45 },
      { name: 'attack', value: 49 },
      { name: 'defense', value: 49 },
      { name: 'special-attack', value: 65 },
      { name: 'special-defense', value: 65 },
      { name: 'speed', value: 45 },
    ], // BST: 318
    abilities: [],
  },
  {
    id: 4,
    name: 'charmander',
    imageUrl: '',
    shinyImageUrl: '',
    types: ['fire'],
    flavorText: '',
    stats: [
      { name: 'hp', value: 39 },
      { name: 'attack', value: 52 },
      { name: 'defense', value: 43 },
      { name: 'special-attack', value: 60 },
      { name: 'special-defense', value: 50 },
      { name: 'speed', value: 65 },
    ], // BST: 309
    abilities: [],
  },
  {
    id: 149,
    name: 'dragonite',
    imageUrl: '',
    shinyImageUrl: '',
    types: ['dragon', 'flying'],
    flavorText: '',
    stats: [
      { name: 'hp', value: 91 },
      { name: 'attack', value: 134 },
      { name: 'defense', value: 95 },
      { name: 'special-attack', value: 100 },
      { name: 'special-defense', value: 100 },
      { name: 'speed', value: 80 },
    ], // BST: 600
    abilities: [],
  },
];

describe('applyFilters', () => {
  it('filters by Mono-type', () => {
    const result = applyFilters(samplePokemon, {
      searchTerm: '',
      selectedGeneration: 'all',
      selectedTypes: [],
      flavorTextSearch: '',
      minStats: {},
      selectedAbility: '',
      isMonoType: true,
      minBST: 0,
    });

    // Should only include Charmander (Fire)
    // Bulbasaur (Grass/Poison) and Dragonite (Dragon/Flying) should be excluded
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('charmander');
  });

  it('filters by BST', () => {
    const result = applyFilters(samplePokemon, {
      searchTerm: '',
      selectedGeneration: 'all',
      selectedTypes: [],
      flavorTextSearch: '',
      minStats: {},
      selectedAbility: '',
      isMonoType: false,
      minBST: 600,
    });

    // Should only include Dragonite (BST 600)
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('dragonite');
  });
});

describe('applySort', () => {
  const favorites = new Set<number>([1]); // Bulbasaur is fav

  it('sorts by ID ascending', () => {
    const result = applySort(samplePokemon, 'id', 'asc', favorites);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(4);
    expect(result[2].id).toBe(149);
  });

  it('sorts by BST descending', () => {
    const result = applySort(samplePokemon, 'bst', 'desc', favorites);
    // Dragonite (600), Bulbasaur (318), Charmander (309)
    expect(result[0].name).toBe('dragonite');
    expect(result[1].name).toBe('bulbasaur');
    expect(result[2].name).toBe('charmander');
  });

  it('sorts by Speed ascending', () => {
    const result = applySort(samplePokemon, 'speed', 'asc', favorites);
    // Bulbasaur (45), Charmander (65), Dragonite (80)
    expect(result[0].name).toBe('bulbasaur');
    expect(result[1].name).toBe('charmander');
    expect(result[2].name).toBe('dragonite');
  });

  it('sorts by Attack descending', () => {
    const result = applySort(samplePokemon, 'attack', 'desc', favorites);
    // Dragonite (134), Charmander (52), Bulbasaur (49)
    expect(result[0].name).toBe('dragonite');
    expect(result[1].name).toBe('charmander');
    expect(result[2].name).toBe('bulbasaur');
  });
});
