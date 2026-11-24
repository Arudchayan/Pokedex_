import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StatCalculator from '../../components/calculators/StatCalculator';
import DamageCalculator from '../../components/calculators/DamageCalculator';
import CatchCalculator from '../../components/calculators/CatchCalculator';
import BreedingCalculator from '../../components/calculators/BreedingCalculator';
import ShinyOddsCalculator from '../../components/calculators/ShinyOddsCalculator';
import { fetchPokemonDetails, fetchPokemonMoves } from '../../services/pokeapiService';
import { detailsById, masterPokemonList, tackleMove } from '../helpers/calculatorFixtures';
import {
  backgroundColorHex,
  contrastRatio,
  disabledContrast,
  elementContrast,
  focusRingContrast,
  placeholderContrast,
  textColorHex,
  type ContrastTheme,
} from '../contrast';

const context = vi.hoisted(() => ({
  current: {
    masterPokemonList: [] as unknown[],
    theme: 'dark' as 'dark' | 'light',
    loading: false,
    error: null as string | null,
    reload: vi.fn(),
  },
}));

vi.mock('../../context/PokemonContext', () => ({
  usePokemon: () => context.current,
}));

vi.mock('../../services/pokeapiService', () => ({
  fetchPokemonDetails: vi.fn(),
  fetchPokemonMoves: vi.fn(),
}));

const THEMES: ContrastTheme[] = ['light', 'dark'];
const MIN_TEXT_CONTRAST = 4.5;
const MIN_INDICATOR_CONTRAST = 3;

const renderCalculator = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

