import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');
const productionUrl = 'https://pokedex.arudchayan.com/';
const socialImageUrl = 'https://pokedex.arudchayan.com/og-image.png';

const readIndexHtml = () => fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf-8');

const metaContent = (html: string, attribute: 'name' | 'property', key: string) => {
  const tag = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i');
  return html.match(tag)?.[1];
};

describe('social preview metadata', () => {
  it('points every share URL at the production origin', () => {
    const html = readIndexHtml();
    const canonical = html.match(/<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];

    expect(html).not.toMatch(/pokedex\.app/i);
    expect(metaContent(html, 'property', 'og:url')).toBe(productionUrl);
    expect(metaContent(html, 'name', 'twitter:url')).toBe(productionUrl);
    expect(canonical).toBe(productionUrl);
  });

  it('advertises the 1200x630 social card for Open Graph and Twitter', () => {
    const html = readIndexHtml();

    expect(metaContent(html, 'property', 'og:site_name')).toBe('Pokedex');
    expect(metaContent(html, 'property', 'og:image')).toBe(socialImageUrl);
    expect(metaContent(html, 'name', 'twitter:image')).toBe(socialImageUrl);
    expect(metaContent(html, 'name', 'twitter:card')).toBe('summary_large_image');
    expect(metaContent(html, 'property', 'og:image:width')).toBe('1200');
    expect(metaContent(html, 'property', 'og:image:height')).toBe('630');
    expect(metaContent(html, 'property', 'og:image:type')).toBe('image/png');
  });

  it('ships a 1200x630 PNG under the 5 MB preview limit', () => {
    const bytes = fs.readFileSync(path.join(repoRoot, 'public', 'og-image.png'));
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(bytes.subarray(0, 8)).toEqual(pngSignature);
    expect(bytes.toString('ascii', 12, 16)).toBe('IHDR');
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
    expect(bytes.length).toBeLessThan(5 * 1024 * 1024);
  });
});
