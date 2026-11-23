import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

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

  it('returns focus to the input after clicking the clear button', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<SearchBar value="" onChange={handleChange} placeholder="Search Pokemon" />);

    const input = screen.getByRole('searchbox', { name: 'Search Pokemon' });
    await user.type(input, 'pika');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it.each([
    { key: '{Enter}', label: 'Enter' },
    { key: ' ', label: 'Space' },
  ])(
    'returns focus to the input when the clear button is activated with $label',
    async ({ key }) => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<SearchBar value="pikachu" onChange={handleChange} placeholder="Search Pokemon" />);

      const input = screen.getByRole('searchbox', { name: 'Search Pokemon' });
      await user.tab();
      await user.tab();
      expect(screen.getByRole('button', { name: 'Clear search' })).toHaveFocus();

      await user.keyboard(key);

      expect(input).toHaveValue('');
      expect(input).toHaveFocus();
      expect(handleChange).toHaveBeenCalledWith('');

      // The user can keep typing without tabbing back to the input.
      await user.keyboard('pika');
      expect(input).toHaveValue('pika');
    }
  );

  it('does not move focus when the value is cleared externally', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { rerender } = render(
      <>
        <SearchBar value="pikachu" onChange={handleChange} placeholder="Search Pokemon" />
        <button type="button">Outside control</button>
      </>
    );

    const outsideControl = screen.getByRole('button', { name: 'Outside control' });
    await user.click(outsideControl);
    expect(outsideControl).toHaveFocus();

    rerender(
      <>
        <SearchBar value="" onChange={handleChange} placeholder="Search Pokemon" />
        <button type="button">Outside control</button>
      </>
    );

    expect(screen.getByRole('searchbox', { name: 'Search Pokemon' })).not.toHaveFocus();
    expect(outsideControl).toHaveFocus();
  });

  it('debounces typing and notifies onChange once after the delay', () => {
    vi.useFakeTimers();

    try {
      const handleChange = vi.fn();
      render(<SearchBar value="" onChange={handleChange} placeholder="Search Pokemon" />);

      const input = screen.getByRole('searchbox', { name: 'Search Pokemon' });

      fireEvent.change(input, { target: { value: 'p' } });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      fireEvent.change(input, { target: { value: 'pika' } });
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(handleChange).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith('pika');
    } finally {
      vi.useRealTimers();
    }
  });
});
