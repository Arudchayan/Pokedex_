import type { WalkersSettings } from './walkersTypes';

const STORAGE_KEY = 'pokedex_walkers_settings_v1';
const MAX_WALKERS = 24;
const MAX_CHOSEN_SPECIES = 100;
const ALLOWED_ASSET_HOSTS = new Set(['raw.githubusercontent.com']);

export const DEFAULT_WALKERS_SETTINGS: WalkersSettings = {
  enabled: false,
  pack: 'vscode-pokemon',
  assetBaseUrl: 'https://raw.githubusercontent.com/Arudchayan/vscode-pokemon/main',
  playgroundHeightPx: 150,
  count: 2,
  speedPxPerSec: 50,
  spriteSizePx: 48,
  interactive: true,
  rosterMode: 'random',
  chosenSpecies: ['mudkip', 'treecko'],
};

function clampInt(val: unknown, min: number, max: number, fallback: number) {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.round(n);
  return Math.max(min, Math.min(max, i));
}

function clampNum(val: unknown, min: number, max: number, fallback: number) {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function sanitizeAssetBaseUrl(val: unknown): string {
  if (typeof val !== 'string' || val.trim().length === 0) {
    return DEFAULT_WALKERS_SETTINGS.assetBaseUrl;
  }

  try {
    const parsed = new URL(val.trim());
    if (parsed.protocol !== 'https:') return DEFAULT_WALKERS_SETTINGS.assetBaseUrl;
    if (!ALLOWED_ASSET_HOSTS.has(parsed.hostname.toLowerCase())) {
      return DEFAULT_WALKERS_SETTINGS.assetBaseUrl;
    }
    if (parsed.username || parsed.password) return DEFAULT_WALKERS_SETTINGS.assetBaseUrl;
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_WALKERS_SETTINGS.assetBaseUrl;
  }
}

function sanitizeChosenSpecies(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_WALKERS_SETTINGS.chosenSpecies;
  const sanitized = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => /^[a-z0-9-]{1,32}$/.test(entry));

  return Array.from(new Set(sanitized)).slice(0, MAX_CHOSEN_SPECIES);
}

export function loadWalkersSettings(): WalkersSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WALKERS_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<WalkersSettings>;
    return {
      ...DEFAULT_WALKERS_SETTINGS,
      enabled: !!parsed.enabled,
      pack: parsed.pack === 'vscode-pokemon' ? 'vscode-pokemon' : DEFAULT_WALKERS_SETTINGS.pack,
      assetBaseUrl: sanitizeAssetBaseUrl(parsed.assetBaseUrl),
      playgroundHeightPx: clampInt(
        parsed.playgroundHeightPx,
        90,
        260,
        DEFAULT_WALKERS_SETTINGS.playgroundHeightPx
      ),
      count: clampInt(parsed.count, 0, MAX_WALKERS, DEFAULT_WALKERS_SETTINGS.count),
      speedPxPerSec: clampNum(
        parsed.speedPxPerSec,
        10,
        220,
        DEFAULT_WALKERS_SETTINGS.speedPxPerSec
      ),
      spriteSizePx: clampInt(parsed.spriteSizePx, 12, 256, DEFAULT_WALKERS_SETTINGS.spriteSizePx),
      interactive:
        parsed.interactive !== undefined
          ? !!parsed.interactive
          : DEFAULT_WALKERS_SETTINGS.interactive,
      rosterMode: parsed.rosterMode === 'choose' ? 'choose' : 'random',
      chosenSpecies: sanitizeChosenSpecies(parsed.chosenSpecies),
    };
  } catch {
    return DEFAULT_WALKERS_SETTINGS;
  }
}

export function saveWalkersSettings(settings: WalkersSettings) {
  try {
    const sanitized: WalkersSettings = {
      ...settings,
      enabled: !!settings.enabled,
      pack: settings.pack === 'vscode-pokemon' ? 'vscode-pokemon' : DEFAULT_WALKERS_SETTINGS.pack,
      assetBaseUrl: sanitizeAssetBaseUrl(settings.assetBaseUrl),
      playgroundHeightPx: clampInt(
        settings.playgroundHeightPx,
        90,
        260,
        DEFAULT_WALKERS_SETTINGS.playgroundHeightPx
      ),
      count: clampInt(settings.count, 0, MAX_WALKERS, DEFAULT_WALKERS_SETTINGS.count),
      speedPxPerSec: clampNum(
        settings.speedPxPerSec,
        10,
        220,
        DEFAULT_WALKERS_SETTINGS.speedPxPerSec
      ),
      spriteSizePx: clampInt(settings.spriteSizePx, 12, 256, DEFAULT_WALKERS_SETTINGS.spriteSizePx),
      interactive: !!settings.interactive,
      rosterMode: settings.rosterMode === 'choose' ? 'choose' : 'random',
      chosenSpecies: sanitizeChosenSpecies(settings.chosenSpecies),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // ignore storage failures
  }
}
