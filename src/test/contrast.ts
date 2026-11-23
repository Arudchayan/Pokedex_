/**
 * WCAG contrast helpers for class-based Tailwind colours.
 *
 * Vitest runs in jsdom without the compiled Tailwind stylesheet, so the helpers
 * resolve the palette from the rendered class names instead of computed styles.
 * Only base utilities are considered (no `hover:` variants) and translucent
 * background layers are composited over the theme's page background.
 */

export type ContrastTheme = 'light' | 'dark';

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const PALETTE: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  'slate-50': '#f8fafc',
  'slate-100': '#f1f5f9',
  'slate-200': '#e2e8f0',
  'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8',
  'slate-500': '#64748b',
  'slate-600': '#475569',
  'slate-700': '#334155',
  'slate-800': '#1e293b',
  'slate-900': '#0f172a',
  'slate-950': '#020617',
};

const PAGE_BACKGROUND: Record<ContrastTheme, string> = {
  light: PALETTE['slate-100'],
  dark: PALETTE['slate-950'],
};

const COLOR_TOKEN = /^(text|bg)-(slate-\d{2,3}|white|black)(?:\/(\d{1,3}))?$/;

interface ColorToken {
  kind: 'text' | 'bg';
  hex: string;
  alpha: number;
}

function parseColorToken(token: string): ColorToken | null {
  const match = COLOR_TOKEN.exec(token);
  if (!match) return null;

  const hex = PALETTE[match[2]];
  if (!hex) return null;

  return {
    kind: match[1] as ColorToken['kind'],
    hex,
    alpha: match[3] === undefined ? 1 : Number(match[3]) / 100,
  };
}

function classesOf(element: Element): string[] {
  return (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

function hexToRgba(hex: string, alpha = 1): Rgba {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
    a: alpha,
  };
}

function composite(top: Rgba, bottom: Rgba): Rgba {
  return {
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  };
}

function channelLuminance(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function relativeLuminance(color: Rgba): number {
  return (
    0.2126 * channelLuminance(color.r) +
    0.7152 * channelLuminance(color.g) +
    0.0722 * channelLuminance(color.b)
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = relativeLuminance(hexToRgba(foreground));
  const bg = relativeLuminance(hexToRgba(background));
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Resolve the base text colour utility applied to an element. */
export function textColorHex(element: Element): string {
  for (const token of classesOf(element)) {
    const parsed = parseColorToken(token);
    if (parsed?.kind === 'text') return parsed.hex;
  }
  throw new Error(
    `No base text colour class on <${element.tagName.toLowerCase()} class="${element.getAttribute('class') ?? ''}">`
  );
}

/** Composite every background layer between the page and the element. */
export function backgroundColorHex(element: Element, theme: ContrastTheme): string {
  const layers: ColorToken[] = [];
  let node: Element | null = element;

  while (node) {
    for (const token of classesOf(node)) {
      const parsed = parseColorToken(token);
      if (parsed?.kind === 'bg') layers.push(parsed);
    }
    node = node.parentElement;
  }

  const result = layers
    .reverse()
    .reduce<Rgba>((background, layer) => composite(hexToRgba(layer.hex, layer.alpha), background), {
      ...hexToRgba(PAGE_BACKGROUND[theme]),
      a: 1,
    });

  return `#${[result.r, result.g, result.b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

export interface ContrastResult {
  ratio: number;
  foreground: string;
  background: string;
}

export function elementContrast(element: Element, theme: ContrastTheme): ContrastResult {
  const foreground = textColorHex(element);
  const background = backgroundColorHex(element, theme);
  return { ratio: contrastRatio(foreground, background), foreground, background };
}
