import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { pwaManifest } from '../config/pwa';

const repoRoot = path.resolve(__dirname, '../..');
const readIndexHtml = () => fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf-8');

describe('PWA manifest', () => {
  it('names and describes the product in user-facing language', () => {
    expect(pwaManifest.name).toBe('Pokedex');
    expect(pwaManifest.short_name).toBe('Pokedex');
    expect(pwaManifest.description).toMatch(/explore every pok[eé]mon/i);

    const copy = [pwaManifest.name, pwaManifest.short_name, pwaManifest.description].join(' ');
    expect(copy).not.toMatch(/\b(graphql|vite|react|workbox|typescript|webpack)\b/i);
  });

  it('uses the dark-first theme for the splash and theme colours', () => {
    expect(pwaManifest.background_color).toBe('#0f172a');
    expect(pwaManifest.theme_color).toBe('#0f172a');
    expect(pwaManifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(pwaManifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);

    const themeColor = readIndexHtml().match(
      /<meta\s+name=["']theme-color["']\s+content=["'](#[0-9a-f]{6})["']/i
    )?.[1];
    expect(themeColor).toBe(pwaManifest.theme_color);
  });

  it('ships the 192 and 512 icons without claiming maskable artwork', () => {
    const icons = pwaManifest.icons;

    expect(icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512']);
    for (const icon of icons) {
      expect(icon.type).toBe('image/png');
      // The artwork is full-bleed, so a maskable crop would cut off the Poké Ball.
      expect(icon.purpose).toBe('any');
      expect(fs.existsSync(path.join(repoRoot, 'public', icon.src))).toBe(true);
    }
  });

  it('keeps the Apple install title aligned with the short name', () => {
    const appleTitle = readIndexHtml().match(
      /<meta\s+name=["']apple-mobile-web-app-title["']\s+content=["']([^"']+)["']/i
    )?.[1];
    expect(appleTitle).toBe(pwaManifest.short_name);
  });
});
