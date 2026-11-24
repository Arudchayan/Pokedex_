import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Modal from '../../components/base/Modal';
import PokemonAutocomplete from '../../components/shared/PokemonAutocomplete';
import type { PokemonListItem } from '../../types';

const pikachu: PokemonListItem = {
  id: 25,
  name: 'Pikachu',
  nameLower: 'pikachu',
  imageUrl: 'pikachu.png',
  shinyImageUrl: 'pikachu-shiny.png',
  types: ['electric'],
  flavorText: '',
  stats: [],
  abilities: ['static'],
};

describe('PokemonAutocomplete inside a Modal', () => {
  it('closes only the listbox on the first Escape and the modal on the second', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Pokemon picker">
        <PokemonAutocomplete
          pokemonList={[pikachu]}
          theme="light"
          onSelect={vi.fn()}
          label="Select Pokemon"
        />
      </Modal>
    );

    const input = screen.getByRole('combobox', { name: 'Select Pokemon' });
    fireEvent.change(input, { target: { value: 'pika' } });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Pokemon picker' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('also swallows Escape for a no-match message', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Pokemon picker">
        <PokemonAutocomplete
          pokemonList={[pikachu]}
          theme="light"
          onSelect={vi.fn()}
          label="Select Pokemon"
        />
      </Modal>
    );

    const input = screen.getByRole('combobox', { name: 'Select Pokemon' });
    fireEvent.change(input, { target: { value: 'zzzz' } });
    expect(screen.getByRole('status')).toHaveTextContent(/no pokémon match/i);

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
