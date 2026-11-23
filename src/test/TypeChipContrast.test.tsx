import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FilterControls from '../components/layout/FilterControls';
import TypeBadge from '../components/charts/TypeBadge';
import { TYPE_COLORS } from '../constants';
import { usePokemonStore } from '../store/usePokemonStore';
import { renderWithProvider } from './utils';
import { elementContrast, type ContrastTheme } from './contrast';

vi.mock('../services/soundService', () => ({
  playUISound: vi.fn(),
  toggleAudio: vi.fn(),
  isAudioEnabled: vi.fn(() => true),
}));

const ALL_TYPES = Object.keys(TYPE_COLORS);
const THEMES: ContrastTheme[] = ['light', 'dark'];
const MIN_CONTRAST = 4.5;

function expectContrast(element: Element, theme: ContrastTheme, label: string) {
  const { ratio, foreground, background } = elementContrast(element, theme);
  expect(
    ratio,
    `${label}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1 (${theme})`
  ).toBeGreaterThanOrEqual(MIN_CONTRAST);
}

const filterProps = {
  selectedGeneration: 'all',
  onGenerationChange: vi.fn(),
  selectedTypes: [] as string[],
  onTypeToggle: vi.fn(),
  flavorTextSearch: '',
  onFlavorTextChange: vi.fn(),
  onClearFilters: vi.fn(),
};

describe('Type chip contrast', () => {
  beforeEach(() => {
    localStorage.clear();
    usePokemonStore.getState().setTheme('dark');
  });

  describe.each(THEMES)('%s theme', (theme) => {
    it('keeps all 18 unselected filter chips at or above 4.5:1', () => {
      usePokemonStore.getState().setTheme(theme);
      renderWithProvider(<FilterControls {...filterProps} />);

      for (const type of ALL_TYPES) {
        const chip = screen.getByRole('button', { name: type });
        expect(chip).toHaveAttribute('aria-pressed', 'false');
        expectContrast(chip, theme, `unselected ${type} filter chip`);
        expect(chip.className).not.toMatch(/(^|\s)opacity-\d+/);
      }
    }, 15000);

    it('keeps all 18 selected filter chips at or above 4.5:1', () => {
      usePokemonStore.getState().setTheme(theme);
      renderWithProvider(<FilterControls {...filterProps} selectedTypes={ALL_TYPES} />);

      for (const type of ALL_TYPES) {
        const chip = screen.getByRole('button', { name: type });
        expect(chip).toHaveAttribute('aria-pressed', 'true');
        expectContrast(chip, theme, `selected ${type} filter chip`);
      }
    }, 15000);

    it('keeps every TypeBadge label at or above 4.5:1 in every size', () => {
      render(
        <div>
          {ALL_TYPES.flatMap((type) =>
            (['sm', 'md', 'lg'] as const).map((size) => (
              <TypeBadge key={`${type}-${size}`} type={type} size={size} />
            ))
          )}
        </div>
      );

      for (const type of ALL_TYPES) {
        for (const badge of screen.getAllByText(type)) {
          expectContrast(badge, theme, `${type} type badge`);
        }
      }
    });

    it('keeps every icon-only TypeBadge label at or above 4.5:1', () => {
      render(
        <div>
          {ALL_TYPES.map((type) => (
            <TypeBadge key={type} type={type} iconOnly size="sm" />
          ))}
        </div>
      );

      for (const type of ALL_TYPES) {
        expectContrast(screen.getByTitle(type), theme, `${type} icon badge`);
      }
    });
  });
});
