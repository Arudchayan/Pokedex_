import { afterEach, describe, expect, it } from 'vitest';
import {
  consumePokemonPathMarker,
  normalizePokemonPath,
  normalizePokemonPathInLocation,
  parsePokemonId,
} from './pokemonPath';

const parts = (pathname: string, search = '', hash = '') => ({ pathname, search, hash });

describe('parsePokemonId', () => {
  it('accepts positive National Dex ids', () => {
    expect(parsePokemonId('1')).toBe(1);
    expect(parsePokemonId('25')).toBe(25);
    expect(parsePokemonId('1025')).toBe(1025);
    expect(parsePokemonId('0025')).toBe(25);
  });

  it('rejects missing, malformed, and out-of-range ids', () => {
    const invalid = [null, undefined, '', '0', '-1', '1.5', '25abc', 'abc', ' 25', '1026', '99999'];

    for (const raw of invalid) {
      expect(parsePokemonId(raw)).toBeNull();
    }
  });
});

describe('normalizePokemonPath', () => {
  it('maps /pokemon/:id to the canonical query deep link', () => {
    expect(normalizePokemonPath(parts('/pokemon/25'))).toBe('/?pokemon=25');
  });

  it('accepts a trailing slash and normalizes leading zeros', () => {
    expect(normalizePokemonPath(parts('/pokemon/025/'))).toBe('/?pokemon=25');
  });

  it('preserves unrelated query params and the hash', () => {
    const normalized = normalizePokemonPath(
      parts('/pokemon/25', '?compare=1,4&foo=bar', '#overview')
    );

    expect(normalized).not.toBeNull();
    const url = new URL(normalized!, 'https://example.test');
    expect(url.pathname).toBe('/');
    expect(url.hash).toBe('#overview');
    expect(url.searchParams.get('compare')).toBe('1,4');
    expect(url.searchParams.get('foo')).toBe('bar');
    expect(url.searchParams.get('pokemon')).toBe('25');
  });

  it('lets the path id win over a conflicting ?pokemon value', () => {
    const normalized = normalizePokemonPath(parts('/pokemon/25', '?pokemon=6'));

    expect(normalized).not.toBeNull();
    const url = new URL(normalized!, 'https://example.test');
    expect(url.searchParams.getAll('pokemon')).toEqual(['25']);
  });

  it.each([
    '/',
    '/pokemon',
    '/pokemon/',
    '/pokemon/abc',
    '/pokemon/0',
    '/pokemon/1026',
    '/pokemon/25abc',
    '/pokemon/25/extra',
    '/pokemons/25',
  ])('leaves %s untouched', (pathname) => {
    expect(normalizePokemonPath(parts(pathname))).toBeNull();
  });

  it('is a no-op once normalized (no redirect loop)', () => {
    expect(normalizePokemonPath(parts('/', '?pokemon=25'))).toBeNull();
  });
});

describe('consumePokemonPathMarker', () => {
  it('converts the Vercel marker into the canonical query deep link', () => {
    expect(consumePokemonPathMarker(parts('/', '?pokemonPath=25'))).toBe('/?pokemon=25');
  });

  it('lets the path id win over a merged conflicting ?pokemon value', () => {
    const normalized = consumePokemonPathMarker(parts('/', '?pokemon=6&pokemonPath=25'));

    expect(normalized).not.toBeNull();
    const url = new URL(normalized!, 'https://example.test');
    expect(url.searchParams.getAll('pokemon')).toEqual(['25']);
    expect(url.searchParams.has('pokemonPath')).toBe(false);
  });

  it('preserves unrelated query params, hashes, and leading-zero ids', () => {
    const normalized = consumePokemonPathMarker(
      parts('/', '?compare=1,4&foo=bar&pokemonPath=025', '#overview')
    );

    expect(normalized).not.toBeNull();
    const url = new URL(normalized!, 'https://example.test');
    expect(url.hash).toBe('#overview');
    expect(url.searchParams.get('compare')).toBe('1,4');
    expect(url.searchParams.get('foo')).toBe('bar');
    expect(url.searchParams.get('pokemon')).toBe('25');
    expect(url.searchParams.has('pokemonPath')).toBe(false);
  });

  it('uses the last marker when the request already contained one', () => {
    const normalized = consumePokemonPathMarker(parts('/', '?pokemonPath=6&pokemonPath=25'));

    expect(normalized).not.toBeNull();
    const url = new URL(normalized!, 'https://example.test');
    expect(url.searchParams.getAll('pokemon')).toEqual(['25']);
  });

  it('removes an invalid marker without opening a detail view', () => {
    expect(consumePokemonPathMarker(parts('/', '?pokemonPath=abc&compare=1'))).toBe('/?compare=1');
    expect(consumePokemonPathMarker(parts('/', '?pokemonPath=0'))).toBe('/');
    expect(consumePokemonPathMarker(parts('/', '?pokemonPath=1026'))).toBe('/');
  });

  it('is a no-op when the marker is absent', () => {
    expect(consumePokemonPathMarker(parts('/', '?pokemon=25'))).toBeNull();
  });
});

describe('normalizePokemonPathInLocation', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('rewrites the address bar in place before render', () => {
    window.history.replaceState(null, '', '/pokemon/25?compare=1,4#overview');

    normalizePokemonPathInLocation();

    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('?compare=1%2C4&pokemon=25');
    expect(window.location.hash).toBe('#overview');
  });

  it('consumes a Vercel path marker on the home route', () => {
    window.history.replaceState(null, '', '/?pokemon=6&pokemonPath=25&compare=1,4');

    normalizePokemonPathInLocation();

    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('?pokemon=25&compare=1%2C4');
  });

  it('removes an invalid Vercel path marker', () => {
    window.history.replaceState(null, '', '/?pokemonPath=1026&compare=1,4');

    normalizePokemonPathInLocation();

    expect(window.location.search).toBe('?compare=1%2C4');
  });

  it('leaves other paths untouched', () => {
    window.history.replaceState(null, '', '/does-not-exist');

    normalizePokemonPathInLocation();

    expect(window.location.pathname).toBe('/does-not-exist');
  });
});
