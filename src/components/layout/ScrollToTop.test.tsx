import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScrollToTop from './ScrollToTop';

// Mock the context
vi.mock('../context/PokemonContext', () => ({
  usePokemon: () => ({
    theme: 'light',
  }),
}));

describe('ScrollToTop', () => {
  beforeEach(() => {
    // Reset window scroll
    window.scrollY = 0;
    // Mock scrollTo
    window.scrollTo = vi.fn();
  });

  it('is hidden initially', () => {
    const { queryByRole } = render(<ScrollToTop />);
    expect(queryByRole('button')).toBeNull();
  });

  it('becomes visible after scrolling down', () => {
    const { queryByRole } = render(<ScrollToTop />);

    act(() => {
      window.scrollY = 400;
      window.dispatchEvent(new Event('scroll'));
    });

    const button = queryByRole('button');
    expect(button).not.toBeNull();
  });

  it('scrolls to top when clicked', () => {
    const { queryByRole } = render(<ScrollToTop />);

    act(() => {
      window.scrollY = 400;
      window.dispatchEvent(new Event('scroll'));
    });

    const button = queryByRole('button');
    if (button) {
      fireEvent.click(button);
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    } else {
        throw new Error('Button should be visible');
    }
  });

  it('hides when scrolling back up', () => {
    const { queryByRole } = render(<ScrollToTop />);

    act(() => {
      window.scrollY = 400;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(queryByRole('button')).not.toBeNull();

    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(queryByRole('button')).toBeNull();
  });
});
