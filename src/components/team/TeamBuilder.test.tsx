import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../test/utils';
import TeamBuilder from './TeamBuilder';
import { PokemonListItem } from '../../types';

// Mock TypeBadge
vi.mock('./TypeBadge', () => ({
  default: ({ type }: { type: string }) => <span>{type}</span>,
}));

describe('TeamBuilder', () => {
  const mockTeam: PokemonListItem[] = [
    {
      id: 1,
      name: 'bulbasaur',
      imageUrl: 'img1.png',
      shinyImageUrl: '',
      types: ['grass', 'poison'],
      flavorText: '',
    },
    {
      id: 4,
      name: 'charmander',
      imageUrl: 'img4.png',
      shinyImageUrl: '',
      types: ['fire'],
      flavorText: '',
    },
  ];

  const onRemove = vi.fn();
  const onClear = vi.fn();
  const onSelect = vi.fn();
  const onUpdateTeamMember = vi.fn();
  const onLoadTeam = vi.fn();
  const onRandomize = vi.fn();
  const onAddPokemon = vi.fn();
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
  };

  it('renders current team members', () => {
    renderWithProvider(<TeamBuilder {...defaultProps} />);

    expect(screen.getByText('2/6')).toBeInTheDocument();
    expect(screen.getByText('bulbasaur')).toBeInTheDocument();
    expect(screen.getByText('charmander')).toBeInTheDocument();
  });

  it('renders empty slots', () => {
    renderWithProvider(<TeamBuilder {...defaultProps} />);

    // 6 capacity - 2 members = 4 empty slots
    const emptySlots = screen.getAllByText(/Slot \d+/);
    expect(emptySlots).toHaveLength(4);
  });

  it('calls onAddPokemon when empty slot is clicked', () => {
    renderWithProvider(<TeamBuilder {...defaultProps} onAddPokemon={onAddPokemon} />);

    const emptySlot = screen.getByText('Slot 3').closest('div');
    fireEvent.click(emptySlot!);
    expect(onAddPokemon).toHaveBeenCalled();
  });

  it('calls onRemove when remove button is clicked', () => {
    renderWithProvider(<TeamBuilder {...defaultProps} />);

    // Find remove button for first member
    const removeButtons = screen.getAllByLabelText(/Remove .* from team/i);
    fireEvent.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('calls onClear when clear button is clicked', () => {
    renderWithProvider(<TeamBuilder {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Clear team/i }));
    expect(onClear).toHaveBeenCalled();
  });

  it('shows analytics when requested', () => {
    renderWithProvider(<TeamBuilder {...defaultProps} />);

    const showDetailsBtn = screen.getByText(/Show Details/i);
    fireEvent.click(showDetailsBtn);

    expect(screen.getByText('Type Coverage')).toBeInTheDocument();
    // Check for type counts: Grass x1, Poison x1, Fire x1
    const typeCounts = screen.getAllByText(/x1/);
    expect(typeCounts.length).toBeGreaterThan(0);
  });

  it('renders reorder handles for team members', () => {
    renderWithProvider(<TeamBuilder {...defaultProps} />);

    const handles = screen.getAllByTitle('Drag to reorder');
    expect(handles).toHaveLength(2);
    expect(handles[0]).toHaveAttribute('aria-label', expect.stringContaining('Reorder bulbasaur'));
    expect(handles[1]).toHaveAttribute('aria-label', expect.stringContaining('Reorder charmander'));
  });
});
