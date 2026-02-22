import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Content Security Policy', () => {
  it('should have a strict CSP meta tag in index.html', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const html = fs.readFileSync(indexPath, 'utf-8');

    // Use a regex to avoid adding a DOM parser dependency (e.g. jsdom) for a simple presence check.
    const cspRegex = /<meta\s+http-equiv=["']Content-Security-Policy["']\s+content=["'](.*?)["']\s*\/?>/i;
    const match = html.match(cspRegex);

    expect(match).not.toBeNull();
    const content = match![1];

    // Verify critical directives
    expect(content).toContain("default-src 'self'");
    expect(content).toContain("object-src 'none'");
    expect(content).toContain("base-uri 'self'");

    // Verify specific allowances
    expect(content).toContain('https://beta.pokeapi.co'); // API
    expect(content).toContain('https://raw.githubusercontent.com'); // Images/Assets
    expect(content).toContain('https://play.pokemonshowdown.com'); // Sprites
    // We ship Tailwind via build-time tooling, not a runtime CDN.
    expect(content).not.toContain('https://cdn.tailwindcss.com');
  });

  it('should have strict security headers in vercel.json', () => {
    const vercelConfigPath = path.resolve(__dirname, '../../vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));

    // Locate the headers configuration
    const headerConfig = vercelConfig.headers.find((h: any) => h.source === '/(.*)');
    expect(headerConfig).toBeDefined();

    const headers = headerConfig.headers;

    // Verify Content-Security-Policy
    const cspHeader = headers.find((h: any) => h.key === 'Content-Security-Policy');
    expect(cspHeader).toBeDefined();

    const cspContent = cspHeader.value;
    expect(cspContent).toContain("frame-ancestors 'none'");
    expect(cspContent).toContain("object-src 'none'");
    expect(cspContent).toContain("default-src 'self'");

    // Verify Defense in Depth (X-Frame-Options)
    const xFrameOptions = headers.find((h: any) => h.key === 'X-Frame-Options');
    expect(xFrameOptions).toBeDefined();
    expect(xFrameOptions.value).toBe('DENY');
  });
});
