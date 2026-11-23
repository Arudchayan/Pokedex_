/** Pokedex options exposed by the Dex selector and accepted by `?dex=`. */
export const POKEDEX_OPTIONS = [
  { value: 'national', label: 'National Dex' },
  { value: 'kanto', label: 'Kanto' },
  { value: 'original-johto', label: 'Johto' },
  { value: 'hoenn', label: 'Hoenn' },
  { value: 'original-sinnoh', label: 'Sinnoh' },
  { value: 'original-unova', label: 'Unova' },
  { value: 'kalos-central', label: 'Kalos' },
  { value: 'original-alola', label: 'Alola' },
  { value: 'galar', label: 'Galar' },
  { value: 'hisui', label: 'Hisui' },
  { value: 'paldea', label: 'Paldea' },
] as const;

export type PokedexId = (typeof POKEDEX_OPTIONS)[number]['value'];

const POKEDEX_IDS = new Set<string>(POKEDEX_OPTIONS.map((option) => option.value));

export const isPokedexId = (value: string): value is PokedexId => POKEDEX_IDS.has(value);
