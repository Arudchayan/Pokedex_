import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamBuilder from '../../components/team/TeamBuilder';
import MobileTeamSheet from '../../components/team/MobileTeamSheet';
import type { PokemonListItem, TeamMember } from '../../types';

const bulbasaur: PokemonListItem = {
  id: 1,
  name: 'bulbasaur',
  imageUrl: 'bulbasaur.png',
  shinyImageUrl: '',
  types: ['grass', 'poison'],
  flavorText: '',
  stats: [],
  abilities: [],
};

const charmander: PokemonListItem = {
  id: 4,
  name: 'charmander',
  imageUrl: 'charmander.png',
  shinyImageUrl: '',
  types: ['fire'],
  flavorText: '',
  stats: [],
  abilities: [],
};

const squirtle: PokemonListItem = {
  id: 7,
  name: 'squirtle',
  imageUrl: 'squirtle.png',
  shinyImageUrl: '',
  types: ['water'],
  flavorText: '',
  stats: [],
  abilities: [],
};

const pickerPokemon = [bulbasaur, charmander, squirtle];

const teamBuilderProps = {
  onRemove: vi.fn(),
  onClear: vi.fn(),
  onSelect: vi.fn(),
  teamCapacity: 6,
  theme: 'light' as const,
  onUpdateTeamMember: vi.fn(),
  onLoadTeam: vi.fn(),
  onRandomize: vi.fn(),
  hasFilteredPokemon: true,
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: false,
  canRedo: false,
  onReorderTeam: vi.fn(),
};

const DesktopHarness = ({
  initialTeam = [],
  availablePokemon = pickerPokemon,
  availablePokemonLoading = false,
  availablePokemonError = null,
  onRetryAvailablePokemon,
}: {
  initialTeam?: TeamMember[];
  availablePokemon?: PokemonListItem[];
  availablePokemonLoading?: boolean;
  availablePokemonError?: string | null;
  onRetryAvailablePokemon?: () => void;
}) => {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);

  return (
    <TeamBuilder
      {...teamBuilderProps}
      team={team}
      availablePokemon={availablePokemon}
      availablePokemonLoading={availablePokemonLoading}
      availablePokemonError={availablePokemonError}
      onRetryAvailablePokemon={onRetryAvailablePokemon}
      onAddToTeam={(pokemon) => setTeam((current) => [...current, pokemon])}
    />
  );
};

const MobileHarness = ({ initialTeam = [] }: { initialTeam?: TeamMember[] }) => {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);

  return (
    <MobileTeamSheet
      team={team}
      onRemove={vi.fn()}
      onClear={vi.fn()}
      onSelect={vi.fn()}
      teamCapacity={6}
      theme="light"
      availablePokemon={pickerPokemon}
      onAddToTeam={(pokemon) => setTeam((current) => [...current, pokemon])}
    />
  );
};

const openDesktopPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  const panel = screen.getByLabelText('Team builder');
  await user.click(within(panel).getByRole('button', { name: /Add a Pokémon to slot 1 of 6/i }));
  const picker = await screen.findByRole('dialog', { name: /Add a Pokémon to slot 1/i });
  return { panel, picker };
};

