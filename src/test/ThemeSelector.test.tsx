import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemeSelector from '../components/layout/ThemeSelector';
import { renderWithProvider } from './utils';
import { ACCENT_COLORS } from '../constants';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sound service
vi.mock('../services/soundService', () => ({
  playUISound: vi.fn(),
  toggleAudio: vi.fn(),
  isAudioEnabled: vi.fn(() => true),
}));

// Mock document.documentElement methods
// We can't easily mock classList on document.documentElement in JSDOM the same way,
// but we can check if the class is present on the actual element.

describe('ThemeSelector', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.className = '';
    document.documentElement.style.cssText = '';
  });

  it('renders correctly', () => {
    renderWithProvider(<ThemeSelector />);
    const button = screen.getByTitle('Customize Theme');
    expect(button).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    renderWithProvider(<ThemeSelector />);
    const button = screen.getByTitle('Customize Theme');

    fireEvent.click(button);

    expect(screen.getByText('Display Mode')).toBeInTheDocument();
    expect(screen.getByText('Accent Color')).toBeInTheDocument();
  });

  it('toggles theme between light and dark', async () => {
    renderWithProvider(<ThemeSelector />);
    const button = screen.getByTitle('Customize Theme');
    fireEvent.click(button);

    const lightBtn = screen.getByRole('button', { name: /light/i });
    const darkBtn = screen.getByRole('button', { name: /dark/i });

    // Initial state is dark (from Context default)
    // Click light
    fireEvent.click(lightBtn);

    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    // Click dark
    fireEvent.click(darkBtn);
    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('changes accent color', async () => {
    renderWithProvider(<ThemeSelector />);
    const button = screen.getByTitle('Customize Theme');
    fireEvent.click(button);

    // First click on Classic tab to see classic colors like Rose
    const classicTab = screen.getByRole('button', { name: /classic/i });
    fireEvent.click(classicTab);

    // Find accent buttons. They have title same as color name capitalized.
    // Let's pick 'Rose'
    const roseBtn = screen.getByTitle('Rose');
    fireEvent.click(roseBtn);

    await waitFor(() => {
      expect(localStorage.getItem('accent')).toBe('rose');
      const roseColors = ACCENT_COLORS['rose'];
      expect(document.documentElement.style.getPropertyValue('--color-primary-500')).toBe(
        roseColors[500]
      );
    });
  });

  it('closes when clicking outside', async () => {
    renderWithProvider(
      <div>
        <div data-testid="outside">Outside</div>
        <ThemeSelector />
      </div>
    );
    const button = screen.getByTitle('Customize Theme');
    fireEvent.click(button);

    expect(screen.getByText('Display Mode')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));

    // Expect dropdown to disappear
    await waitFor(() => {
      expect(screen.queryByText('Display Mode')).not.toBeInTheDocument();
    });
  });
});
