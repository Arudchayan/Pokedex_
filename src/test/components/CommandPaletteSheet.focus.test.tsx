import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandPalette from '../../components/layout/CommandPalette';
import MobileTeamSheet from '../../components/team/MobileTeamSheet';
import type { AppController } from '../../app/useAppController';
import type { TeamMember } from '../../types';

vi.mock('../../store/useModalStore', () => ({
  useModalStore: () => ({
    openMoveDex: vi.fn(),
    openAbilityDex: vi.fn(),
    openItemDex: vi.fn(),
    openDamageCalc: vi.fn(),
    openCatchCalc: vi.fn(),
    openBreedingCalc: vi.fn(),
    openStatCalc: vi.fn(),
    openShinyCalc: vi.fn(),
    openTypeChart: vi.fn(),
    openNatureChart: vi.fn(),
    openGameHub: vi.fn(),
    openAchievements: vi.fn(),
    openWalkersSettings: vi.fn(),
    openDataManagement: vi.fn(),
  }),
}));

vi.mock('../../store/usePokemonStore', () => {
  const mockState = {
    masterPokemonList: [],
    toggleTheme: vi.fn(),
  };

  const usePokemonStore = (selector: (state: typeof mockState) => unknown) => selector(mockState);
  usePokemonStore.getState = () => mockState;

  return { usePokemonStore };
});

const controller = {
  theme: 'light',
  isCyberpunk: false,
  handleRandomPokemon: vi.fn(),
  handleFocusSearch: vi.fn(),
  handleToggleShiny: vi.fn(),
  handleSelectPokemon: vi.fn(),
} as unknown as AppController;

const team: TeamMember[] = [
  {
    id: 1,
    name: 'bulbasaur',
    imageUrl: 'img1.png',
    shinyImageUrl: '',
    types: ['grass', 'poison'],
    flavorText: '',
    stats: [],
    abilities: [],
  },
];

function SheetPaletteHarness() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <MobileTeamSheet
        team={team}
        onRemove={vi.fn()}
        onClear={vi.fn()}
        onSelect={vi.fn()}
        teamCapacity={6}
        theme="light"
      />
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        controller={controller}
      />
    </>
  );
}

describe('Command palette over the Team Builder sheet', () => {
  it('takes focus on Ctrl+K and returns it to the sheet on Escape', async () => {
    const user = userEvent.setup({ delay: null });
    render(<SheetPaletteHarness />);

    await user.click(screen.getByRole('button', { name: /Team: 1\/6/i }));

    const sheet = screen.getByRole('dialog', { name: 'Team Builder' });
    const sheetHeading = within(sheet).getByRole('heading', { name: 'Team Builder' });
    await waitFor(() => expect(sheetHeading).toHaveFocus());

    await user.keyboard('{Control>}k{/Control}');

    const palette = screen.getByRole('dialog', { name: 'Command palette' });
    const paletteInput = within(palette).getByPlaceholderText('Type a command or search...');
    await waitFor(() => expect(paletteInput).toHaveFocus());

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument()
    );
    expect(screen.getByRole('dialog', { name: 'Team Builder' })).toBeInTheDocument();
    expect(sheetHeading).toHaveFocus();
  });
});
