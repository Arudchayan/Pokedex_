import type { WalkerAnimation } from './walkersTypes';

import vscodePokemonIndex from './packs/vscode-pokemon.index.json';

export interface WalkersPackIndexEntry {
  generation: string;
  species: string;
}

export const VSCODE_POKEMON_INDEX = (vscodePokemonIndex as WalkersPackIndexEntry[])
  .filter((e) => e && typeof e.generation === 'string' && typeof e.species === 'string')
  .map((e) => ({ generation: e.generation, species: e.species }));

export function listAvailableSpecies(): string[] {
  const set = new Set<string>();
  for (const e of VSCODE_POKEMON_INDEX) {
    set.add(e.species);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function resolveEntryForSpecies(species: string): WalkersPackIndexEntry | null {
  const wanted = species.toLowerCase().trim();
  if (!wanted) return null;
  return VSCODE_POKEMON_INDEX.find((e) => e.species.toLowerCase() === wanted) ?? null;
}

export function spriteUrlFor(
  baseUrl: string,
  entry: WalkersPackIndexEntry,
  anim: WalkerAnimation
): string {
  // We keep the web app implementation simple:
  // - Only depend on `default_idle_8fps.gif` and `default_walk_8fps.gif`.
  // - Flip horizontally via CSS when walking left.
  const safeAnim: WalkerAnimation = anim === 'idle' ? 'idle' : 'walk';
  const trimmed = baseUrl.replace(/\/+$/, '');
  return `${trimmed}/media/${entry.generation}/${entry.species}/default_${safeAnim}_8fps.gif`;
}
