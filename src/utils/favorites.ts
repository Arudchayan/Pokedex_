// Favorites management using localStorage
import { MAX_POKEMON_ID } from '../constants';

const FAVORITES_KEY = 'pokedex_favorites';
const MAX_FAVORITES = 5000;

const isValidFavoriteId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= MAX_POKEMON_ID;

const normalizeFavorites = (values: Iterable<unknown>): Set<number> => {
  const result = new Set<number>();
  for (const value of values) {
    if (!isValidFavoriteId(value)) continue;
    result.add(value);
    if (result.size >= MAX_FAVORITES) break;
  }
  return result;
};

export const getFavorites = (): Set<number> => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return normalizeFavorites(parsed);
      }
    }
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
  return new Set();
};

export const saveFavorites = (favorites: Set<number>): void => {
  try {
    const array = Array.from(normalizeFavorites(favorites));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(array));
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
};

export const toggleFavorite = (pokemonId: number): Set<number> => {
  const favorites = getFavorites();
  if (!isValidFavoriteId(pokemonId)) return favorites;

  if (favorites.has(pokemonId)) {
    favorites.delete(pokemonId);
  } else {
    if (favorites.size >= MAX_FAVORITES) return favorites;
    favorites.add(pokemonId);
  }
  saveFavorites(favorites);
  return favorites;
};

export const isFavorite = (pokemonId: number): boolean => {
  const favorites = getFavorites();
  return favorites.has(pokemonId);
};
