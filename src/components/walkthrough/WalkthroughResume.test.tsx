import { useState } from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { AchievementProvider } from '../../context/AchievementContext';
import { ToastProvider } from '../../context/ToastContext';
import { WalkthroughProvider, useWalkthrough } from '../../context/WalkthroughContext';
import type { TourDefinition, WalkthroughProgress } from '../../context/WalkthroughContext';
import WalkthroughModal from './WalkthroughModal';
import WalkthroughTooltip from './WalkthroughTooltip';

const STORAGE_KEY = 'pokedex_walkthrough_v1';

function makeTour(
  id: string,
  name: string,
  stepTitles: string[],
  overrides: Partial<TourDefinition> = {}
): TourDefinition {
  return {
    id,
    name,
    description: `${name} description`,
    estimatedTimeMinutes: 1,
    icon: '🧪',
    steps: stepTitles.map((title, index) => ({
      id: `${id}-step-${index + 1}`,
      target: 'body',
      title,
      content: `Step ${index + 1} content`,
      position: 'center' as const,
    })),
    ...overrides,
  };
}

const WELCOME_TOUR = makeTour('welcome', 'Welcome & Navigation', [
  'Welcome intro',
  'Main Menu',
  'Quick Search',
  'Personalization',
  'Final step',
]);

const BROWSING_TOUR = makeTour(
  'browsing',
  'Browsing Pokémon',
  ['Pokémon Grid', 'Filters', 'Details'],
  { requiredTours: ['welcome'] }
);

const TEST_TOURS = [WELCOME_TOUR, BROWSING_TOUR];

interface SeedOptions {
  completedTours?: string[];
  currentTourId?: string | null;
  currentStepIndex?: number;
}

function seedProgress({
  completedTours = [],
  currentTourId = null,
  currentStepIndex = 0,
}: SeedOptions = {}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      isFirstVisit: false,
      completedTours,
      currentTourId,
      currentStepIndex,
      hasSkippedOnboarding: true,
      lastVisitAt: 0,
      tourStartedAt: currentTourId ? { [currentTourId]: 123 } : {},
    })
  );
}

function readStoredProgress(): WalkthroughProgress | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as WalkthroughProgress) : null;
}

function TourOverlay() {
  const { isActive, currentStep, currentStepIndex, totalSteps, nextStep, prevStep, skipTour } =
    useWalkthrough();

  if (!isActive || !currentStep) return null;

  return (
    <WalkthroughTooltip
      step={currentStep}
      stepIndex={currentStepIndex}
      totalSteps={totalSteps}
      onNext={nextStep}
      onPrev={prevStep}
      onSkip={skipTour}
    />
  );
}

function Launcher() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <WalkthroughModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <TourOverlay />
    </>
  );
}

function renderWalkthrough(tours: TourDefinition[] = TEST_TOURS) {
  return render(
    <ToastProvider>
      <AchievementProvider>
        <WalkthroughProvider tours={tours}>
          <Launcher />
        </WalkthroughProvider>
      </AchievementProvider>
    </ToastProvider>
  );
}

function renderSeededWalkthrough(options: SeedOptions = {}) {
  seedProgress(options);
  return renderWalkthrough();
}

function getTourCard(name: string): HTMLElement {
  const heading = screen.getByRole('heading', { name });
  const card = heading.closest('li');
  if (!(card instanceof HTMLElement)) throw new Error(`No tour card found for ${name}`);
  return card;
}

function getResumeButton() {
  return within(getTourCard('Welcome & Navigation')).queryByRole('button', {
    name: /Resume Welcome & Navigation tour/,
  });
}

