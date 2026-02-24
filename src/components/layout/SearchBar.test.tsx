import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import SearchBar from './SearchBar';
import { render } from '@testing-library/react';

describe('SearchBar', () => {
  const onChange = vi.fn();

  it('renders correctly', () => {
    render(<SearchBar value="" onChange={onChange} placeholder="Test placeholder" />);

    const input = screen.getByPlaceholderText('Test placeholder (Press /)');
    expect(input).toBeInTheDocument();
  });

  it('shows clear button when text is present', () => {
    const { rerender } = render(<SearchBar value="" onChange={onChange} />);

    // clear button should not be visible initially
    let clearButton = screen.queryByLabelText('Clear search');
    expect(clearButton).not.toBeInTheDocument();

    // Rerender with value
    rerender(<SearchBar value="pikachu" onChange={onChange} />);

    // clear button should be visible now
    clearButton = screen.queryByLabelText('Clear search');
    // Note: This test expects the FUTURE behavior. It will fail currently.
    expect(clearButton).toBeInTheDocument();
  });

  it('clears text when clear button is clicked', () => {
    render(<SearchBar value="pikachu" onChange={onChange} />);

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('has accessible attributes', () => {
    render(<SearchBar value="" onChange={onChange} placeholder="Search..." />);

    const input = screen.getByPlaceholderText('Search... (Press /)');
    // Should have type search
    expect(input).toHaveAttribute('type', 'search');
    // Should have aria-label
    expect(input).toHaveAttribute('aria-label', 'Search...');
  });
});
