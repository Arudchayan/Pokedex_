import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import FilterControls from '../components/layout/FilterControls';
import { usePokemonStore } from '../store/usePokemonStore';
import { renderWithProvider } from './utils';

const defaultProps = {
  selectedGeneration: 'all',
  onGenerationChange: vi.fn(),
  selectedTypes: [],
  onTypeToggle: vi.fn(),
  flavorTextSearch: '',
  onFlavorTextChange: vi.fn(),
  onClearFilters: vi.fn(),
};

const renderAdvanced = () => {
  renderWithProvider(<FilterControls {...defaultProps} />);
  fireEvent.click(screen.getByText('Advanced (Stats & Abilities)'));
};

describe('FilterControls stat clamp', () => {
  beforeEach(() => {
    usePokemonStore.setState({ minStats: {} });
  });

  it('clamps a typed HP value of 9999 to 255', () => {
    renderAdvanced();
    const hpInput = screen.getByLabelText(/^hp$/i);

    fireEvent.change(hpInput, { target: { value: '9999' } });

    expect(hpInput).toHaveValue(255);
    expect(screen.getByText('hp ≥ 255')).toBeInTheDocument();
    expect(screen.queryByText('hp ≥ 9999')).not.toBeInTheDocument();
    expect(usePokemonStore.getState().minStats).toEqual({ hp: 255 });
  });

  it('rejects negative input instead of applying a filter', () => {
    renderAdvanced();
    const hpInput = screen.getByLabelText(/^hp$/i);

    fireEvent.change(hpInput, { target: { value: '-5' } });

    expect(hpInput).toHaveValue(null);
    expect(screen.queryByText(/hp ≥/)).not.toBeInTheDocument();
    expect(usePokemonStore.getState().minStats).toEqual({});
  });

  it('does not apply a filter for non-numeric input', () => {
    renderAdvanced();
    const hpInput = screen.getByLabelText(/^hp$/i);

    fireEvent.change(hpInput, { target: { value: 'abc' } });

    expect(usePokemonStore.getState().minStats).toEqual({});
    expect(screen.queryByText(/hp ≥/)).not.toBeInTheDocument();
  });

  it('accepts the 255 boundary and clamps 256', () => {
    renderAdvanced();
    const attackInput = screen.getByLabelText(/^attack$/i);

    fireEvent.change(attackInput, { target: { value: '255' } });
    expect(attackInput).toHaveValue(255);

    fireEvent.change(attackInput, { target: { value: '256' } });
    expect(attackInput).toHaveValue(255);
    expect(screen.getByText('attack ≥ 255')).toBeInTheDocument();
  });

  it.each(['hp', 'attack', 'defense', 'special attack', 'special defense', 'speed'])(
    'clamps the %s filter to 255',
    (stat) => {
      renderAdvanced();
      const input = screen.getByLabelText(new RegExp(`^${stat}$`, 'i'));

      fireEvent.change(input, { target: { value: '9999' } });

      expect(input).toHaveValue(255);
      expect(screen.getByText(`${stat} ≥ 255`)).toBeInTheDocument();
      expect(usePokemonStore.getState().minStats).toEqual({ [stat.replace(' ', '-')]: 255 });
    }
  );

  it('clearing the input removes the filter', () => {
    renderAdvanced();
    const hpInput = screen.getByLabelText(/^hp$/i);

    fireEvent.change(hpInput, { target: { value: '100' } });
    expect(screen.getByText('hp ≥ 100')).toBeInTheDocument();

    fireEvent.change(hpInput, { target: { value: '' } });
    expect(usePokemonStore.getState().minStats).toEqual({});
    expect(screen.queryByText(/hp ≥/)).not.toBeInTheDocument();
  });
});
