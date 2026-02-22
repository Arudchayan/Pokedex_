import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_WALKERS_SETTINGS,
  loadWalkersSettings,
  saveWalkersSettings,
} from './walkersSettings';

describe('walkersSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('falls back to default asset host for untrusted URLs', () => {
    localStorage.setItem(
      'pokedex_walkers_settings_v1',
      JSON.stringify({
        assetBaseUrl: 'https://evil.example.com/assets',
      })
    );

    const settings = loadWalkersSettings();
    expect(settings.assetBaseUrl).toBe(DEFAULT_WALKERS_SETTINGS.assetBaseUrl);
  });

  it('clamps count to max range', () => {
    localStorage.setItem(
      'pokedex_walkers_settings_v1',
      JSON.stringify({
        count: 999,
      })
    );

    const settings = loadWalkersSettings();
    expect(settings.count).toBe(24);
  });

  it('sanitizes chosen species values', () => {
    localStorage.setItem(
      'pokedex_walkers_settings_v1',
      JSON.stringify({
        chosenSpecies: ['pikachu', 'Pikachu', '  eevee ', 'x<script>', 'mr mime'],
      })
    );

    const settings = loadWalkersSettings();
    expect(settings.chosenSpecies).toEqual(['pikachu', 'eevee']);
  });

  it('sanitizes and persists settings through save', () => {
    saveWalkersSettings({
      ...DEFAULT_WALKERS_SETTINGS,
      assetBaseUrl: 'http://raw.githubusercontent.com/Arudchayan/vscode-pokemon/main',
      count: 999,
      chosenSpecies: ['bulbasaur', 'x<script>'],
    });

    const saved = loadWalkersSettings();
    expect(saved.assetBaseUrl).toBe(DEFAULT_WALKERS_SETTINGS.assetBaseUrl);
    expect(saved.count).toBe(24);
    expect(saved.chosenSpecies).toEqual(['bulbasaur']);
  });
});
