import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeSelector from './ThemeSelector';
import { renderWithProvider } from '../../test/utils';

// Mock sound service
vi.mock('../services/soundService', () => ({
  playUISound: vi.fn(),
  toggleAudio: vi.fn(),
  isAudioEnabled: vi.fn(),
}));

describe('ThemeSelector', () => {
  it('renders without crashing', () => {
    renderWithProvider(<ThemeSelector />);
    // The button title is "Customize Theme"
    const button = screen.getByTitle('Customize Theme');
    expect(button).toBeInTheDocument();
  });

  it('toggles menu when clicked', () => {
    renderWithProvider(<ThemeSelector />);
    const button = screen.getByTitle('Customize Theme');

    // Initially menu is not visible
    // We check for some text that would appear in the menu, e.g., "Display Mode" or "Accent Color"
    expect(screen.queryByText('Display Mode')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(button);
    expect(screen.getByText('Display Mode')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    renderWithProvider(<ThemeSelector />);
    const button = screen.getByTitle('Customize Theme');

    // These should fail before the fix
    expect(button).toHaveAttribute('aria-label', 'Customize theme settings');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
