export type FormFieldTheme = 'light' | 'dark';

/**
 * Colour contract for calculator inputs, selects and the Pokémon autocomplete.
 *
 * Every field carries an explicit foreground so it never falls back to the
 * browser's black default over a dark surface. Layout utilities (width,
 * padding, radius) stay at the call site so each control keeps its geometry.
 *
 * The contract is pinned by `src/test/components/CalculatorInputContrast.test.tsx`:
 * text and placeholder ≥ 4.5:1, focus ring ≥ 3:1, disabled text ≥ 4.5:1.
 */
export function formFieldClasses(theme: FormFieldTheme): string {
  return theme === 'dark'
    ? 'border-white/15 bg-slate-950 text-slate-100 caret-slate-100 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70'
    : 'border-slate-300 bg-white text-slate-900 caret-slate-900 placeholder:text-slate-600 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70';
}
