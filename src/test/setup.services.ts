import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock idb-keyval for service-layer tests. JSDOM does not provide IndexedDB,
// and these tests do not need a real persistent store.
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

// JSDOM's built-in Storage implementation can have non-configurable methods which
// prevents vi.spyOn from intercepting getItem/setItem in some environments.
// Provide a simple, spy-friendly storage for service-layer tests.
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
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});