describe('Team Builder empty-slot picker', () => {
  it('opens the picker from a desktop empty slot without closing the panel', async () => {
    const user = userEvent.setup({ delay: null });
    render(<DesktopHarness />);

    const { panel, picker } = await openDesktopPicker(user);

    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText('0/6')).toBeInTheDocument();
    expect(within(picker).getByRole('combobox', { name: 'Search Pokémon to add' })).toHaveFocus();
    expect(within(picker).getByRole('listbox', { name: 'Pokémon search results' })).toBeVisible();
  });

  it('filters by name and adds the selected Pokémon, keeping the panel open', async () => {
    const user = userEvent.setup({ delay: null });
    render(<DesktopHarness />);

    const { panel, picker } = await openDesktopPicker(user);
    await user.type(within(picker).getByRole('combobox'), 'char');

    expect(within(picker).getByRole('option', { name: /charmander/i })).toBeInTheDocument();
    expect(within(picker).queryByRole('option', { name: /bulbasaur/i })).not.toBeInTheDocument();

    await user.click(within(picker).getByRole('option', { name: /charmander/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /Add a Pokémon to slot/i })
      ).not.toBeInTheDocument()
    );
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText('1/6')).toBeInTheDocument();
    expect(within(panel).getByText('charmander')).toBeInTheDocument();
    expect(
      within(panel).getByRole('button', { name: /Add a Pokémon to slot 2 of 6/i })
    ).toHaveFocus();
  });

  it('closes only the picker on Escape and returns focus to the originating slot', async () => {
    const user = userEvent.setup({ delay: null });
    render(<DesktopHarness />);

    const { panel, picker } = await openDesktopPicker(user);
    expect(within(picker).getByRole('combobox')).toHaveFocus();

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /Add a Pokémon to slot/i })
      ).not.toBeInTheDocument()
    );
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText('0/6')).toBeInTheDocument();
    expect(
      within(panel).getByRole('button', { name: /Add a Pokémon to slot 1 of 6/i })
    ).toHaveFocus();
  });

  it('supports ArrowUp/ArrowDown navigation and Enter selection', async () => {
    const user = userEvent.setup({ delay: null });
    render(<DesktopHarness />);

    const { panel, picker } = await openDesktopPicker(user);
    const options = within(picker).getAllByRole('option');

    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}');
    expect(within(picker).getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}');
    expect(within(picker).getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /Add a Pokémon to slot/i })
      ).not.toBeInTheDocument()
    );
    expect(within(panel).getByText('1/6')).toBeInTheDocument();
    expect(within(panel).getByText('squirtle')).toBeInTheDocument();
  });

  it('shows an explicit error with Retry when the dataset failed to load', async () => {
    const user = userEvent.setup({ delay: null });
    const onRetry = vi.fn();
    render(
      <DesktopHarness
        availablePokemon={[]}
        availablePokemonError="Failed to fetch Pokemon data."
        onRetryAvailablePokemon={onRetry}
      />
    );

    const { panel, picker } = await openDesktopPicker(user);

    const alert = within(picker).getByRole('alert');
    expect(alert).toHaveTextContent('Pokémon data could not be loaded.');
    expect(alert).toHaveTextContent('Failed to fetch Pokemon data.');

    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(panel).toBeInTheDocument();
    expect(picker).toBeInTheDocument();
  });

  it('explains an empty dataset instead of rendering a blank list', async () => {
    const user = userEvent.setup({ delay: null });
    render(<DesktopHarness availablePokemon={[]} />);

    const { picker } = await openDesktopPicker(user);

    expect(within(picker).getByRole('alert')).toHaveTextContent('No Pokémon data available.');
    expect(
      within(picker).getByText('The Pokédex list is empty, so there is nothing to add right now.')
    ).toBeInTheDocument();
  });

  it('opens the picker from the mobile sheet and keeps the sheet open after selecting', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MobileHarness />);

    await user.click(screen.getByRole('button', { name: /Team: 0\/6/i }));
    const sheet = screen.getByRole('dialog', { name: 'Team Builder' });

    await user.click(within(sheet).getByRole('button', { name: /Add a Pokémon to slot 1 of 6/i }));

    const picker = await screen.findByRole('dialog', { name: /Add a Pokémon to slot 1/i });
    expect(sheet).toBeInTheDocument();
    expect(within(picker).getByRole('combobox')).toHaveFocus();

    await user.type(within(picker).getByRole('combobox'), 'squir');
    await user.click(within(picker).getByRole('option', { name: /squirtle/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /Add a Pokémon to slot/i })
      ).not.toBeInTheDocument()
    );
    expect(sheet).toBeInTheDocument();
    expect(within(sheet).getByText('1/6 slots filled')).toBeInTheDocument();
    expect(
      within(sheet).getByRole('button', { name: /Add a Pokémon to slot 2 of 6/i })
    ).toHaveFocus();
  });

  it('closes only the mobile picker on Escape and returns focus to the slot', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MobileHarness />);

    await user.click(screen.getByRole('button', { name: /Team: 0\/6/i }));
    const sheet = screen.getByRole('dialog', { name: 'Team Builder' });
    await user.click(within(sheet).getByRole('button', { name: /Add a Pokémon to slot 1 of 6/i }));
    await screen.findByRole('dialog', { name: /Add a Pokémon to slot 1/i });

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /Add a Pokémon to slot/i })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByRole('dialog', { name: 'Team Builder' })).toBeInTheDocument();
    expect(
      within(sheet).getByRole('button', { name: /Add a Pokémon to slot 1 of 6/i })
    ).toHaveFocus();
  });
});
