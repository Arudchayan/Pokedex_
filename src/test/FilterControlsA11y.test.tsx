import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FilterControls from '../components/layout/FilterControls';
import { renderWithProvider } from './utils';

describe('FilterControls Accessibility', () => {
  const defaultProps = {
    selectedGeneration: 'all',
    onGenerationChange: vi.fn(),
    selectedTypes: [],
    onTypeToggle: vi.fn(),
    flavorTextSearch: '',
    onFlavorTextChange: vi.fn(),
    onClearFilters: vi.fn(),
  };

  it('has accessible Ability search input', () => {
    renderWithProvider(<FilterControls {...defaultProps} />);

    // Open Advanced section
    const advancedToggle = screen.getByText('Advanced (Stats & Abilities)');
    fireEvent.click(advancedToggle);

    // This should fail if the label is not associated with the input
    const abilityInput = screen.getByLabelText('Ability');
    expect(abilityInput).toBeInTheDocument();
  });

  it('has accessible Minimum Stats inputs', () => {
    renderWithProvider(<FilterControls {...defaultProps} />);

    // Open Advanced section
    const advancedToggle = screen.getByText('Advanced (Stats & Abilities)');
    fireEvent.click(advancedToggle);

    // Check for a few stats - this should fail if spans are used instead of labels
    // Note: The text content is lowercase in DOM but uppercase via CSS. Query is case-insensitive by default for some matchers but getByLabelText string match is strict?
    // Let's use regex for flexibility or exact DOM text.
    const hpInput = screen.getByLabelText(/^hp$/i);
    expect(hpInput).toBeInTheDocument();

    const attackInput = screen.getByLabelText(/^attack$/i);
    expect(attackInput).toBeInTheDocument();
  });

  it('has valid aria-controls and aria-expanded attributes on section toggles', () => {
    renderWithProvider(<FilterControls {...defaultProps} />);

    // Generation section is open by default
    const generationToggle = screen.getByRole('button', { name: /Generation/i });
    expect(generationToggle).toHaveAttribute('aria-expanded', 'true');
    expect(generationToggle).toHaveAttribute('aria-controls', 'filter-section-generation');

    const generationSection = document.getElementById('filter-section-generation');
    expect(generationSection).toBeInTheDocument();

    // Toggle it closed
    fireEvent.click(generationToggle);
    expect(generationToggle).toHaveAttribute('aria-expanded', 'false');
    // Content should be removed (conditionally rendered)
    expect(document.getElementById('filter-section-generation')).not.toBeInTheDocument();
  });
});
