import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../test/utils';
import TeamBuilder from './TeamBuilder';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import { PokemonListItem } from '../../types';

// Mock TypeBadge
vi.mock('./TypeBadge', () => ({
  default: ({ type }: { type: string }) => <span>{type}</span>,
}));

describe('TeamBuilder DoS Protection', () => {
  const mockTeam: PokemonListItem[] = [];
  const onRemove = vi.fn();
  const onClear = vi.fn();
  const onSelect = vi.fn();
  const onUpdateTeamMember = vi.fn();
  const onLoadTeam = vi.fn();
  const onRandomize = vi.fn();
  const onAddPokemon = vi.fn();
  const onAddToTeam = vi.fn();
  const undo = vi.fn();
  const redo = vi.fn();
  const onReorderTeam = vi.fn();

  const defaultProps = {
    team: mockTeam,
    onRemove,
    onClear,
    onSelect,
    teamCapacity: 6,
    theme: 'dark' as const,
    onUpdateTeamMember,
    onLoadTeam,
    onRandomize,
    hasFilteredPokemon: true,
    undo,
    redo,
    canUndo: true,
    canRedo: true,
    onReorderTeam,
    onAddPokemon,
    onAddToTeam
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prevents DoS by blocking large payloads in drag-and-drop', () => {
    const parseSpy = vi.spyOn(JSON, 'parse');
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProvider(<TeamBuilder {...defaultProps} />);

    const container = screen.getByLabelText('Team builder');

    // Create a payload larger than MAX_INPUT_LENGTH
    const hugePayload = 'a'.repeat(MAX_INPUT_LENGTH + 100);

    // Simulate drop
    const mockDataTransfer = {
      getData: vi.fn().mockImplementation((format) => {
        if (format === 'application/x-pokedex-pokemon') return hugePayload;
        return '';
      }),
    };

    fireEvent.drop(container, {
      dataTransfer: mockDataTransfer
    });

    // Expectation for security fix: JSON.parse should NOT be called
    expect(parseSpy).not.toHaveBeenCalled();

    // Expect warning
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('too large'));
  });
});
