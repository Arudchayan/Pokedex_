import { describe, expect, it } from 'vitest';
import { POKEDEX_OPTIONS } from '../config/pokedex';
import { parseUrlFilters } from './urlFilters';

describe('parseUrlFilters', () => {
  it('reads a search term and trims surrounding whitespace', () => {
    expect(parseUrlFilters('?search=%20pikachu%20')).toEqual({ search: 'pikachu' });
    expect(parseUrlFilters('?search=pika+chu')).toEqual({ search: 'pika chu' });
  });

  it('reads every supported dex and ignores case', () => {
    for (const { value } of POKEDEX_OPTIONS) {
      expect(parseUrlFilters(`?dex=${value.toUpperCase()}`)).toEqual({ dex: value });
    }
  });

  it('ignores missing, empty, and invalid values', () => {
    expect(parseUrlFilters('')).toEqual({});
    expect(parseUrlFilters('?search=&dex=')).toEqual({});
    expect(parseUrlFilters('?search=%20%20')).toEqual({});
    expect(parseUrlFilters('?dex=not-a-dex')).toEqual({});
    expect(parseUrlFilters('?dex=1026')).toEqual({});
  });

  it('bounds the accepted search term length', () => {
    const parsed = parseUrlFilters(`?search=${'a'.repeat(500)}`);

    expect(parsed.search).toHaveLength(200);
    expect(parsed.search).toBe('a'.repeat(200));
  });

  it('reads search and dex together without touching other params', () => {
    expect(parseUrlFilters('?pokemon=25&search=pikachu&compare=1,4&dex=kanto')).toEqual({
      search: 'pikachu',
      dex: 'kanto',
    });
  });
});
