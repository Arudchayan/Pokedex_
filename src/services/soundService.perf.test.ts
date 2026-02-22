import { describe, it, expect, vi, afterEach } from 'vitest';
import { playUISound } from './soundService';

describe('soundService performance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('instantiates AudioContext only once (singleton)', () => {
    // Get the original mock from the setup
    const OriginalAudioContext = window.AudioContext;

    // Create a spy function
    const constructorSpy = vi.fn();

    // Create a wrapper class that extends the original mock (or just behaves like it)
    // Since we know the implementation of the mock in setup.ts is simple,
    // we can just make a new class that calls the spy.
    class SpiedAudioContext {
      constructor() {
        constructorSpy();
        // Return a minimal mock that satisfies playUISound
        return new OriginalAudioContext();
      }
    }

    // Stub window.AudioContext and window.webkitAudioContext
    vi.stubGlobal('AudioContext', SpiedAudioContext);
    (window as any).webkitAudioContext = SpiedAudioContext;

    // Call the function multiple times
    playUISound('click');
    playUISound('success');
    playUISound('error');

    // Assert that the constructor was called 1 time (singleton)
    expect(constructorSpy).toHaveBeenCalledTimes(1);
  });
});
