import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      <PokemonProvider>{ui}</PokemonProvider>
    </QueryClientProvider>
  );
};

// Mock ScrollIntoView since it's not supported in JSDOM
window.HTMLElement.prototype.scrollIntoView = function () {};

const selectGeneration = (gen: string) => {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: gen } });
};

const getCharmCheckbox = () => screen.getByRole('checkbox', { name: 'Shiny Charm' });

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

    // Generation changes reset the method, keeping exactly one selected.
    const methodGroup = screen.getByRole('group', { name: /hunting method/i });
    const selected = within(methodGroup)
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-pressed') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAccessibleName('Breeding (Shiny Parent)');
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

  it('exposes exactly one selected hunting method within a named group', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    const methodGroup = screen.getByRole('group', { name: /hunting method/i });
    const methodButtons = [
      'Random Encounters',
      'Masuda Method',
      'Mass Outbreak (60+ KOs)',
      'Sparkling Power Lv. 3',
    ].map((name) => within(methodGroup).getByRole('button', { name }));

    methodButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed');
    });

    const selected = methodButtons.filter(
      (button) => button.getAttribute('aria-pressed') === 'true'
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAccessibleName('Random Encounters');
  });

  it('moves the selected state and updates odds when another method is clicked', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    const methodGroup = screen.getByRole('group', { name: /hunting method/i });
    fireEvent.click(within(methodGroup).getByRole('button', { name: 'Mass Outbreak (60+ KOs)' }));

    expect(
      within(methodGroup).getByRole('button', { name: 'Mass Outbreak (60+ KOs)' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(within(methodGroup).getByRole('button', { name: 'Random Encounters' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(
      within(methodGroup)
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-pressed') === 'true')
    ).toHaveLength(1);
    expect(screen.getByText('1 in 1365')).toBeInTheDocument();
  });

  it('supports keyboard activation of hunting methods', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    // Wait for the modal's own initial focus before navigating with the keyboard.
    await waitFor(() => expect(screen.getByLabelText('Close')).toHaveFocus());

    const masudaButton = screen.getByRole('button', { name: 'Masuda Method' });
    for (let i = 0; i < 10 && document.activeElement !== masudaButton; i += 1) {
      await user.tab();
    }
    expect(masudaButton).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(masudaButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Random Encounters' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByText('1 in 683')).toBeInTheDocument();

    // Activate the next method with Space.
    const outbreakButton = screen.getByRole('button', { name: 'Mass Outbreak (60+ KOs)' });
    await user.tab();
    expect(outbreakButton).toHaveFocus();
    await user.keyboard(' ');

    expect(outbreakButton).toHaveAttribute('aria-pressed', 'true');
    expect(masudaButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('1 in 1365')).toBeInTheDocument();
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

  it('disables Shiny Charm with an explanation in Gen 3 and keeps base odds', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    selectGeneration('gen3');

    const charmCheckbox = getCharmCheckbox();
    expect(charmCheckbox).toBeDisabled();
    expect(charmCheckbox).toHaveAttribute('aria-disabled', 'true');
    expect(charmCheckbox).not.toBeChecked();
    expect(charmCheckbox).toHaveAccessibleDescription(/not available in this generation/i);
    expect(screen.getByText(/introduced in generation 5/i)).toBeInTheDocument();

    // 1/8192 base; an unavailable Charm must not be toggleable.
    expect(screen.getByText('1 in 8192')).toBeInTheDocument();
    fireEvent.click(charmCheckbox);
    expect(charmCheckbox).not.toBeChecked();
    expect(screen.getByText('1 in 8192')).toBeInTheDocument();
  });

  it('disables Shiny Charm for every Gen 4 method and leaves odds unchanged', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    selectGeneration('gen4');

    const charmCheckbox = getCharmCheckbox();
    expect(charmCheckbox).toBeDisabled();
    expect(screen.getByText('1 in 8192')).toBeInTheDocument();

    fireEvent.click(charmCheckbox);
    expect(charmCheckbox).not.toBeChecked();
    expect(screen.getByText('1 in 8192')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Masuda Method' }));
    expect(screen.getByText('1 in 1638')).toBeInTheDocument();

    fireEvent.click(charmCheckbox);
    expect(charmCheckbox).not.toBeChecked();
    expect(screen.getByText('1 in 1638')).toBeInTheDocument();
  });

  it('offers an interactive Shiny Charm from Gen 5 onwards and applies its bonus', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    selectGeneration('gen5');

    const charmCheckbox = getCharmCheckbox();
    expect(charmCheckbox).toBeEnabled();
    expect(charmCheckbox).toHaveAttribute('aria-disabled', 'false');
    expect(charmCheckbox).not.toBeChecked();
    expect(charmCheckbox).not.toHaveAccessibleDescription(/not available in this generation/i);
    expect(screen.getByText('1 in 8192')).toBeInTheDocument();

    fireEvent.click(charmCheckbox);
    expect(charmCheckbox).toBeChecked();
    expect(screen.getByText('1 in 2730')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Masuda Method' }));
    expect(screen.getByText('1 in 1024')).toBeInTheDocument();

    fireEvent.click(charmCheckbox);
    expect(charmCheckbox).not.toBeChecked();
    expect(screen.getByText('1 in 1365')).toBeInTheDocument();
  });

  it('resets a stale Shiny Charm on unsupported generations and does not silently re-apply it', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    // Gen 9 default: enable Charm, 1/4096 -> 1/1365.
    const charmCheckbox = getCharmCheckbox();
    fireEvent.click(charmCheckbox);
    expect(charmCheckbox).toBeChecked();
    expect(screen.getByText('1 in 1365')).toBeInTheDocument();

    // Switching to Gen 4 drops the Charm and recalculates without it.
    selectGeneration('gen4');
    expect(charmCheckbox).toBeDisabled();
    expect(charmCheckbox).not.toBeChecked();
    expect(screen.getByText('1 in 8192')).toBeInTheDocument();

    // Switching back does not silently restore the stale selection.
    selectGeneration('gen9');
    expect(charmCheckbox).toBeEnabled();
    expect(charmCheckbox).not.toBeChecked();
    expect(screen.getByText('1 in 4096')).toBeInTheDocument();

    // Only an explicit toggle re-applies the bonus.
    fireEvent.click(charmCheckbox);
    expect(charmCheckbox).toBeChecked();
    expect(screen.getByText('1 in 1365')).toBeInTheDocument();
  });

  it('exposes the unavailable Shiny Charm state to assistive technology and keyboard users', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    selectGeneration('gen4');

    const charmCheckbox = getCharmCheckbox();
    expect(charmCheckbox).toHaveAttribute('aria-disabled', 'true');
    expect(charmCheckbox).toHaveAccessibleDescription(
      /not available in this generation.*generation 5/i
    );

    // Disabled controls stay out of the tab order.
    await waitFor(() => expect(screen.getByLabelText('Close')).toHaveFocus());
    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(document.activeElement).not.toBe(charmCheckbox);
    }
    expect(charmCheckbox).not.toHaveFocus();
  });

  it('toggles the available Shiny Charm from the keyboard', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    selectGeneration('gen5');

    const charmCheckbox = getCharmCheckbox();
    await waitFor(() => expect(screen.getByLabelText('Close')).toHaveFocus());
    for (let i = 0; i < 8 && document.activeElement !== charmCheckbox; i += 1) {
      await user.tab();
    }
    expect(charmCheckbox).toHaveFocus();

    await user.keyboard(' ');
    expect(charmCheckbox).toBeChecked();
    expect(screen.getByText('1 in 2730')).toBeInTheDocument();
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
