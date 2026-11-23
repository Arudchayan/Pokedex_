import { describe, expect, it } from 'vitest';
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

  it('ignores a configured retired endpoint', () => {
    const retired = 'https://beta.pokeapi.co/graphql/v1beta';

    expect(resolvePokeapiGraphqlUrl(retired)).toBe(DEFAULT_POKEAPI_GRAPHQL_URL);
    expect(resolvePokeapiGraphqlUrl(`${retired}/`)).toBe(DEFAULT_POKEAPI_GRAPHQL_URL);
    expect(resolvePokeapiGraphqlUrl('http://beta.pokeapi.co/graphql/v1beta')).toBe(
      DEFAULT_POKEAPI_GRAPHQL_URL
    );
    expect(resolvePokeapiGraphqlUrl('')).toBe(DEFAULT_POKEAPI_GRAPHQL_URL);
    expect(resolvePokeapiGraphqlUrl(undefined)).toBe(DEFAULT_POKEAPI_GRAPHQL_URL);
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
});
