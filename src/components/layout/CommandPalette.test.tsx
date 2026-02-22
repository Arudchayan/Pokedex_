import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CommandPalette from './CommandPalette';
import { AppController } from '../../app/useAppController';

// Mock dependencies
vi.mock('../../store/useModalStore', () => ({
  useModalStore: () => ({
    openMoveDex: vi.fn(),
    openAbilityDex: vi.fn(),
    openItemDex: vi.fn(),
    openBattleCalc: vi.fn(),
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
    masterPokemonList: [
      { id: 1, name: 'Bulbasaur', imageUrl: 'bulb.png', nameLower: 'bulbasaur' },
      { id: 25, name: 'Pikachu', imageUrl: 'pika.png', nameLower: 'pikachu' },
      { id: 150, name: 'Mewtwo', imageUrl: 'mewtwo.png', nameLower: 'mewtwo' }
    ],
    toggleTheme: vi.fn(),
  };

  const usePokemonStore = (selector: any) => selector(mockState);
  usePokemonStore.getState = () => mockState;

  return { usePokemonStore };
});

// Mock controller
const mockController = {
  theme: 'dark',
  isCyberpunk: false,
  handleRandomPokemon: vi.fn(),
  handleFocusSearch: vi.fn(),
  handleToggleShiny: vi.fn(),
  handleSelectPokemon: vi.fn(),
} as unknown as AppController;

describe('CommandPalette', () => {
  it('does not render when isOpen is false', () => {
    render(<CommandPalette isOpen={false} onClose={vi.fn()} controller={mockController} />);
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} controller={mockController} />);
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
  });

  it('filters commands based on input', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} controller={mockController} />);
    const input = screen.getByPlaceholderText('Type a command or search...');

    fireEvent.change(input, { target: { value: 'Random' } });
    expect(screen.getByText('Random Pokemon')).toBeInTheDocument();
    expect(screen.queryByText('Move Dex')).not.toBeInTheDocument();
  });

  it('calls action on click', () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} controller={mockController} />);

    fireEvent.change(screen.getByPlaceholderText('Type a command or search...'), { target: { value: 'Random' } });
    fireEvent.click(screen.getByText('Random Pokemon'));

    expect(mockController.handleRandomPokemon).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('searches and selects a Pokemon', () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} controller={mockController} />);

    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'Bulb' } }); // Search for Bulbasaur

    // Should find Bulbasaur
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    // Should NOT find Pikachu
    expect(screen.queryByText('Pikachu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Bulbasaur'));

    expect(mockController.handleSelectPokemon).toHaveBeenCalledWith(1);
    expect(onClose).toHaveBeenCalled();
  });

  it('displays Pokemon results with icon', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} controller={mockController} />);

    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'Mewtwo' } });

    const pokemonItem = screen.getByText('Mewtwo');
    expect(pokemonItem).toBeInTheDocument();

    // Check if image is rendered (simplistic check)
    const img = screen.getByAltText('Mewtwo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'mewtwo.png');
  });
});
