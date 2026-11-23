import { describe, expect, it } from 'vitest';
import { ALL_TOURS } from './tours';

describe('welcome tour', () => {
  it('targets both the desktop and mobile theme controls', () => {
    const welcome = ALL_TOURS.find((tour) => tour.id === 'welcome');
    const personalization = welcome?.steps.find((step) => step.id === 'theme-toggle');

    expect(personalization?.target).toBe('[data-tour="theme-toggle"], [data-tour="theme-mobile"]');
    expect(personalization?.onBeforeStep).toBeTypeOf('function');
  });
});
