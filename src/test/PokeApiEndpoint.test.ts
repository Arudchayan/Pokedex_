import { describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { POKEAPI_GRAPHQL_URL } from '../constants';
import { DEFAULT_POKEAPI_GRAPHQL_URL, resolvePokeapiGraphqlUrl } from '../config/env';

const repoRoot = path.resolve(__dirname, '../..');
const graphqlDir = path.resolve(repoRoot, 'src/graphql');

describe('PokeAPI GraphQL endpoint', () => {
  it('defaults to the supported v1beta2 host', () => {
    expect(POKEAPI_GRAPHQL_URL).toBe(DEFAULT_POKEAPI_GRAPHQL_URL);
    expect(new URL(POKEAPI_GRAPHQL_URL).hostname).toBe('graphql.pokeapi.co');
    expect(POKEAPI_GRAPHQL_URL).toContain('/v1beta2');
  });

  it('ignores a configured retired endpoint and warns', () => {
    const retired = 'https://beta.pokeapi.co/graphql/v1beta';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      expect(resolvePokeapiGraphqlUrl(retired)).toBe(DEFAULT_POKEAPI_GRAPHQL_URL);
      expect(resolvePokeapiGraphqlUrl(`${retired}/`)).toBe(DEFAULT_POKEAPI_GRAPHQL_URL);
      expect(resolvePokeapiGraphqlUrl('http://beta.pokeapi.co/graphql/v1beta')).toBe(
        DEFAULT_POKEAPI_GRAPHQL_URL
      );
      expect(warnSpy).toHaveBeenCalledTimes(3);
      expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
        'Ignoring retired PokeAPI GraphQL endpoint'
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('falls back without warning when no endpoint is configured', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      expect(resolvePokeapiGraphqlUrl('')).toBe(DEFAULT_POKEAPI_GRAPHQL_URL);
      expect(resolvePokeapiGraphqlUrl(undefined)).toBe(DEFAULT_POKEAPI_GRAPHQL_URL);
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('keeps a custom non-retired endpoint override', () => {
    expect(resolvePokeapiGraphqlUrl('https://example.com/graphql')).toBe(
      'https://example.com/graphql'
    );
  });

  it('keeps every GraphQL document on the current schema', () => {
    const documents = fs.readdirSync(graphqlDir).filter((file) => file.endsWith('.graphql'));
    expect(documents.length).toBeGreaterThan(0);

    for (const file of documents) {
      const contents = fs.readFileSync(path.join(graphqlDir, file), 'utf8');
      expect(contents, `${file} still uses the retired pokemon_v2_ schema`).not.toMatch(
        /\bpokemon_v2_/
      );
      expect(contents, `${file} still targets the retired endpoint`).not.toContain(
        'beta.pokeapi.co'
      );
    }
  });

  it('points codegen at the supported endpoint', () => {
    const codegenConfig = fs.readFileSync(path.resolve(repoRoot, 'codegen.ts'), 'utf8');
    expect(codegenConfig).toContain(DEFAULT_POKEAPI_GRAPHQL_URL);
    expect(codegenConfig).not.toContain('beta.pokeapi.co');
  });

  it('requests a 100-item held-item pool without a price filter', () => {
    const document = fs.readFileSync(path.join(graphqlDir, 'fetchItems.graphql'), 'utf8');

    expect(document).toContain('limit: 100');
    expect(document).toContain('holdable');
    expect(document).not.toMatch(/purchase_price:\s*\{\s*_gt/);
  });
});
