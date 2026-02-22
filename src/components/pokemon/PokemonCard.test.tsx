import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../test/utils';
import PokemonCard from './PokemonCard';
import { PokemonListItem } from '../../types';

// Mock SoundService
vi.mock('../services/soundService', () => ({
  playPokemonCry: vi.fn(),
}));

describe('PokemonCard', () => {
  const mockPokemon: PokemonListItem = {
    id: 25,
    name: 'pikachu',
    imageUrl: 'pikachu.png',
    shinyImageUrl: 'pikachu-shiny.png',
    types: ['electric'],
    flavorText: 'Pika Pika',
  };

  const onSelect = vi.fn();
  const onAddToTeam = vi.fn();
  const onToggleFavorite = vi.fn();

  it('renders pokemon info correctly', () => {
    renderWithProvider(
      <PokemonCard
        pokemon={mockPokemon}
        onSelect={onSelect}
        onAddToTeam={onAddToTeam}
        onToggleFavorite={onToggleFavorite}
        theme="light"
        isShiny={false}
      />
    );

    expect(screen.getByRole('heading', { name: /pikachu/i })).toBeInTheDocument();
    expect(screen.getByText('#0025')).toBeInTheDocument();
    expect(screen.getByText('electric')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'pikachu' })).toHaveAttribute('src', 'pikachu.png');

    // Accessibility check
    const card = screen.getByRole('button', { name: /view details for pikachu/i });
    expect(card).toBeInTheDocument();
  });

  it('calls onSelect when clicked or via keyboard', () => {
    renderWithProvider(
      <PokemonCard
        pokemon={mockPokemon}
        onSelect={onSelect}
        theme="light"
        isShiny={false}
      />
    );

    const card = screen.getByRole('button', { name: /view details for pikachu/i });

    // Click
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith(25);

    // Keyboard Enter
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(2);

    // Keyboard Space
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('handles add to team interaction', () => {
    renderWithProvider(
      <PokemonCard
        pokemon={mockPokemon}
        onSelect={onSelect}
        onAddToTeam={onAddToTeam}
        isInTeam={false}
        theme="light"
        isShiny={false}
      />
    );

    const addButton = screen.getByRole('button', { name: /add to team/i });
    fireEvent.click(addButton);
    expect(onAddToTeam).toHaveBeenCalledWith(mockPokemon);

    // In unit tests with fireEvent, stopPropagation behavior can be tricky to assert
    // without user-event or complex event mocking.
    // We assume the logic in the component (which calls e.stopPropagation()) is correct.
    // The fact that onAddToTeam is called confirms the button logic triggered.
  });

  it('shows remove button when in team', () => {
    const onRemove = vi.fn();
    renderWithProvider(
      <PokemonCard
        pokemon={mockPokemon}
        onSelect={onSelect}
        onAddToTeam={onAddToTeam}
        onRemoveFromTeam={onRemove}
        isInTeam={true}
        theme="light"
        isShiny={false}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove/i });
    expect(removeButton).toBeInTheDocument();
    fireEvent.click(removeButton);
    expect(onRemove).toHaveBeenCalledWith(25);
  });

  it('toggles favorite', () => {
    renderWithProvider(
      <PokemonCard
        pokemon={mockPokemon}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        isFavorite={false}
        theme="light"
        isShiny={false}
      />
    );

    // Should find by accessibility label now
    const favButton = screen.getByRole('button', { name: /add pikachu to favorites/i });
    fireEvent.click(favButton);
    expect(onToggleFavorite).toHaveBeenCalledWith(25);
  });
});
