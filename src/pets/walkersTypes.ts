export type WalkersAssetPack = 'vscode-pokemon';

export type WalkerAnimation = 'idle' | 'walk' | 'walk_left' | 'walk_fast' | 'run';

export interface WalkerSpriteAvailability {
  idle: boolean;
  walk: boolean;
  walk_left?: boolean;
  walk_fast?: boolean;
  run?: boolean;
}

export interface WalkersPackEntry {
  generation: string; // e.g. "gen3"
  species: string; // e.g. "mudkip"
  color: string; // e.g. "default"
  originalSpriteSize: number; // e.g. 32/64 in the source pack naming
  sprites: WalkerSpriteAvailability;
}

export interface WalkersPackManifest {
  pack: WalkersAssetPack;
  version: number;
  generatedAt: string; // ISO
  baseUrl: string; // URL prefix for assets, e.g. "/pets/vscode-pokemon"
  entries: WalkersPackEntry[];
}

export type WalkersRosterMode = 'random' | 'choose';

export interface WalkersSettings {
  enabled: boolean;
  pack: WalkersAssetPack;
  assetBaseUrl: string; // e.g. "https://raw.githubusercontent.com/Arudchayan/vscode-pokemon/main"
  playgroundHeightPx: number;
  count: number;
  speedPxPerSec: number;
  spriteSizePx: number;
  interactive: boolean;
  rosterMode: WalkersRosterMode;
  chosenSpecies: string[]; // folder names; only used when rosterMode="choose"
}

export interface WalkerInstance {
  id: string;
  species: string;
  generation: string;
  color: string;
  originalSpriteSize: number;
  x: number;
  y: number;
  vx: number;
  facing: 1 | -1;
  anim: WalkerAnimation;
  dragging: boolean;
}
