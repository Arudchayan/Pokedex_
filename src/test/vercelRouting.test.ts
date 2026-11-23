import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

interface RedirectRule {
  source: string;
  destination: string;
  permanent?: boolean;
}

const repoRoot = path.resolve(__dirname, '../..');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'vercel.json'), 'utf-8')) as {
  redirects?: RedirectRule[];
};

describe('Vercel routing', () => {
  it('307-redirects numeric /pokemon/:id paths to the query deep link', () => {
    const redirect = vercelConfig.redirects?.find((rule) => rule.source.startsWith('/pokemon/'));

    expect(redirect).toEqual({
      source: '/pokemon/:id(\\d+)',
      destination: '/?pokemon=:id',
      permanent: false,
    });
  });

  it('does not blanket-redirect unknown paths to the app shell', () => {
    const sources = (vercelConfig.redirects ?? []).map((rule) => rule.source);

    expect(sources).not.toContain('/(.*)');
    expect(sources).not.toContain('/:path*');
    expect(sources.every((source) => source.startsWith('/pokemon/'))).toBe(true);
  });
});
