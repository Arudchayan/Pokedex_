import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveTourTarget } from './tourTarget';

const THEME_TARGETS = '[data-tour="theme-toggle"], [data-tour="theme-mobile"]';

function mockRect(element: Element, width: number, height: number) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    toJSON: () => ({}),
  } as DOMRect);
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('resolveTourTarget', () => {
  it('skips a hidden desktop target and returns the visible mobile target', () => {
    document.body.innerHTML = `
      <div class="hidden md:flex" data-tour="theme-toggle"><button>Desktop theme</button></div>
      <div data-tour="theme-mobile"><button>Mobile theme</button></div>
    `;

    const desktop = document.querySelector('[data-tour="theme-toggle"]')!;
    const mobile = document.querySelector('[data-tour="theme-mobile"]')!;

    mockRect(desktop, 0, 0);
    mockRect(mobile, 280, 44);

    expect(resolveTourTarget(THEME_TARGETS)).toBe(mobile);
  });

  it('skips a non-zero match hidden with visibility: hidden', () => {
    document.body.innerHTML = `
      <div style="visibility: hidden" data-tour="theme-toggle"><button>Desktop theme</button></div>
      <div data-tour="theme-mobile"><button>Mobile theme</button></div>
    `;

    const desktop = document.querySelector('[data-tour="theme-toggle"]')!;
    const mobile = document.querySelector('[data-tour="theme-mobile"]')!;

    mockRect(desktop, 100, 40);
    mockRect(mobile, 280, 44);

    expect(resolveTourTarget(THEME_TARGETS)).toBe(mobile);
  });

  it('returns null when every matching target is hidden', () => {
    document.body.innerHTML = `
      <div class="hidden" data-tour="theme-toggle"><button>Desktop theme</button></div>
      <div class="hidden" data-tour="theme-mobile"><button>Mobile theme</button></div>
    `;

    document.querySelectorAll<HTMLElement>('[data-tour^="theme-"]').forEach((element) => {
      mockRect(element, 0, 0);
    });

    expect(resolveTourTarget(THEME_TARGETS)).toBeNull();
  });
});
