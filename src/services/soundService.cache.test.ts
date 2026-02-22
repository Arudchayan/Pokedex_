import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as soundService from './soundService';

describe('soundService cache', () => {
  beforeEach(() => {
    // Reset cache
    if (soundService.resetCache) soundService.resetCache();

    // Stub Audio
    vi.stubGlobal('Audio', class {
      volume = 1;
      currentTime = 0;
      play() { return Promise.resolve(); }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('limits cache size to 50', () => {
    const LIMIT = 50;

    // Play LIMIT + 20 unique sounds
    for (let i = 0; i < LIMIT + 20; i++) {
      soundService.playPokemonCry(i);
    }

    // Check cache size
    const size = soundService.getAudioCacheSize();

    expect(size).toBeLessThanOrEqual(LIMIT);
  });
});
