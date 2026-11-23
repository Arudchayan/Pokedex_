import { describe, expect, it } from 'vitest';
import { APP_SHELL_NAVIGATION_ALLOWLIST, POKEMON_ID_PATTERN } from '../config/routing';
import { pwaWorkbox } from '../config/pwa';

const servesAppShell = (url: string) =>
  APP_SHELL_NAVIGATION_ALLOWLIST.some((pattern) => pattern.test(url));

describe('app shell navigation allowlist', () => {
  it('is wired into the generated Workbox config', () => {
    expect(pwaWorkbox.navigateFallbackAllowlist).toBe(APP_SHELL_NAVIGATION_ALLOWLIST);
  });

  it('serves the shell for the home route with or without query state', () => {
    expect(servesAppShell('/')).toBe(true);
    expect(servesAppShell('/?search=pikachu&dex=kanto')).toBe(true);
    expect(servesAppShell('/?pokemonPath=25')).toBe(true);
  });

  it('serves the shell for every supported National Dex id', () => {
    for (let id = 1; id <= 1025; id++) {
      expect(servesAppShell(`/pokemon/${id}`)).toBe(true);
      expect(servesAppShell(`/pokemon/${id}?compare=1,4`)).toBe(true);
    }

    expect(servesAppShell('/pokemon/025')).toBe(true);
    expect(servesAppShell('/pokemon/1025/')).toBe(true);
  });

  it('does not serve the shell for unknown or invalid paths', () => {
    for (const url of [
      '/does-not-exist',
      '/pokemon',
      '/pokemon/',
      '/pokemon/0',
      '/pokemon/1026',
      '/pokemon/99999',
      '/pokemon/abc',
      '/pokemon/25/extra',
      '/index.html',
    ]) {
      expect(servesAppShell(url)).toBe(false);
    }
  });

  it('uses the same id range as the Vercel redirect', () => {
    const idPattern = new RegExp(`^(?:${POKEMON_ID_PATTERN})$`);

    expect(idPattern.test('1')).toBe(true);
    expect(idPattern.test('1025')).toBe(true);
    expect(idPattern.test('1026')).toBe(false);
    expect(idPattern.test('0')).toBe(false);
  });
});
