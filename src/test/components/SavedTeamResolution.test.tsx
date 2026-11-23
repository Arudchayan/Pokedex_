import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider, setPokeapiServiceMock } from '../utils';
import TeamBuilder from '../../components/team/TeamBuilder';
import MobileTeamSheet from '../../components/team/MobileTeamSheet';
import SavedTeamsModal from '../../components/team/SavedTeamsModal';
import { usePokemon } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import { decompressTeam } from '../../utils/urlCompression';
import type { PokemonListItem, TeamMember } from '../../types';

const noop = () => {};
const SAVED_ID = 672;
const UNAVAILABLE_EXPORT = `#${SAVED_ID} (details unavailable)`;

const resolvedPokemon = (overrides: Partial<PokemonListItem> = {}): PokemonListItem => ({
  id: SAVED_ID,
  name: 'mewtwo',
  imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
  shinyImageUrl:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/150.png',
  types: ['psychic'],
  flavorText: '',
  stats: [],
  abilities: [],
  ...overrides,
});

const unavailableMember = (id: number): TeamMember => ({
  id,
  name: `Pokémon #${id}`,
  imageUrl: '',
  shinyImageUrl: '',
  types: [],
  flavorText: '',
  stats: [],
  abilities: [],
  detailsUnavailable: true,
});

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

const SavedTeamsModalHarness = () => {
  const { teamPokemon, theme } = usePokemon();

  return (
    <SavedTeamsModal
      isOpen
      onClose={noop}
      currentTeam={teamPokemon}
      onLoadTeam={noop}
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
    const exportField = await screen.findByDisplayValue(new RegExp(String(SAVED_ID)));
    expect(exportField).toHaveValue(UNAVAILABLE_EXPORT);
    expect((exportField as HTMLTextAreaElement).value).not.toContain(`Pokémon #${SAVED_ID}`);

    const copyButton = screen.getByRole('button', { name: 'Copy team to clipboard' });
    expect(copyButton).toBeEnabled();
    fireEvent.click(copyButton);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(UNAVAILABLE_EXPORT));

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
  }, 15000);

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

  it('resolves a placeholder when species data arrives and ignores blank image overrides', async () => {
    setPokeapiServiceMock();
    usePokemonStore.getState().setTeam([unavailableMember(SAVED_ID)]);
    expect(usePokemonStore.getState().teamCustomizations[SAVED_ID]?.imageUrl).toBeUndefined();

    // Simulate legacy/corrupt persisted customization from an earlier placeholder save.
    usePokemonStore.setState({
      teamCustomizations: { [SAVED_ID]: { imageUrl: '' } },
    });

    renderWithProvider(<TeamBuilderHarness />);

    expect(await screen.findByText(`Pokémon #${SAVED_ID}`)).toBeInTheDocument();
    await waitFor(() => expect(usePokemonStore.getState().masterPokemonList).toHaveLength(2));

    await act(async () => {
      usePokemonStore.getState().setMasterPokemonList([resolvedPokemon()]);
    });

    expect(await screen.findByText('mewtwo')).toBeInTheDocument();
    expect(screen.queryByText(`Pokémon #${SAVED_ID}`)).not.toBeInTheDocument();
    expect(screen.queryByText('Details unavailable')).not.toBeInTheDocument();
    expect(screen.getByAltText('mewtwo')).toHaveAttribute('src', resolvedPokemon().imageUrl);
    expect(usePokemonStore.getState().team).toEqual([SAVED_ID]);
  }, 15000);

  it('unlocks Full Squad from six persisted IDs without details', async () => {
    setPokeapiServiceMock({ fetchAllPokemons: [] });
    usePokemonStore.setState({ team: [1, 2, 3, 4, 5, 6] });

    renderWithProvider(<TeamBuilderHarness />);

    expect(await screen.findByText('6/6')).toBeInTheDocument();
    await waitFor(() => {
      const achievements = usePokemonStore.getState().achievements;
      expect(achievements.novice_trainer).toBeTypeOf('number');
      expect(achievements.full_squad).toBeTypeOf('number');
    });
  }, 10000);

  it('blocks saving the current team while member details are unavailable', async () => {
    setPokeapiServiceMock({ fetchAllPokemons: [] });
    usePokemonStore.setState({ team: [SAVED_ID] });

    renderWithProvider(<SavedTeamsModalHarness />);

    expect(await screen.findByText(/Some team details are unavailable/i)).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('New team name'), {
      target: { value: 'Broken team' },
    });
    fireEvent.click(saveButton);
    expect(usePokemonStore.getState().savedTeams).toHaveLength(0);
  });

  it('renders an id tile for saved members without a sprite', () => {
    usePokemonStore.setState({
      savedTeams: [
        {
          id: 'saved-1',
          name: 'Legacy team',
          team: [{ ...unavailableMember(SAVED_ID), detailsUnavailable: undefined }],
          updatedAt: Date.now(),
        },
      ],
    });

    renderWithProvider(<SavedTeamsModalHarness />);

    expect(screen.getByLabelText(`Pokémon #${SAVED_ID}, image unavailable`)).toBeInTheDocument();
    expect(screen.queryByAltText(`Pokémon #${SAVED_ID}`)).not.toBeInTheDocument();
  });

  it('reports analytics as unavailable instead of claiming empty coverage', async () => {
    setPokeapiServiceMock({ fetchAllPokemons: [] });
    usePokemonStore.setState({ team: [SAVED_ID] });

    renderWithProvider(<TeamBuilderHarness />);

    expect(await screen.findByText('Analytics unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Offensive Type Coverage')).not.toBeInTheDocument();
    expect(screen.queryByText('No common weaknesses!')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show Details/i })).not.toBeInTheDocument();
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
