import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ShinyOddsCalculator from '../../components/calculators/ShinyOddsCalculator';
import { PokemonProvider } from '../../context/PokemonContext';

// Mock the PokemonProvider
const renderWithProvider = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PokemonProvider>
        {ui}
      </PokemonProvider>
    </QueryClientProvider>
  );
};

// Mock ScrollIntoView since it's not supported in JSDOM
window.HTMLElement.prototype.scrollIntoView = function() {};

describe('ShinyOddsCalculator', () => {
  it('renders correctly', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    expect(screen.getByText('Shiny Odds Calculator')).toBeInTheDocument();
    expect(screen.getByText('Game Generation')).toBeInTheDocument();
    expect(screen.getByText('Hunting Method')).toBeInTheDocument();
  });

  it('updates odds when generation changes', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    // Default is Gen 9, Random Encounters -> 1/4096
    expect(screen.getByText('1 in 4096')).toBeInTheDocument();

    // Change to Gen 2
    const genSelect = screen.getByRole('combobox');
    fireEvent.change(genSelect, { target: { value: 'gen2' } });

    // Gen 2 Breeding -> 1/64
    expect(screen.getByText('1 in 64')).toBeInTheDocument();
  });

  it('updates odds when method changes', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    // Select Masuda Method
    const masudaButton = screen.getByText('Masuda Method');
    fireEvent.click(masudaButton);

    // Gen 9 Masuda -> 1/683
    expect(screen.getByText('1 in 683')).toBeInTheDocument();
  });

  it('updates odds when Shiny Charm is toggled', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    // Ensure Random Encounters is selected (Gen 9 default)
    // 1/4096 base
    expect(screen.getByText('1 in 4096')).toBeInTheDocument();

    // Toggle Shiny Charm
    const charmCheckbox = screen.getByRole('checkbox', { name: /Shiny Charm/i });
    fireEvent.click(charmCheckbox);

    // 1/4096 -> 1/1365 with Charm
    expect(screen.getByText('1 in 1365')).toBeInTheDocument();
  });

  it('updates odds when Sandwich is toggled (Gen 9 only)', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    // Gen 9 Random Encounters
    expect(screen.getByText('1 in 4096')).toBeInTheDocument();

    // Toggle Sandwich (Sparkling Power Lv. 3)
    const sandwichCheckbox = screen.getByRole('checkbox', { name: /Sandwich Power Lv. 3/i });
    fireEvent.click(sandwichCheckbox);

    expect(screen.getByText('1 in 1024')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });
});
