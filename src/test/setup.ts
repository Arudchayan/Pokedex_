import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// JSDOM does not implement window.matchMedia; provide a stub for hooks like usePrefersReducedMotion.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// JSDOM does not implement window.scrollTo; provide a stub to avoid noisy warnings.
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

// JSDOM prints "Not implemented: navigation to another Document" for programmatic
// <a>.click() navigation (commonly used for downloads). In the app we only use
// this for file downloads, so in tests we no-op those clicks to keep output clean.
const originalAnchorClick = HTMLAnchorElement.prototype.click;
Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
  configurable: true,
  writable: true,
  value: function click() {
    const anchor = this as HTMLAnchorElement;
    const href = typeof anchor.href === 'string' ? anchor.href : '';
    const isDownload = typeof anchor.download === 'string' && anchor.download.length > 0;
    if (isDownload || href.startsWith('blob:')) return;
    return originalAnchorClick.call(anchor);
  },
});

// Mock idb-keyval
vi.mock('idb-keyval', () => {
  const store = new Map();
  return {
    get: vi.fn((key) => Promise.resolve(store.get(key))),
    set: vi.fn((key, val) => {
      store.set(key, val);
      return Promise.resolve();
    }),
    del: vi.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
  };
});

// Mock LocalStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Audio
class AudioMock {
    volume: number = 1;
    currentTime: number = 0;

    constructor(public src: string) {}

    play() {
        return Promise.resolve();
    }

    pause() {}
}

Object.defineProperty(window, 'Audio', {
    value: AudioMock
});

// Mock Web Audio API for SoundService
class AudioContextMock {
    currentTime = 0;
    createOscillator() {
        return {
            connect: () => {},
            start: () => {},
            stop: () => {},
            frequency: { value: 0, exponentialRampToValueAtTime: () => {} },
            type: 'sine',
        };
    }
    createGain() {
        return {
            connect: () => {},
            gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        };
    }
}

Object.defineProperty(window, 'AudioContext', {
    value: AudioContextMock,
    writable: true,
    configurable: true
});
Object.defineProperty(window, 'webkitAudioContext', {
    value: AudioContextMock,
    writable: true,
    configurable: true
});
