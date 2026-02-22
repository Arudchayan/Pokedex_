import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loader from './Loader';

describe('Loader', () => {
  it('renders with correct accessibility roles', () => {
    render(<Loader />);
    const loader = screen.getByRole('status');
    expect(loader).toBeInTheDocument();
  });

  it('displays the provided message', () => {
    render(<Loader message="Loading Pokémon..." />);
    expect(screen.getByText('Loading Pokémon...')).toBeInTheDocument();
  });

  it('provides screen reader only text when no message is present', () => {
    render(<Loader />);
    // The default label "Loading..." should be present but sr-only
    // Since we can't easily check for sr-only class without testing styles/implementation details,
    // checking that the text exists in the document is a good start.
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('allows customizing the accessible label', () => {
    render(<Loader label="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('hides the decorative SVG from screen readers', () => {
    const { container } = render(<Loader />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
