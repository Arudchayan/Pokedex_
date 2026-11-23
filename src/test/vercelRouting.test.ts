import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { POKEMON_ID_PATTERN } from '../config/routing';

interface RedirectRule {
  source: string;
  destination: string;
  permanent?: boolean;
}

const repoRoot = path.resolve(__dirname, '../..');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'vercel.json'), 'utf-8')) as {
  redirects?: RedirectRule[];
};

const redirect = vercelConfig.redirects?.find((rule) => rule.source.startsWith('/pokemon/'));

describe('Vercel routing', () => {
  it('307-redirects valid /pokemon/:id paths to the path marker', () => {
    expect(redirect).toEqual({
      source: `/pokemon/:id(${POKEMON_ID_PATTERN})`,
      destination: '/?pokemonPath=:id',
      permanent: false,
    });
  });

  it('matches only supported National Dex ids', () => {
    const sourcePattern = redirect ? /^\/pokemon\/:id\((.*)\)$/.exec(redirect.source)?.[1] : null;
    expect(sourcePattern).toBe(POKEMON_ID_PATTERN);

    const idPattern = new RegExp(`^(?:${sourcePattern})$`);

    for (let id = 1; id <= 1025; id++) {
      expect(idPattern.test(String(id))).toBe(true);
      expect(idPattern.test(String(id).padStart(4, '0'))).toBe(true);
    }

    for (const invalid of ['0', '000', '1026', '99999', 'abc', '25abc', '-1']) {
      expect(idPattern.test(invalid)).toBe(false);
    }
  });

  it('does not blanket-redirect unknown paths to the app shell', () => {
    const sources = (vercelConfig.redirects ?? []).map((rule) => rule.source);

    expect(sources).not.toContain('/(.*)');
    expect(sources).not.toContain('/:path*');
    expect(sources.every((source) => source.startsWith('/pokemon/'))).toBe(true);
  });
});
