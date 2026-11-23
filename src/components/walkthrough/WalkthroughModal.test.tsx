import type { ReactNode } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AchievementProvider } from '../../context/AchievementContext';
import { ToastProvider } from '../../context/ToastContext';
import { WalkthroughProvider, useWalkthrough } from '../../context/WalkthroughContext';
import type { TourDefinition } from '../../context/WalkthroughContext';
import { ALL_TOURS } from '../../data/tours';
import WalkthroughModal from './WalkthroughModal';

const STORAGE_KEY = 'pokedex_walkthrough_v1';

function seedProgress(completedTours: string[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      isFirstVisit: false,
      completedTours,
      currentTourId: null,
      currentStepIndex: 0,
      hasSkippedOnboarding: true,
      lastVisitAt: 0,
      tourStartedAt: {},
    })
  );
}

function testTour(overrides: Partial<TourDefinition> & Pick<TourDefinition, 'id' | 'name'>) {
  return {
    description: `${overrides.name} description`,
    estimatedTimeMinutes: 1,
    icon: '🧪',
    steps: [
      {
        id: `${overrides.id}-step`,
        target: 'body',
        title: `${overrides.name} step`,
        content: 'Step content',
        position: 'center' as const,
      },
    ],
    ...overrides,
  } satisfies TourDefinition;
}

interface RenderModalOptions {
  tours?: TourDefinition[];
  completedTours?: string[];
  extra?: ReactNode;
}

function renderModal({ tours = ALL_TOURS, completedTours = [], extra }: RenderModalOptions = {}) {
  seedProgress(completedTours);

  return render(
    <ToastProvider>
      <AchievementProvider>
        <WalkthroughProvider tours={tours}>
          <WalkthroughModal isOpen onClose={vi.fn()} />
          {extra}
        </WalkthroughProvider>
      </AchievementProvider>
    </ToastProvider>
  );
}

function getTourCard(name: string): HTMLElement {
  const heading = screen.getByRole('heading', { name });
  const card = heading.closest('li');
  if (!(card instanceof HTMLElement)) throw new Error(`No tour card found for ${name}`);
  return card;
}

describe('WalkthroughModal locked tours', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the available Welcome tour actionable without a lock reason', () => {
    renderModal();

    const welcomeCard = getTourCard('Welcome & Navigation');
    const start = within(welcomeCard).getByRole('button', {
      name: 'Start Welcome & Navigation tour',
    });

    expect(welcomeCard).not.toHaveTextContent(/to unlock/i);
    expect(start).toBeEnabled();
  });

  it('names a single missing prerequisite and disables the locked control', () => {
    renderModal();

    const browsingCard = getTourCard('Browsing Pokémon');
    const locked = within(browsingCard).getByRole('button', { name: /Locked/ });

    expect(browsingCard).toHaveTextContent('Complete the Welcome & Navigation tour to unlock.');
    expect(browsingCard).toHaveTextContent('0 of 1 prerequisite complete.');
    expect(locked).toBeDisabled();
  });

  it('lists every missing prerequisite for a tour that requires two tours', () => {
    renderModal();

    const advancedCard = getTourCard('Advanced Features');
    const locked = within(advancedCard).getByRole('button', { name: /Locked/ });

    expect(advancedCard).toHaveTextContent(
      'Complete the Calculators and Games Hub tours to unlock.'
    );
    expect(advancedCard).toHaveTextContent('0 of 2 prerequisites complete.');
    expect(locked).toBeDisabled();
  });

  it('unlocks a tour and removes the reason once its prerequisite is completed', async () => {
    const user = userEvent.setup();
    let walkthrough: ReturnType<typeof useWalkthrough> | null = null;

    function CaptureWalkthrough() {
      walkthrough = useWalkthrough();
      return null;
    }

    renderModal({ extra: <CaptureWalkthrough /> });

    const startWelcome = within(getTourCard('Welcome & Navigation')).getByRole('button', {
      name: 'Start Welcome & Navigation tour',
    });
    expect(startWelcome).toBeEnabled();

    await user.click(startWelcome);
    if (!walkthrough) throw new Error('Walkthrough context was not captured');
    act(() => walkthrough?.completeTour());

    const browsingCard = getTourCard('Browsing Pokémon');
    const startBrowsing = within(browsingCard).getByRole('button', {
      name: 'Start Browsing Pokémon tour',
    });

    expect(startBrowsing).toBeEnabled();
    expect(browsingCard).not.toHaveTextContent(/to unlock/i);
  });

  it('includes the unlock reason in the locked control accessible name', () => {
    renderModal();

    const locked = within(getTourCard('Browsing Pokémon')).getByRole('button', {
      name: /Locked/,
    });

    expect(locked).toHaveAccessibleName(
      'Browsing Pokémon: Locked. Complete the Welcome & Navigation tour to unlock. 0 of 1 prerequisite complete.'
    );
    expect(locked).toBeDisabled();
  });

  it('falls back to a generic reason when a prerequisite tour is unknown', () => {
    const tours = [
      testTour({ id: 'welcome', name: 'Welcome' }),
      testTour({ id: 'mystery', name: 'Mystery Tour', requiredTours: ['missing-tour'] }),
    ];
    renderModal({ tours });

    const mysteryCard = getTourCard('Mystery Tour');

    expect(mysteryCard).toHaveTextContent('Complete the prerequisite tours to unlock.');
    expect(within(mysteryCard).getByRole('button', { name: /Locked/ })).toBeDisabled();
  });
});
