import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as soundService from './soundService';

describe('soundService LRU cache', () => {
  beforeEach(() => {
    // Reset cache to ensure isolation
    soundService.resetCache();

    // Stub Audio
    vi.stubGlobal('Audio', class {
      volume = 1;
      currentTime = 0;
      play() { return Promise.resolve(); }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('evicts the least recently used item, not just the oldest inserted', () => {
    const LIMIT = 50;
    // We don't need a large offset anymore since we reset the cache,
    // but keeping it doesn't hurt.
    const OFFSET = 0;

    // 1. Fill the cache
    for (let i = 0; i < LIMIT; i++) {
      soundService.playPokemonCry(OFFSET + i);
    }

    // 2. Access the first inserted item (making it most recently used)
    soundService.playPokemonCry(OFFSET + 0);

    // 3. Add one more item to force eviction
    soundService.playPokemonCry(OFFSET + LIMIT);

    // 4. Verify item 0 is still in cache (LRU)
    // Let's spy on the Audio constructor
    const audioConstructorSpy = vi.fn();
    class MockAudio {
      volume = 1;
      currentTime = 0;
      constructor(src: string) {
        audioConstructorSpy(src);
      }
      play() { return Promise.resolve(); }
    }
    vi.stubGlobal('Audio', MockAudio);

    // Re-access item 0.
    // If it was evicted, the constructor will be called.
    // If it is in cache, the constructor will NOT be called.
    soundService.playPokemonCry(OFFSET + 0);

    expect(audioConstructorSpy).not.toHaveBeenCalled();
  });
});
