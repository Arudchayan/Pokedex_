export interface FocusRingOptions {
  theme: 'dark' | 'light';
  /**
   * Set when the control sits on a dark surface even though the app theme is
   * light, such as the cyberpunk header.
   */
  onDarkSurface?: boolean;
}

/**
 * Theme-aware keyboard focus ring for controls on themed surfaces.
 *
 * The legacy `primary` colour token expands to invalid `rgb()` values, so
 * rings built on it are not painted. These explicit colours keep the
 * `:focus-visible` indicator visible against both light and dark surfaces.
 */
export function getFocusRingClassName({ theme, onDarkSurface = false }: FocusRingOptions): string {
  const outline =
    theme === 'dark' || onDarkSurface
      ? 'focus-visible:outline-white'
      : 'focus-visible:outline-slate-900';

  return `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:transition-none ${outline}`;
}
