import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TeamBuilder from '../../components/team/TeamBuilder';
import PokemonGridItem from '../../components/pokemon/PokemonGridItem';
import { PokemonListItem } from '../../types';

// Mock DataTransfer
class MockDataTransfer {
  data: Record<string, string> = {};
  effectAllowed = 'none';
  dropEffect = 'none';

  setData(format: string, data: string) {
    this.data[format] = data;
  }
  getData(format: string) {
    return this.data[format];
  }
}

// Mock useAchievements
vi.mock('../../context/AchievementContext', () => ({
  useAchievements: () => ({
    unlockAchievement: vi.fn(),
  }),
}));

// Mock soundService to avoid errors
vi.mock('../../services/soundService', () => ({
  playUISound: vi.fn(),
}));

// Mock useTeamAnalytics
vi.mock('../../hooks/useTeamAnalytics', () => ({
  useTeamAnalytics: () => ({
    typeCounts: {},
    teamWeaknesses: {},
    teamResistances: {},
    offensiveCoverage: {},
    majorThreats: [],
    teamStats: null,
  }),
}));

const mockPokemon: PokemonListItem = {
  id: 1,
  name: 'bulbasaur',
  types: ['grass', 'poison'],
  imageUrl: 'test-url',
  stats: [],
  abilities: [],
  moves: [],
  baseExperience: 64,
  height: 7,
  weight: 69
};

describe('Drag and Drop Feature', () => {
  it('PokemonGridItem sets correct drag data on dragstart', () => {
    render(
      <PokemonGridItem
        pokemon={mockPokemon}
        onSelect={vi.fn()}
        onAddToTeam={vi.fn()}
        onRemoveFromTeam={vi.fn()}
        isInTeam={false}
        teamIsFull={false}
        isFavorite={false}
        onToggleFavorite={vi.fn()}
        onAddToComparison={vi.fn()}
        isInComparison={false}
        canAddToComparison={true}
        theme="light"
        isShiny={false}
      />
    );

    // The wrapper div has draggable. PokemonCard has role="button".
    // We want the parent of the button.
    const card = screen.getByRole('button', { name: /view details/i }).parentElement;

    // Ensure we got the draggable element
    expect(card).toHaveAttribute('draggable', 'true');

    const dataTransfer = new MockDataTransfer();

    fireEvent.dragStart(card!, { dataTransfer });

    expect(dataTransfer.getData('application/x-pokedex-pokemon')).toBe(JSON.stringify(mockPokemon));
    expect(dataTransfer.effectAllowed).toBe('copy');
  });

  it('TeamBuilder handles drop of Pokemon data', async () => {
    const handleAddToTeam = vi.fn();

    render(
      <TeamBuilder
        team={[]}
        onRemove={vi.fn()}
        onClear={vi.fn()}
        onSelect={vi.fn()}
        theme="light"
        onUpdateTeamMember={vi.fn()}
        onLoadTeam={vi.fn()}
        onRandomize={vi.fn()}
        hasFilteredPokemon={true}
        onAddToTeam={handleAddToTeam}
        undo={vi.fn()}
        redo={vi.fn()}
        canUndo={false}
        canRedo={false}
        onReorderTeam={vi.fn()}
      />
    );

    const dropZone = screen.getByLabelText('Team builder');
    const dataTransfer = new MockDataTransfer();
    dataTransfer.setData('application/x-pokedex-pokemon', JSON.stringify(mockPokemon));

    // Must trigger dragOver first to allow drop
    fireEvent.dragOver(dropZone, { dataTransfer });

    await act(async () => {
      fireEvent.drop(dropZone, { dataTransfer });
    });

    expect(handleAddToTeam).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      name: 'bulbasaur'
    }));
  });

  it('TeamBuilder ignores drop with invalid data', async () => {
    const handleAddToTeam = vi.fn();

    render(
      <TeamBuilder
        team={[]}
        onRemove={vi.fn()}
        onClear={vi.fn()}
        onSelect={vi.fn()}
        theme="light"
        onUpdateTeamMember={vi.fn()}
        onLoadTeam={vi.fn()}
        onRandomize={vi.fn()}
        hasFilteredPokemon={true}
        onAddToTeam={handleAddToTeam}
        undo={vi.fn()}
        redo={vi.fn()}
        canUndo={false}
        canRedo={false}
        onReorderTeam={vi.fn()}
      />
    );

    const dropZone = screen.getByLabelText('Team builder');
    const dataTransfer = new MockDataTransfer();
    dataTransfer.setData('text/plain', 'some random text');

    await act(async () => {
      fireEvent.drop(dropZone, { dataTransfer });
    });

    expect(handleAddToTeam).not.toHaveBeenCalled();
  });

  it('TeamBuilder ignores drop with invalid Pokemon schema', async () => {
    const handleAddToTeam = vi.fn();
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <TeamBuilder
        team={[]}
        onRemove={vi.fn()}
        onClear={vi.fn()}
        onSelect={vi.fn()}
        theme="light"
        onUpdateTeamMember={vi.fn()}
        onLoadTeam={vi.fn()}
        onRandomize={vi.fn()}
        hasFilteredPokemon={true}
        onAddToTeam={handleAddToTeam}
        undo={vi.fn()}
        redo={vi.fn()}
        canUndo={false}
        canRedo={false}
        onReorderTeam={vi.fn()}
      />
    );

    const dropZone = screen.getByLabelText('Team builder');
    const dataTransfer = new MockDataTransfer();

    // Malformed data: ID is string (should be number), Name is missing
    const maliciousData = {
      id: "malicious-string-id",
      imageUrl: "javascript:alert(1)"
    };

    dataTransfer.setData('application/x-pokedex-pokemon', JSON.stringify(maliciousData));

    // Must trigger dragOver first to allow drop
    fireEvent.dragOver(dropZone, { dataTransfer });

    await act(async () => {
      fireEvent.drop(dropZone, { dataTransfer });
    });

    expect(handleAddToTeam).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Sentinel: Dropped data failed validation'));

    consoleWarnSpy.mockRestore();
  });
});
