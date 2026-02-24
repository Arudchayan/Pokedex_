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

    // Check if label has ID (will add this)
    expect(label).toHaveAttribute('id', 'sort-label');

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
});
