/**
 * WCAG contrast helpers for Tailwind colours and inline backgrounds.
 *
 * Vitest runs in jsdom without the compiled Tailwind stylesheet, so the helpers
 * resolve the palette from the rendered class names instead of computed styles.
 * Only base utilities are considered (no `hover:` variants). Translucent layers
 * and element opacity are composited over the theme's page background.
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
  // Type-chip palette (see TYPE_COLORS in src/constants.ts).
  'gray-400': '#9ca3af',
  'gray-500': '#6b7280',
  'gray-700': '#374151',
  'red-500': '#ef4444',
  'blue-500': '#3b82f6',
  'yellow-400': '#facc15',
  'yellow-600': '#ca8a04',
  'green-500': '#22c55e',
  'cyan-300': '#67e8f9',
  'orange-700': '#c2410c',
  'purple-600': '#9333ea',
  'indigo-400': '#818cf8',
  'indigo-700': '#4338ca',
  'pink-500': '#ec4899',
  'pink-300': '#f9a8d4',
  'lime-500': '#84cc16',
  'stone-500': '#78716c',
  'violet-700': '#6d28d9',
};

const PAGE_BACKGROUND: Record<ContrastTheme, string> = {
  light: PALETTE['slate-100'],
  dark: PALETTE['slate-950'],
};

const COLOR_TOKEN = /^(text|bg)-([a-z]+-\d{2,3}|white|black)(?:\/(\d{1,3}))?$/;

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

/** Source-over compositing that keeps the resulting alpha. */
function composite(top: Rgba, bottom: Rgba): Rgba {
  const alpha = top.a + bottom.a * (1 - top.a);
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };

  return {
    r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha,
    g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha,
    b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha,
    a: alpha,
  };
}

const TRANSPARENT: Rgba = { r: 0, g: 0, b: 0, a: 0 };

function rgbaToHex(color: Rgba): string {
  return `#${[color.r, color.g, color.b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Parse the inline background React writes onto styled elements (e.g. type badges). */
function parseCssColor(value: string): Rgba | null {
  const hex = /^#[0-9a-f]{6}$/i.exec(value);
  if (hex) return hexToRgba(value);

  const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(value);
  if (!match) return null;

  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4]),
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

/**
 * Background layers painted on one element, topmost first.
 * An inline background takes precedence over background utilities.
 */
function ownBackgroundLayers(element: Element): Rgba[] {
  if (element instanceof HTMLElement) {
    const inline = parseCssColor(element.style.backgroundColor);
    if (inline) return [inline];
  }

  const layers: Rgba[] = [];
  for (const token of classesOf(element)) {
    const parsed = parseColorToken(token);
    if (parsed?.kind === 'bg') layers.push(hexToRgba(parsed.hex, parsed.alpha));
  }
  return layers;
}

/** Every background layer from the page down to the element, bottom-to-top. */
function backgroundChain(element: Element | null): Rgba[] {
  const chain: Rgba[] = [];
  let node: Element | null = element;

  while (node) {
    // The utilities are emitted in class order, so treat the first one as the top layer.
    chain.unshift(...ownBackgroundLayers(node).reverse());
    node = node.parentElement;
  }

  return chain;
}

function compositeBackground(element: Element | null, theme: ContrastTheme): Rgba {
  return backgroundChain(element).reduce<Rgba>(
    (background, layer) => composite(layer, background),
    { ...hexToRgba(PAGE_BACKGROUND[theme]), a: 1 }
  );
}

/** Composite every background layer between the page and the element. */
export function backgroundColorHex(element: Element, theme: ContrastTheme): string {
  return rgbaToHex(compositeBackground(element, theme));
}

/** Resolve element opacity utilities (`opacity-70`). */
function elementOpacity(element: Element): number {
  for (const token of classesOf(element)) {
    const match = /^opacity-(\d{1,3})$/.exec(token);
    if (match) return Math.min(100, Number(match[1])) / 100;
  }
  return 1;
}

export interface ContrastResult {
  ratio: number;
  foreground: string;
  background: string;
}

export function elementContrast(element: Element, theme: ContrastTheme): ContrastResult {
  const text = hexToRgba(textColorHex(element));
  const opacity = elementOpacity(element);
  let foreground: Rgba;
  let background: Rgba;

  if (opacity === 1) {
    foreground = text;
    background = compositeBackground(element, theme);
  } else {
    // CSS opacity composites the whole element (fill + label) over its backdrop.
    const backdrop = compositeBackground(element.parentElement, theme);
    const own = ownBackgroundLayers(element)
      .reverse()
      .reduce<Rgba>((bottom, layer) => composite(layer, bottom), TRANSPARENT);

    background = composite({ ...own, a: own.a * opacity }, backdrop);
    foreground = composite({ ...text, a: text.a * opacity }, backdrop);
  }

  const foregroundHex = rgbaToHex(foreground);
  const backgroundHex = rgbaToHex(background);
  return {
    ratio: contrastRatio(foregroundHex, backgroundHex),
    foreground: foregroundHex,
    background: backgroundHex,
  };
}
