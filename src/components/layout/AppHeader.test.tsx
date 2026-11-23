import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProvider } from '../../test/utils';
import AppHeader from './AppHeader';

// Mock ThemeSelector to avoid context issues
vi.mock('./ThemeSelector', () => ({
  default: () => <div data-testid="mock-theme-selector" />,
}));

describe('AppHeader', () => {
  it('renders the Random Pokemon button with correct accessibility attributes', () => {
    renderWithProvider(<AppHeader onRandomPokemon={vi.fn()} />);

    // Now we can find it by its accessible name
    const randomButton = screen.getByRole('button', { name: 'Random Pokemon' });
    expect(randomButton).toBeInTheDocument();
    expect(randomButton).toHaveAttribute('title', 'Random Pokemon (Shift + R)');
  });
});
