import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePokemonStoreEffects } from '../../hooks/usePokemonStoreEffects';
import { usePokemonStore } from '../../store/usePokemonStore';
import { act } from 'react';

// Mock Worker
class WorkerMock {
  onmessage: ((event: MessageEvent) => void) | null = null;

  postMessage(data: any) {
    // Simulate worker processing: return filtered IDs
    // For this test, we assume masterPokemonList has items with IDs 1, 2, 3
    // And we return ID 1 as result

    const response = {
      filteredIds: [1], // Return ID 1 (Bulbasaur)
      requestId: data.requestId,
    };

    // Simulate async response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: response } as MessageEvent);
      }
    }, 10);
  }

  terminate() {}
}

describe('usePokemonStoreEffects with Worker', () => {
  const originalWorker = window.Worker;

  beforeEach(() => {
    // @ts-ignore
    window.Worker = WorkerMock;
    usePokemonStore.setState({
      masterPokemonList: [],
      filteredPokemon: [],
      isFiltering: false,
    });
  });

  afterEach(() => {
    window.Worker = originalWorker;
  });

  it('should process worker response and map IDs to objects', async () => {
    // Setup initial store state
    const mockPokemon = [
      { id: 1, name: 'Bulbasaur', types: ['grass'] },
      { id: 2, name: 'Ivysaur', types: ['grass'] },
      { id: 3, name: 'Venusaur', types: ['grass'] },
    ] as any[];

    usePokemonStore.setState({ masterPokemonList: mockPokemon });

    // Render the hook
    const { unmount } = renderHook(() => usePokemonStoreEffects());

    // Trigger a filter update (e.g. change search term)
    act(() => {
      usePokemonStore.getState().setSearchTerm('Bulba');
    });

    // Wait for filteredPokemon to be updated
    await waitFor(() => {
      const filtered = usePokemonStore.getState().filteredPokemon;
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(1);
      expect(filtered[0].name).toBe('Bulbasaur');
    });

    unmount();
  });
});
