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
const getMethodGroup = () => screen.getByRole('group', { name: /hunting method/i });
const getSparklingGroup = () => screen.getByRole('group', { name: 'Sparkling Power' });
const getSparklingButton = (name: 'Off' | 'Lv. 1' | 'Lv. 2' | 'Lv. 3') =>
  within(getSparklingGroup()).getByRole('button', { name });

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
    const selected = within(getMethodGroup())
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-pressed') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAccessibleName('Breeding (Shiny Parent)');
  });

  it('updates odds when method changes', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    // Select Masuda Method
    fireEvent.click(screen.getByRole('button', { name: 'Masuda Method' }));

    // Gen 9 Masuda -> 1/683
    expect(screen.getByText('1 in 683')).toBeInTheDocument();
  });

  it('exposes exactly one selected hunting method within a named group', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    const methodButtons = ['Random Encounters', 'Masuda Method', 'Mass Outbreak (60+ KOs)'].map(
      (name) => within(getMethodGroup()).getByRole('button', { name })
    );

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

    fireEvent.click(
      within(getMethodGroup()).getByRole('button', { name: 'Mass Outbreak (60+ KOs)' })
    );

    expect(
      within(getMethodGroup()).getByRole('button', { name: 'Mass Outbreak (60+ KOs)' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(getMethodGroup()).getByRole('button', { name: 'Random Encounters' })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      within(getMethodGroup())
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
    fireEvent.click(getCharmCheckbox());

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

  it('offers Sparkling Power once, with a single method-option removal', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    // No hunting method duplicates the Sparkling Power effect.
    expect(within(getMethodGroup()).queryByRole('button', { name: /sparkling power/i })).toBeNull();
    expect(within(getMethodGroup()).queryByText(/sparkling power/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^sparkling power$/i)).toHaveLength(1);

    // The one remaining control is a labelled group with four explicit levels.
    const sparklingGroup = getSparklingGroup();
    expect(sparklingGroup).toHaveAccessibleDescription(/adds one shiny roll per level/i);
    expect(within(sparklingGroup).getAllByRole('button')).toHaveLength(4);
  });

  it('updates the odds for each Sparkling Power level and applies it once', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    const expectedLevels = [
      { level: 'Lv. 1', odds: '1 in 2048' },
      { level: 'Lv. 2', odds: '1 in 1365' },
      { level: 'Lv. 3', odds: '1 in 1024' },
      { level: 'Off', odds: '1 in 4096' },
    ] as const;

    for (const { level, odds } of expectedLevels) {
      fireEvent.click(getSparklingButton(level));

      expect(getSparklingButton(level)).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(odds)).toBeInTheDocument();
      expect(
        within(getSparklingGroup())
          .getAllByRole('button')
          .filter((button) => button.getAttribute('aria-pressed') === 'true')
      ).toHaveLength(1);
    }

    // Re-selecting the active level is idempotent: it never stacks or toggles off.
    fireEvent.click(getSparklingButton('Lv. 3'));
    expect(screen.getByText('1 in 1024')).toBeInTheDocument();
    fireEvent.click(getSparklingButton('Lv. 3'));
    expect(getSparklingButton('Lv. 3')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 in 1024')).toBeInTheDocument();
  });

  it('stacks Sparkling Power with Shiny Charm and Mass Outbreaks exactly once', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    // Random Encounters: 1 base + 3 Sparkling = 4 rolls.
    fireEvent.click(getSparklingButton('Lv. 3'));
    expect(screen.getByText('1 in 1024')).toBeInTheDocument();

    // + 2 Charm rolls = 6 rolls.
    fireEvent.click(getCharmCheckbox());
    expect(screen.getByText('1 in 683')).toBeInTheDocument();

    // Mass Outbreak already supplies 3 rolls: 3 + 2 Charm + 3 Sparkling = 8.
    fireEvent.click(screen.getByRole('button', { name: 'Mass Outbreak (60+ KOs)' }));
    expect(screen.getByText('1 in 512')).toBeInTheDocument();

    // Dropping back to Lv. 2 removes exactly one roll: 7 rolls -> 1/585.
    fireEvent.click(getSparklingButton('Lv. 2'));
    expect(screen.getByText('1 in 585')).toBeInTheDocument();
  });

  it('disables Sparkling Power for Masuda eggs, explains why, and does not restore it', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    fireEvent.click(getSparklingButton('Lv. 3'));
    expect(screen.getByText('1 in 1024')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Masuda Method' }));

    // The bonus is not silently ignored: it is cleared and the control is disabled.
    expect(screen.getByText('1 in 683')).toBeInTheDocument();
    expect(getSparklingGroup()).toHaveAccessibleDescription(/eggs are not wild encounters/i);
    for (const button of within(getSparklingGroup()).getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
    expect(getSparklingButton('Off')).toHaveAttribute('aria-pressed', 'true');
    expect(getSparklingButton('Lv. 3')).toHaveAttribute('aria-pressed', 'false');

    // Returning to a wild-encounter method does not resurrect the stale level.
    fireEvent.click(screen.getByRole('button', { name: 'Random Encounters' }));
    expect(screen.getByText('1 in 4096')).toBeInTheDocument();
    expect(getSparklingButton('Off')).toHaveAttribute('aria-pressed', 'true');
  });

  it('selects Sparkling Power levels from the keyboard', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    await waitFor(() => expect(screen.getByLabelText('Close')).toHaveFocus());

    const lv3Button = getSparklingButton('Lv. 3');
    for (let i = 0; i < 20 && document.activeElement !== lv3Button; i += 1) {
      await user.tab();
    }
    expect(lv3Button).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(lv3Button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 in 1024')).toBeInTheDocument();

    const lv1Button = getSparklingButton('Lv. 1');
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    expect(lv1Button).toHaveFocus();
    await user.keyboard(' ');
    expect(lv1Button).toHaveAttribute('aria-pressed', 'true');
    expect(lv3Button).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('1 in 2048')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    renderWithProvider(<ShinyOddsCalculator onClose={handleClose} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });
});
