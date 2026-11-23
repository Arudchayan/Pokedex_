import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProvider } from '../utils';
import SortingControls from '../../components/layout/SortingControls';

describe('SortingControls', () => {
  it('renders correctly with accessibility attributes', () => {
    const onSortChange = vi.fn();
    const onOrderChange = vi.fn();

    renderWithProvider(
      <SortingControls
        sortBy="id"
        sortOrder="asc"
        onSortChange={onSortChange}
        onOrderChange={onOrderChange}
      />
    );

    // Check for "Sort by" label
    const label = screen.getByText('Sort by:');
    expect(label).toBeInTheDocument();

    // The group is named by its label, whose id must be present (and unique per instance).
    expect(label).toHaveAttribute('id');

    // Check for container group role
    const group = screen.getByRole('group', { name: /sort by/i });
    expect(group).toBeInTheDocument();

    // Check sort options
    const idButton = screen.getByRole('button', { name: /pokedex #/i });
    expect(idButton).toBeInTheDocument();
    expect(idButton).toHaveAttribute('type', 'button');
    expect(idButton).toHaveAttribute('aria-pressed', 'true');

    const nameButton = screen.getByRole('button', { name: /name/i });
    expect(nameButton).toBeInTheDocument();
    expect(nameButton).toHaveAttribute('type', 'button');
    expect(nameButton).toHaveAttribute('aria-pressed', 'false');

    // Check order toggle button
    const orderButton = screen.getByTitle(/sort descending/i); // Title logic in current code
    expect(orderButton).toBeInTheDocument();
    expect(orderButton).toHaveAttribute('type', 'button');
    expect(orderButton).toHaveAttribute('aria-label', 'Switch to descending sort');
  });

  it('toggles sort options', async () => {
    const onSortChange = vi.fn();
    const onOrderChange = vi.fn();
    const user = userEvent.setup();

    renderWithProvider(
      <SortingControls
        sortBy="id"
        sortOrder="asc"
        onSortChange={onSortChange}
        onOrderChange={onOrderChange}
      />
    );

    const nameButton = screen.getByRole('button', { name: /name/i });
    await user.click(nameButton);

    expect(onSortChange).toHaveBeenCalledWith('name');
  });

  it('toggles sort order', async () => {
    const onSortChange = vi.fn();
    const onOrderChange = vi.fn();
    const user = userEvent.setup();

    renderWithProvider(
      <SortingControls
        sortBy="id"
        sortOrder="asc"
        onSortChange={onSortChange}
        onOrderChange={onOrderChange}
      />
    );

    // We use getByRole here expecting we add aria-label, but initially we might fallback to title if needed or fail.
    // Since we plan to add aria-label, let's look for it.
    const orderButton = screen.getByRole('button', { name: /switch to descending sort/i });
    await user.click(orderButton);

    expect(onOrderChange).toHaveBeenCalledWith('desc');
  });

  it('changes sort via stats dropdown', async () => {
    const onSortChange = vi.fn();
    const onOrderChange = vi.fn();
    const user = userEvent.setup();

    renderWithProvider(
      <SortingControls
        sortBy="id"
        sortOrder="asc"
        onSortChange={onSortChange}
        onOrderChange={onOrderChange}
      />
    );

    const select = screen.getByLabelText(/sort by stat/i);
    await user.selectOptions(select, 'speed');

    expect(onSortChange).toHaveBeenCalledWith('speed');
  });

  it('exposes an accessible name for the Dex selector', () => {
    renderWithProvider(
      <SortingControls sortBy="id" sortOrder="asc" onSortChange={vi.fn()} onOrderChange={vi.fn()} />
    );

    const dexSelect = screen.getByRole('combobox', { name: /dex/i });
    expect(dexSelect).toHaveValue('national');
    expect(dexSelect).toHaveAccessibleName('Dex:');
    // The stat sort select keeps its own distinct name.
    expect(screen.getByRole('combobox', { name: 'Sort by Stat' })).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  it('associates the visible Dex label with the select', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <SortingControls sortBy="id" sortOrder="asc" onSortChange={vi.fn()} onOrderChange={vi.fn()} />
    );

    await user.click(screen.getByText('Dex:'));

    expect(screen.getByRole('combobox', { name: /dex/i })).toHaveFocus();
  });

  it('gives each Dex selector a unique id and name across instances', () => {
    const props = {
      sortBy: 'id' as const,
      sortOrder: 'asc' as const,
      onSortChange: vi.fn(),
      onOrderChange: vi.fn(),
    };

    renderWithProvider(
      <>
        <SortingControls {...props} />
        <SortingControls {...props} />
      </>
    );

    const dexSelects = screen.getAllByRole<HTMLSelectElement>('combobox', { name: /dex/i });
    expect(dexSelects).toHaveLength(2);
    expect(dexSelects[0].id).not.toBe('');
    expect(dexSelects[1].id).not.toBe('');
    expect(dexSelects[0].id).not.toBe(dexSelects[1].id);
    expect(dexSelects[0].labels).toHaveLength(1);
    expect(dexSelects[1].labels).toHaveLength(1);
    expect(screen.getAllByRole('combobox', { name: 'Sort by Stat' })).toHaveLength(2);
  });

  it('updates sort behavior when the Dex selection changes', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const onPokedexChange = vi.fn();

    renderWithProvider(
      <SortingControls
        sortBy="id"
        sortOrder="asc"
        onSortChange={onSortChange}
        onOrderChange={vi.fn()}
        onPokedexChange={onPokedexChange}
      />
    );

    const dexSelect = screen.getByRole('combobox', { name: /dex/i });
    await user.selectOptions(dexSelect, 'kanto');

    expect(onPokedexChange).toHaveBeenCalledWith('kanto');
    expect(onSortChange).toHaveBeenCalledWith('regional-dex');
  });

  it('returns to id sort when the national Dex is selected', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    renderWithProvider(
      <SortingControls
        sortBy="regional-dex"
        sortOrder="asc"
        onSortChange={onSortChange}
        onOrderChange={vi.fn()}
        selectedPokedex="kanto"
        onPokedexChange={vi.fn()}
      />
    );

    expect(screen.getByRole('combobox', { name: /dex/i })).toHaveValue('kanto');

    await user.selectOptions(screen.getByRole('combobox', { name: /dex/i }), 'national');

    expect(onSortChange).toHaveBeenCalledWith('id');
  });
});
