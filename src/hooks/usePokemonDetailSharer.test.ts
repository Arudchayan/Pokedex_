import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePokemonDetailSharer } from './usePokemonDetailSharer';

describe('usePokemonDetailSharer', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Replace location with a mutable stub
    // @ts-expect-error — stub location for URL sync tests
    delete window.location;
    // @ts-expect-error — stub location for URL sync tests
    window.location = {
      ...originalLocation,
      pathname: '/',
      search: '',
      href: 'http://localhost/',
    };
    vi.spyOn(window.history, 'replaceState').mockImplementation((_state, _title, url) => {
      const next = String(url ?? '');
      const qIndex = next.indexOf('?');
      window.location.search = qIndex >= 0 ? next.slice(qIndex) : '';
      window.location.pathname = qIndex >= 0 ? next.slice(0, qIndex) : next || '/';
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error — restore real location
    window.location = originalLocation;
  });

  it('hydrates selection from ?pokemon= on mount', () => {
    window.location.search = '?pokemon=25';
    const onSelect = vi.fn();

    renderHook(() =>
      usePokemonDetailSharer({ selectedPokemonId: null, onSelect })
    );

    expect(onSelect).toHaveBeenCalledWith(25);
  });

  it('ignores invalid pokemon query values', () => {
    window.location.search = '?pokemon=abc';
    const onSelect = vi.fn();

    renderHook(() =>
      usePokemonDetailSharer({ selectedPokemonId: null, onSelect })
    );

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('writes ?pokemon= when selection changes after hydrate', () => {
    window.location.search = '';
    const onSelect = vi.fn();

    const { rerender } = renderHook(
      ({ selectedPokemonId }) => usePokemonDetailSharer({ selectedPokemonId, onSelect }),
      { initialProps: { selectedPokemonId: null as number | null } }
    );

    act(() => {
      rerender({ selectedPokemonId: 6 });
    });

    expect(window.history.replaceState).toHaveBeenCalled();
    expect(window.location.search).toContain('pokemon=6');
  });

  it('removes pokemon param when detail closes', () => {
    window.location.search = '?pokemon=6&compare=1';
    const onSelect = vi.fn();

    const { rerender } = renderHook(
      ({ selectedPokemonId }) => usePokemonDetailSharer({ selectedPokemonId, onSelect }),
      { initialProps: { selectedPokemonId: 6 as number | null } }
    );

    act(() => {
      rerender({ selectedPokemonId: null });
    });

    expect(window.location.search).not.toContain('pokemon=');
    expect(window.location.search).toContain('compare=1');
  });
});
