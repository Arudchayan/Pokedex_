import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider, setPokeapiServiceMock } from '../utils';
import TeamBuilder from '../../components/team/TeamBuilder';
import MobileTeamSheet from '../../components/team/MobileTeamSheet';
import { usePokemon } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import { decompressTeam } from '../../utils/urlCompression';
import type { PokemonListItem } from '../../types';

const noop = () => {};
const SAVED_ID = 672;

const TeamBuilderHarness = () => {
  const { teamPokemon, theme } = usePokemon();

  return (
    <TeamBuilder
      team={teamPokemon}
      onRemove={noop}
      onClear={noop}
      onSelect={noop}
      teamCapacity={6}
      theme={theme}
      onUpdateTeamMember={noop}
      onLoadTeam={noop}
      onRandomize={noop}
      hasFilteredPokemon={false}
      undo={noop}
      redo={noop}
      canUndo={false}
      canRedo={false}
      onReorderTeam={noop}
    />
  );
};

const MobileTeamSheetHarness = () => {
  const { teamPokemon, theme } = usePokemon();

  return (
    <MobileTeamSheet
      team={teamPokemon}
      onRemove={noop}
      onClear={noop}
      onSelect={noop}
      teamCapacity={6}
      theme={theme}
    />
  );
};

const mockClipboard = () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
};

describe('saved team resolution', () => {
  beforeEach(() => {
    localStorage.clear();
    usePokemonStore.setState({
      team: [],
      teamCustomizations: {},
      masterPokemonList: [],
      filteredPokemon: [],
      loading: false,
      error: null,
      history: [],
      future: [],
      achievements: {},
      savedTeams: [],
      favorites: new Set(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    usePokemonStore.setState({ team: [], teamCustomizations: {}, achievements: {} });
  });

  it('keeps a saved team visible and consistent when species details cannot resolve', async () => {
    setPokeapiServiceMock({ fetchAllPokemons: [] });
    usePokemonStore.setState({ team: [SAVED_ID] });
    const writeText = mockClipboard();

    renderWithProvider(<TeamBuilderHarness />);

    expect(await screen.findByText('1/6')).toBeInTheDocument();
    expect(screen.getByText(`Pokémon #${SAVED_ID}`)).toBeInTheDocument();
    expect(screen.getByText('Details unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('team-details-unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Your team is empty')).not.toBeInTheDocument();
    expect(usePokemonStore.getState().team).toEqual([SAVED_ID]);

    await waitFor(() =>
      expect(usePokemonStore.getState().achievements.novice_trainer).toBeTypeOf('number')
    );

    const exportButton = screen.getByRole('button', { name: 'Export team' });
    expect(exportButton).toBeEnabled();
    fireEvent.click(exportButton);
    expect(await screen.findByDisplayValue(new RegExp(String(SAVED_ID)))).toBeInTheDocument();

    const copyButton = screen.getByRole('button', { name: 'Copy team to clipboard' });
    expect(copyButton).toBeEnabled();
    fireEvent.click(copyButton);
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining(String(SAVED_ID)))
    );

    writeText.mockClear();
    const shareButton = screen.getByRole('button', { name: 'Share team link' });
    expect(shareButton).toBeEnabled();
    fireEvent.click(shareButton);
    await waitFor(() => expect(writeText).toHaveBeenCalled());

    const shareUrl = new URL(writeText.mock.calls[0][0] as string);
    expect(shareUrl.searchParams.get('team')).toBeNull();
    const compressed = shareUrl.searchParams.get('team_data');
    expect(compressed).toBeTruthy();

    const restored = decompressTeam(compressed!, [
      {
        id: SAVED_ID,
        name: 'unresolved',
        imageUrl: '',
        shinyImageUrl: '',
        types: [],
        flavorText: '',
        stats: [],
        abilities: [],
      } satisfies PokemonListItem,
    ]);
    expect(restored.map((member) => member.id)).toEqual([SAVED_ID]);
  });

  it('resolves available species while keeping unresolved IDs as placeholders', async () => {
    setPokeapiServiceMock();
    usePokemonStore.setState({ team: [1, SAVED_ID] });

    renderWithProvider(<TeamBuilderHarness />);

    expect(await screen.findByText('bulbasaur')).toBeInTheDocument();
    expect(screen.getByText('2/6')).toBeInTheDocument();
    expect(screen.getByText(`Pokémon #${SAVED_ID}`)).toBeInTheDocument();
    expect(screen.getByTestId('team-details-unavailable')).toBeInTheDocument();
    expect(usePokemonStore.getState().team).toEqual([1, SAVED_ID]);
  });

  it('shows the empty-team copy only when the persisted team is empty', () => {
    setPokeapiServiceMock({ fetchAllPokemons: [] });

    renderWithProvider(<TeamBuilderHarness />);

    expect(screen.getByText('0/6')).toBeInTheDocument();
    expect(screen.getByText('Your team is empty')).toBeInTheDocument();
    expect(screen.queryByText('Details unavailable')).not.toBeInTheDocument();
    expect(screen.queryByTestId('team-details-unavailable')).not.toBeInTheDocument();
    expect(usePokemonStore.getState().achievements.novice_trainer).toBeUndefined();
  });

  it('keeps the mobile FAB count and sheet placeholder aligned with saved IDs', async () => {
    setPokeapiServiceMock({ fetchAllPokemons: [] });
    usePokemonStore.setState({ team: [SAVED_ID] });

    renderWithProvider(<MobileTeamSheetHarness />);

    const fab = await screen.findByRole('button', {
      name: 'Team: 1/6. Tap to manage team.',
    });
    fireEvent.click(fab);

    expect(await screen.findByText('1/6 slots filled')).toBeInTheDocument();
    expect(screen.getByText(`Pokémon #${SAVED_ID}`)).toBeInTheDocument();
    expect(screen.getByText('Details unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-team-details-unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Your team is empty')).not.toBeInTheDocument();
    expect(usePokemonStore.getState().team).toEqual([SAVED_ID]);
  });
});