function expectReadableField(
  element: HTMLElement,
  theme: ContrastTheme,
  label: string,
  options: { placeholder?: boolean } = {}
) {
  expect(element, `${label} should render`).toBeInTheDocument();
  expect(element).toHaveClass(theme === 'dark' ? 'text-slate-100' : 'text-slate-900');

  const text = elementContrast(element, theme);
  expect(
    text.ratio,
    `${label} text: ${text.foreground} on ${text.background} (${theme})`
  ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);

  if (options.placeholder) {
    const placeholder = placeholderContrast(element, theme);
    expect(
      placeholder.ratio,
      `${label} placeholder: ${placeholder.foreground} on ${placeholder.background} (${theme})`
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(element).toHaveClass(
      theme === 'dark' ? 'placeholder:text-slate-400' : 'placeholder:text-slate-600'
    );
  }

  const disabled = disabledContrast(element, theme);
  expect(
    disabled.ratio,
    `${label} disabled text: ${disabled.foreground} on ${disabled.background} (${theme})`
  ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  expect(element).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-70');

  const ring = focusRingContrast(element, theme);
  expect(
    ring.ratio,
    `${label} focus ring: ${ring.foreground} on ${ring.background} (${theme})`
  ).toBeGreaterThanOrEqual(MIN_INDICATOR_CONTRAST);
  expect(element).toHaveClass('focus:ring-2', 'focus:ring-offset-2');
}

function expectReadableOption(option: HTMLElement, theme: ContrastTheme, label: string) {
  expect(option).toHaveClass(theme === 'dark' ? 'text-slate-100' : 'text-slate-900');
  expect(option).toHaveClass(theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100');
  const { ratio, foreground, background } = elementContrast(option, theme);
  expect(
    ratio,
    `${label} option: ${foreground} on ${background} (${theme})`
  ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
}

/** No-match copy sits on the same surface as its search field. */
function expectReadableStatus(status: HTMLElement, field: HTMLElement, theme: ContrastTheme) {
  const ratio = contrastRatio(textColorHex(status), backgroundColorHex(field, theme));
  expect(ratio, `No-match text (${theme})`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
}

describe('calculator input contrast', () => {
  beforeEach(() => {
    context.current = {
      masterPokemonList,
      theme: 'dark',
      loading: false,
      error: null,
      reload: vi.fn(),
    };
    vi.mocked(fetchPokemonDetails).mockImplementation(
      async (id: number) => detailsById[id] ?? null
    );
    vi.mocked(fetchPokemonMoves).mockResolvedValue([tackleMove]);
  });

  describe.each(THEMES)('%s theme', (theme) => {
    beforeEach(() => {
      context.current = { ...context.current, theme };
    });

    it('keeps the Stat Calculator search, level, nature and IV/EV fields readable', async () => {
      renderCalculator(<StatCalculator onClose={vi.fn()} />);

      const search = screen.getByRole('combobox', { name: 'Select Pokemon' });
      expectReadableField(search, theme, 'Stat search', { placeholder: true });

      fireEvent.change(search, { target: { value: 'zzzz' } });
      const noMatches = within(search.parentElement as HTMLElement).getByRole('status');
      expectReadableStatus(noMatches, search, theme);

      fireEvent.change(search, { target: { value: 'pika' } });
      fireEvent.click(await screen.findByRole('option', { name: /pikachu/i }));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Calculate Stats' })).toBeEnabled()
      );

      expectReadableField(screen.getByLabelText('Level value'), theme, 'Stat level');
      expectReadableField(screen.getByRole('combobox'), theme, 'Stat nature');
      expectReadableField(screen.getByLabelText('attack IV'), theme, 'Stat attack IV');
      expectReadableField(screen.getByLabelText('attack EV'), theme, 'Stat attack EV');

      fireEvent.change(screen.getByLabelText('Level value'), { target: { value: '150' } });
      expect(screen.getByLabelText('Level value')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent(/level must be between 1 and 100/i);
    });

    it('keeps a disabled calculator search readable while the dataset is unavailable', () => {
      context.current = { ...context.current, masterPokemonList: [] };
      renderCalculator(<StatCalculator onClose={vi.fn()} />);

      const search = screen.getByRole('combobox', { name: 'Select Pokemon' });
      expect(search).toBeDisabled();
      expectReadableField(search, theme, 'Disabled calculator search', { placeholder: true });
    });

    it('keeps the Catch Calculator search and ball select readable', async () => {
      renderCalculator(<CatchCalculator onClose={vi.fn()} />);

      const search = screen.getByRole('combobox', { name: 'Select Pokemon' });
      expectReadableField(search, theme, 'Catch search', { placeholder: true });

      fireEvent.change(search, { target: { value: 'pika' } });
      fireEvent.click(await screen.findByRole('option', { name: /pikachu/i }));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Calculate Catch Rate' })).toBeEnabled()
      );

      expectReadableField(screen.getByLabelText('Poke Ball'), theme, 'Catch ball');
    });

    it('keeps both Breeding Calculator parent searches readable', async () => {
      renderCalculator(<BreedingCalculator onClose={vi.fn()} />);

      const parentA = screen.getByRole('combobox', { name: 'Parent A' });
      expectReadableField(parentA, theme, 'Breeding Parent A', { placeholder: true });

      fireEvent.change(parentA, { target: { value: 'bulba' } });
      fireEvent.click(await screen.findByRole('option', { name: /bulbasaur/i }));

      const parentB = await screen.findByRole('combobox', { name: 'Parent B' });
      expectReadableField(parentB, theme, 'Breeding Parent B', { placeholder: true });
    });

    it('keeps the Damage Calculator searches, levels, selects and stat inputs readable', async () => {
      renderCalculator(<DamageCalculator onClose={vi.fn()} />);

      const attacker = screen.getByRole('combobox', { name: 'Attacker' });
      expectReadableField(attacker, theme, 'Damage attacker search', { placeholder: true });

      fireEvent.change(attacker, { target: { value: 'zzzz' } });
      const noMatches = within(attacker.parentElement as HTMLElement).getByRole('status');
      expectReadableStatus(noMatches, attacker, theme);

      fireEvent.change(attacker, { target: { value: 'bulba' } });
      fireEvent.click(await screen.findByRole('option', { name: /bulbasaur/i }));

      const defender = await screen.findByRole('combobox', { name: 'Defender' });
      expectReadableField(defender, theme, 'Damage defender search', { placeholder: true });

      fireEvent.change(defender, { target: { value: 'char' } });
      fireEvent.click(await screen.findByRole('option', { name: /charmander/i }));
      await waitFor(() => expect(screen.getByLabelText('Select Move')).toBeInTheDocument());

      for (const level of screen.getAllByLabelText('Level')) {
        expectReadableField(level, theme, 'Damage level');
      }

      const dialog = screen.getByRole('dialog', { name: 'Damage Calculator' });
      for (const select of Array.from(dialog.querySelectorAll('select'))) {
        expectReadableField(select, theme, 'Damage select');
      }

      fireEvent.click(screen.getAllByRole('button', { name: 'Edit Stats' })[0]);
      const numberInputs = Array.from(dialog.querySelectorAll('input[type="number"]'));
      expect(numberInputs.length).toBeGreaterThan(2);
      for (const input of numberInputs) {
        expectReadableField(input as HTMLElement, theme, 'Damage number input');
      }
    });

    it('keeps the Shiny Odds Calculator generation select readable', () => {
      renderCalculator(<ShinyOddsCalculator onClose={vi.fn()} />);
      expectReadableField(screen.getByRole('combobox'), theme, 'Shiny generation');
    });
  });

  it('keeps autocomplete highlighted options readable in both themes', async () => {
    for (const theme of THEMES) {
      context.current = { ...context.current, theme };
      const { unmount } = renderCalculator(<StatCalculator onClose={vi.fn()} />);

      const search = screen.getByRole('combobox', { name: 'Select Pokemon' });
      fireEvent.change(search, { target: { value: 'pika' } });

      const option = await screen.findByRole('option', { name: /pikachu/i });
      fireEvent.mouseEnter(option);
      expect(option).toHaveAttribute('aria-selected', 'true');
      expectReadableOption(option, theme, 'Highlighted autocomplete');

      unmount();
    }
  });
});
