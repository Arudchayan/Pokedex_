import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeSelector from '../components/layout/ThemeSelector';
import FilterControls from '../components/layout/FilterControls';
import SortingControls from '../components/layout/SortingControls';
import { usePokemonStore } from '../store/usePokemonStore';
import { renderWithProvider } from './utils';
import { elementContrast, type ContrastTheme } from './contrast';

vi.mock('../services/soundService', () => ({
  playUISound: vi.fn(),
  toggleAudio: vi.fn(),
  isAudioEnabled: vi.fn(() => true),
}));

const MIN_CONTRAST = 4.5;

function expectContrast(element: Element, theme: ContrastTheme) {
  const { ratio, foreground, background } = elementContrast(element, theme);
  expect(ratio, `${foreground} on ${background} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
    MIN_CONTRAST
  );
}

function openThemePanel() {
  fireEvent.click(screen.getByTitle('Customize Theme'));
}

describe('Muted label contrast', () => {
  beforeEach(() => {
    localStorage.clear();
    usePokemonStore.getState().setTheme('dark');
    usePokemonStore.getState().setAccent('cyan');
  });

  describe('ThemeSelector', () => {
    it('keeps inactive theme labels above 4.5:1 in light theme', () => {
      usePokemonStore.getState().setTheme('light');
      renderWithProvider(<ThemeSelector />);
      openThemePanel();

      const selectedStyle = screen.getByRole('button', { name: 'Classic' });
      const inactiveStyle = screen.getByRole('button', { name: 'Digital Pokemon' });
      expect(selectedStyle).toHaveAttribute('aria-pressed', 'true');
      expect(inactiveStyle).toHaveAttribute('aria-pressed', 'false');
      expect(inactiveStyle.className).not.toBe(selectedStyle.className);
      expectContrast(inactiveStyle, 'light');

      const activeMode = screen.getByRole('button', { name: 'Light' });
      const inactiveMode = screen.getByRole('button', { name: 'Dark' });
      expect(activeMode).toHaveAttribute('aria-pressed', 'true');
      expect(inactiveMode).toHaveAttribute('aria-pressed', 'false');
      expect(inactiveMode.className).not.toBe(activeMode.className);
      expectContrast(inactiveMode, 'light');

      expectContrast(screen.getByText('Display Mode'), 'light');
      expectContrast(screen.getByText('Accent Color'), 'light');

      // Switching styles keeps the previously selected tab readable when inactive.
      fireEvent.click(inactiveStyle);
      const nowInactive = screen.getByRole('button', { name: 'Classic' });
      expect(nowInactive).toHaveAttribute('aria-pressed', 'false');
      expectContrast(nowInactive, 'light');
      expectContrast(screen.getByText(/Digital Pokemon mode activates/), 'light');
    });

    it('keeps inactive theme labels above 4.5:1 in dark theme', () => {
      renderWithProvider(<ThemeSelector />);
      openThemePanel();

      const inactiveMode = screen.getByRole('button', { name: 'Light' });
      expect(inactiveMode).toHaveAttribute('aria-pressed', 'false');
      expectContrast(inactiveMode, 'dark');

      const selectedStyle = screen.getByRole('button', { name: 'Classic' });
      const inactiveStyle = screen.getByRole('button', { name: 'Digital Pokemon' });
      expect(selectedStyle).toHaveAttribute('aria-pressed', 'true');
      expect(inactiveStyle).toHaveAttribute('aria-pressed', 'false');
      expectContrast(inactiveStyle, 'dark');

      expectContrast(screen.getByText('Display Mode'), 'dark');
      expectContrast(screen.getByText('Accent Color'), 'dark');
    });
  });

  describe('FilterControls', () => {
    const filterProps = {
      selectedGeneration: 'all',
      onGenerationChange: vi.fn(),
      selectedTypes: [],
      onTypeToggle: vi.fn(),
      flavorTextSearch: '',
      onFlavorTextChange: vi.fn(),
      onClearFilters: vi.fn(),
    };

    it('keeps muted filter labels above 4.5:1 in light theme', () => {
      usePokemonStore.getState().setTheme('light');
      renderWithProvider(<FilterControls {...filterProps} />);

      expectContrast(screen.getByText('No filters applied'), 'light');
      expectContrast(screen.getByText('Refine'), 'light');
      // Section descriptions ("All" for generation and types).
      screen.getAllByText('All').forEach((description) => expectContrast(description, 'light'));

      fireEvent.click(screen.getByText('Advanced (Stats & Abilities)'));
      expectContrast(screen.getByText('Ability'), 'light');
      expectContrast(screen.getByText('Minimum Stats'), 'light');
      expectContrast(screen.getByText('special attack'), 'light');
    });

    it('keeps muted filter labels above 4.5:1 in dark theme', () => {
      renderWithProvider(<FilterControls {...filterProps} />);

      expectContrast(screen.getByText('No filters applied'), 'dark');
      expectContrast(screen.getByText('Refine'), 'dark');
      screen.getAllByText('All').forEach((description) => expectContrast(description, 'dark'));

      fireEvent.click(screen.getByText('Advanced (Stats & Abilities)'));
      expectContrast(screen.getByText('Ability'), 'dark');
      expectContrast(screen.getByText('Minimum Stats'), 'dark');
      expectContrast(screen.getByText('special attack'), 'dark');
    });
  });

  describe('SortingControls', () => {
    const sortProps = {
      sortBy: 'id' as const,
      sortOrder: 'asc' as const,
      onSortChange: vi.fn(),
      onOrderChange: vi.fn(),
    };

    it('keeps inactive sort controls above 4.5:1 in light theme', () => {
      renderWithProvider(<SortingControls theme="light" {...sortProps} />);

      const selected = screen.getByRole('button', { name: /pokedex #/i });
      expect(selected).toHaveAttribute('aria-pressed', 'true');

      for (const name of [/name/i, /type/i, /favorites/i]) {
        const inactive = screen.getByRole('button', { name });
        expect(inactive).toHaveAttribute('aria-pressed', 'false');
        expect(inactive.className).not.toBe(selected.className);
        expectContrast(inactive, 'light');
      }

      expectContrast(screen.getByLabelText('Sort by Stat'), 'light');
      expectContrast(screen.getByDisplayValue('National Dex'), 'light');
    });

    it('keeps inactive sort controls above 4.5:1 in dark theme', () => {
      renderWithProvider(<SortingControls theme="dark" {...sortProps} />);

      const selected = screen.getByRole('button', { name: /pokedex #/i });
      expect(selected).toHaveAttribute('aria-pressed', 'true');

      for (const name of [/name/i, /type/i, /favorites/i]) {
        const inactive = screen.getByRole('button', { name });
        expect(inactive).toHaveAttribute('aria-pressed', 'false');
        expect(inactive.className).not.toBe(selected.className);
        expectContrast(inactive, 'dark');
      }

      expectContrast(screen.getByLabelText('Sort by Stat'), 'dark');
      expectContrast(screen.getByDisplayValue('National Dex'), 'dark');
    });
  });
});
