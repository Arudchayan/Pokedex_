import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormSelector from './FormSelector';
import { PokemonForm } from '../../types';

describe('FormSelector', () => {
  const mockForms: PokemonForm[] = [
    {
      id: 1,
      name: 'bulbasaur',
      formName: 'default',
      isDefault: true,
      isBattleOnly: false,
      isMega: false,
      formOrder: 1,
      order: 1,
      imageUrl: 'bulbasaur.png',
      shinyImageUrl: 'bulbasaur-shiny.png',
      types: ['grass', 'poison'],
      stats: [],
      abilities: [],
      height: 7,
      weight: 69,
    },
    {
      id: 2,
      name: 'bulbasaur-mega',
      formName: 'mega',
      isDefault: false,
      isBattleOnly: true,
      isMega: true,
      formOrder: 2,
      order: 2,
      imageUrl: 'bulbasaur-mega.png',
      shinyImageUrl: 'bulbasaur-mega-shiny.png',
      types: ['grass', 'poison'],
      stats: [],
      abilities: [],
      height: 10,
      weight: 100,
    },
  ];

  const mockOnSelectForm = vi.fn();

  it('renders all forms', () => {
    render(
      <FormSelector
        forms={mockForms}
        selectedForm={mockForms[0]}
        onSelectForm={mockOnSelectForm}
        isShiny={false}
      />
    );

    expect(screen.getByText('default')).toBeInTheDocument();
    expect(screen.getByText('mega')).toBeInTheDocument();
  });

  it('renders shiny images when isShiny is true', () => {
    render(
      <FormSelector
        forms={mockForms}
        selectedForm={mockForms[0]}
        onSelectForm={mockOnSelectForm}
        isShiny={true}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'bulbasaur-shiny.png');
    expect(images[1]).toHaveAttribute('src', 'bulbasaur-mega-shiny.png');
  });

  it('renders regular images when isShiny is false', () => {
    render(
      <FormSelector
        forms={mockForms}
        selectedForm={mockForms[0]}
        onSelectForm={mockOnSelectForm}
        isShiny={false}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'bulbasaur.png');
    expect(images[1]).toHaveAttribute('src', 'bulbasaur-mega.png');
  });

  it('calls onSelectForm when a form is clicked', () => {
    render(
      <FormSelector
        forms={mockForms}
        selectedForm={mockForms[0]}
        onSelectForm={mockOnSelectForm}
        isShiny={false}
      />
    );

    fireEvent.click(screen.getByText('mega'));
    expect(mockOnSelectForm).toHaveBeenCalledWith(mockForms[1]);
  });

  it('does not render a shiny toggle button', () => {
    render(
      <FormSelector
        forms={mockForms}
        selectedForm={mockForms[0]}
        onSelectForm={mockOnSelectForm}
        isShiny={false}
      />
    );

    // The shiny toggle button had text "Shiny"
    expect(screen.queryByText('Shiny')).not.toBeInTheDocument();
  });
});
