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

  it('gives the generation select a visible keyboard focus indicator', () => {
    renderWithProvider(<FilterControls {...defaultProps} />);

    const select = screen.getByLabelText('Select generation');
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveClass(
      'focus-visible:outline',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2'
    );
    expect(select.className).toMatch(/focus-visible:outline-(white|slate-900)/);
    expect(select.className).not.toContain('focus:outline-none');
    expect(select.className).not.toContain('ring-primary-500');
  });

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
    const controlsId = generationToggle.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();

    const generationSection = document.getElementById(controlsId!);
    expect(generationSection).toBeInTheDocument();

    // Toggle it closed
    fireEvent.click(generationToggle);
    expect(generationToggle).toHaveAttribute('aria-expanded', 'false');
    // Content should be removed (conditionally rendered)
    expect(document.getElementById(controlsId!)).not.toBeInTheDocument();
  });
});
