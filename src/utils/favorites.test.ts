import { describe, it, expect, beforeEach } from 'vitest';
import { getFavorites, saveFavorites, toggleFavorite, isFavorite } from './favorites';
import { MAX_POKEMON_ID } from '../constants';

describe('Favorites Utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return an empty set when no favorites exist', () => {
    const favorites = getFavorites();
    expect(favorites.size).toBe(0);
  });

  it('should save and retrieve favorites', () => {
    const favorites = new Set([1, 25, 150]);
    saveFavorites(favorites);

    const retrieved = getFavorites();
    expect(retrieved.has(1)).toBe(true);
    expect(retrieved.has(25)).toBe(true);
    expect(retrieved.has(150)).toBe(true);
    expect(retrieved.size).toBe(3);
  });

  it('should toggle favorites correctly', () => {
    // Add 25
    let favorites = toggleFavorite(25);
    expect(favorites.has(25)).toBe(true);
    expect(isFavorite(25)).toBe(true);

    // Add 1
    favorites = toggleFavorite(1);
    expect(favorites.has(1)).toBe(true);
    expect(favorites.has(25)).toBe(true);

    // Remove 25
    favorites = toggleFavorite(25);
    expect(favorites.has(25)).toBe(false);
    expect(favorites.has(1)).toBe(true);
    expect(isFavorite(25)).toBe(false);
  });

  it('should persist across sessions (localStorage simulation)', () => {
    toggleFavorite(100);

    // "Restart" app by reading from storage again
    const newSessionFavorites = getFavorites();
    expect(newSessionFavorites.has(100)).toBe(true);
  });

  it('drops invalid favorite ids from storage', () => {
    localStorage.setItem(
      'pokedex_favorites',
      JSON.stringify([1, -2, 0, 3.14, '12', MAX_POKEMON_ID + 1, 5])
    );

    const favorites = getFavorites();
    expect(Array.from(favorites)).toEqual([1, 5]);
  });

  it('ignores invalid ids when toggling', () => {
    const favorites = toggleFavorite(-1);
    expect(favorites.size).toBe(0);
    expect(isFavorite(-1)).toBe(false);
  });
});