describe('Walkthrough resume', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('offers Resume with the saved step while keeping a Restart action', () => {
    renderSeededWalkthrough({ currentTourId: 'welcome', currentStepIndex: 2 });

    const card = getTourCard('Welcome & Navigation');

    expect(
      within(card).getByRole('button', {
        name: 'Resume Welcome & Navigation tour at step 3 of 5',
      })
    ).toBeEnabled();
    expect(
      within(card).getByRole('button', {
        name: 'Restart Welcome & Navigation tour from step 1',
      })
    ).toBeEnabled();
    expect(card).toHaveTextContent('Paused at step 3 of 5');
  });

  it('resumes at the saved step instead of restarting at step 1', async () => {
    const user = userEvent.setup();
    renderSeededWalkthrough({ currentTourId: 'welcome', currentStepIndex: 2 });

    await user.click(
      screen.getByRole('button', {
        name: 'Resume Welcome & Navigation tour at step 3 of 5',
      })
    );

    expect(screen.getByText('Tour 3 of 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Quick Search' })).toBeInTheDocument();
    expect(screen.queryByText('Tour 1 of 5')).not.toBeInTheDocument();
    await waitFor(() => {
      const stored = readStoredProgress();
      expect(stored?.currentTourId).toBe('welcome');
      expect(stored?.currentStepIndex).toBe(2);
      expect(stored?.tourStartedAt.welcome).toBe(123);
    });
  });

  it('restarts at step 1 and resets the saved index', async () => {
    const user = userEvent.setup();
    renderSeededWalkthrough({ currentTourId: 'welcome', currentStepIndex: 2 });

    await user.click(
      screen.getByRole('button', {
        name: 'Restart Welcome & Navigation tour from step 1',
      })
    );

    expect(screen.getByText('Tour 1 of 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome intro' })).toBeInTheDocument();
    await waitFor(() => {
      const stored = readStoredProgress();
      expect(stored?.currentTourId).toBe('welcome');
      expect(stored?.currentStepIndex).toBe(0);
    });
  });

  it('clears the saved position on completion and offers no Resume after reload', async () => {
    const user = userEvent.setup();
    renderSeededWalkthrough({ currentTourId: 'welcome', currentStepIndex: 4 });

    await user.click(
      screen.getByRole('button', {
        name: 'Resume Welcome & Navigation tour at step 5 of 5',
      })
    );
    expect(screen.getByText('Tour 5 of 5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Finish' }));

    await waitFor(() => {
      const stored = readStoredProgress();
      expect(stored?.currentTourId).toBeNull();
      expect(stored?.currentStepIndex).toBe(0);
      expect(stored?.completedTours).toContain('welcome');
    });

    cleanup();
    renderWalkthrough();

    const card = getTourCard('Welcome & Navigation');
    expect(
      within(card).getByRole('button', { name: 'Replay Welcome & Navigation tour' })
    ).toBeEnabled();
    expect(getResumeButton()).not.toBeInTheDocument();
    expect(card).not.toHaveTextContent('Paused at step');
  });

  it('keeps the interrupted position when the tour is skipped', async () => {
    const user = userEvent.setup();
    renderSeededWalkthrough({ currentTourId: 'welcome', currentStepIndex: 2 });

    await user.click(
      screen.getByRole('button', {
        name: 'Resume Welcome & Navigation tour at step 3 of 5',
      })
    );
    await user.click(screen.getByRole('button', { name: 'Skip tour' }));

    expect(screen.queryByText('Tour 3 of 5')).not.toBeInTheDocument();
    await waitFor(() => {
      const stored = readStoredProgress();
      expect(stored?.currentTourId).toBe('welcome');
      expect(stored?.currentStepIndex).toBe(2);
    });

    cleanup();
    renderWalkthrough();

    expect(
      screen.getByRole('button', {
        name: 'Resume Welcome & Navigation tour at step 3 of 5',
      })
    ).toBeEnabled();
  });

  it.each([
    { label: 'an unknown tour id', currentTourId: 'removed-tour', currentStepIndex: 2 },
    { label: 'a step past the end', currentTourId: 'welcome', currentStepIndex: 99 },
    { label: 'a negative step', currentTourId: 'welcome', currentStepIndex: -1 },
  ])(
    'falls back to Start and clears progress saved with $label',
    async ({ currentStepIndex, currentTourId }) => {
      renderSeededWalkthrough({ currentTourId, currentStepIndex });

      const card = getTourCard('Welcome & Navigation');
      expect(
        within(card).getByRole('button', { name: 'Start Welcome & Navigation tour' })
      ).toBeEnabled();
      expect(getResumeButton()).not.toBeInTheDocument();
      expect(card).not.toHaveTextContent('Paused at step');

      await waitFor(() => {
        const stored = readStoredProgress();
        expect(stored?.currentTourId).toBeNull();
        expect(stored?.currentStepIndex).toBe(0);
      });
    }
  );

  it('does not resume a completed tour', async () => {
    renderSeededWalkthrough({
      completedTours: ['welcome'],
      currentTourId: 'welcome',
      currentStepIndex: 2,
    });

    const card = getTourCard('Welcome & Navigation');
    expect(
      within(card).getByRole('button', { name: 'Replay Welcome & Navigation tour' })
    ).toBeEnabled();
    expect(getResumeButton()).not.toBeInTheDocument();

    await waitFor(() => {
      expect(readStoredProgress()?.currentTourId).toBeNull();
    });
  });

  it('cannot resume a locked tour', () => {
    renderSeededWalkthrough({ currentTourId: 'browsing', currentStepIndex: 2 });

    const card = getTourCard('Browsing Pokémon');
    expect(within(card).queryByRole('button', { name: /Resume/ })).not.toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /Locked/ })).toBeDisabled();
    expect(card).toHaveTextContent('Complete the Welcome & Navigation tour to unlock.');
  });
});
