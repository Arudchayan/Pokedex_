import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { useToast } from './ToastContext';
import { useAchievements } from './AchievementContext';
import { logger } from '../utils/logger';

export interface TourStep {
  id: string;
  target: string;
  title: string;
  content: ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  allowInteraction?: boolean;
  showNextButton?: boolean;
  showPrevButton?: boolean;
  onBeforeStep?: () => void | Promise<void>;
  onAfterStep?: () => void | Promise<void>;
}

export interface TourDefinition {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  estimatedTimeMinutes: number;
  icon: string;
  requiredTours?: string[];
}

export interface WalkthroughProgress {
  isFirstVisit: boolean;
  completedTours: string[];
  currentTourId: string | null;
  currentStepIndex: number;
  hasSkippedOnboarding: boolean;
  lastVisitAt: number;
  tourStartedAt: Record<string, number>;
}

export interface ResumableTour {
  tour: TourDefinition;
  stepIndex: number;
}

interface WalkthroughContextType {
  // State
  isActive: boolean;
  currentTour: TourDefinition | null;
  currentStep: TourStep | null;
  currentStepIndex: number;
  totalSteps: number;
  progress: WalkthroughProgress;
  tours: TourDefinition[];
  /** Saved, unfinished tour that can be picked up where it left off. */
  resumableTour: ResumableTour | null;

  // Actions
  startTour: (tourId: string) => void;
  resumeTour: () => boolean;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: (tourId: string) => void;
  resetAll: () => void;
  markFirstVisitComplete: () => void;
  reopenWelcome: () => void;

  // Queries
  isTourCompleted: (tourId: string) => boolean;
  isTourAvailable: (tourId: string) => boolean;
  getCompletedStepsCount: () => number;
  getTotalToursCount: () => number;
  getCompletedToursCount: () => number;
}

const STORAGE_KEY = 'pokedex_walkthrough_v1';

const defaultProgress: WalkthroughProgress = {
  isFirstVisit: true,
  completedTours: [],
  currentTourId: null,
  currentStepIndex: 0,
  hasSkippedOnboarding: false,
  lastVisitAt: Date.now(),
  tourStartedAt: {},
};

function loadProgress(): WalkthroughProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultProgress, ...parsed };
    }
  } catch (e) {
    logger.error('Failed to load walkthrough progress', e);
  }
  return defaultProgress;
}

function saveProgress(progress: WalkthroughProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    logger.error('Failed to save walkthrough progress', e);
  }
}

function isTourUnlocked(
  tour: Pick<TourDefinition, 'requiredTours'>,
  completedTours: readonly string[]
): boolean {
  return (tour.requiredTours ?? []).every((id) => completedTours.includes(id));
}

/**
 * Drops a saved tour position that can no longer be resumed: unknown tour,
 * already completed, locked, or an index outside the tour's steps. Without
 * this, stale storage would silently look like paused progress forever.
 */
function normalizeProgress(
  progress: WalkthroughProgress,
  tours: readonly TourDefinition[]
): WalkthroughProgress {
  const cleared: WalkthroughProgress = {
    ...progress,
    currentTourId: null,
    currentStepIndex: 0,
  };

  if (!progress.currentTourId) {
    return progress.currentStepIndex === 0 ? progress : cleared;
  }

  const tour = tours.find((candidate) => candidate.id === progress.currentTourId);
  if (!tour) return cleared;
  if (progress.completedTours.includes(tour.id)) return cleared;
  if (!isTourUnlocked(tour, progress.completedTours)) return cleared;

  const stepIndex = progress.currentStepIndex;
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= tour.steps.length) {
    return cleared;
  }

  return progress;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export const WalkthroughProvider: React.FC<{ children: ReactNode; tours: TourDefinition[] }> = ({
  children,
  tours,
}) => {
  const { addToast } = useToast();
  const { unlockAchievement } = useAchievements();

  const [progress, setProgress] = useState<WalkthroughProgress>(() =>
    normalizeProgress(loadProgress(), tours)
  );
  const [isActive, setIsActive] = useState(false);

  // Persist progress whenever it changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Update last visit time
  useEffect(() => {
    setProgress((prev) => ({ ...prev, lastVisitAt: Date.now() }));
  }, []);

  const currentTour = useMemo(() => {
    if (!progress.currentTourId) return null;
    return tours.find((t) => t.id === progress.currentTourId) || null;
  }, [progress.currentTourId, tours]);

  const currentStep = useMemo(() => {
    if (!currentTour) return null;
    return currentTour.steps[progress.currentStepIndex] || null;
  }, [currentTour, progress.currentStepIndex]);

  const totalSteps = currentTour?.steps.length || 0;

  const isTourCompleted = useCallback(
    (tourId: string) => progress.completedTours.includes(tourId),
    [progress.completedTours]
  );

  const isTourAvailable = useCallback(
    (tourId: string) => {
      const tour = tours.find((t) => t.id === tourId);
      return tour ? isTourUnlocked(tour, progress.completedTours) : false;
    },
    [tours, progress.completedTours]
  );

  const resumableTour = useMemo<ResumableTour | null>(() => {
    if (!currentTour) return null;
    if (isTourCompleted(currentTour.id) || !isTourAvailable(currentTour.id)) return null;

    const stepIndex = progress.currentStepIndex;
    if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= currentTour.steps.length) {
      return null;
    }

    return { tour: currentTour, stepIndex };
  }, [currentTour, isTourCompleted, isTourAvailable, progress.currentStepIndex]);

  const getCompletedStepsCount = useCallback(() => {
    return tours.reduce((count, tour) => {
      if (progress.completedTours.includes(tour.id)) {
        return count + tour.steps.length;
      }
      return count;
    }, 0);
  }, [tours, progress.completedTours]);

  const getTotalToursCount = useCallback(() => tours.length, [tours]);

  const getCompletedToursCount = useCallback(
    () => progress.completedTours.length,
    [progress.completedTours]
  );

  const startTour = useCallback(
    (tourId: string) => {
      const tour = tours.find((t) => t.id === tourId);
      if (!tour) {
        logger.error(`Tour not found: ${tourId}`);
        return;
      }

      if (!isTourAvailable(tourId)) {
        addToast('Complete previous tours first!', 'warning');
        return;
      }

      setProgress((prev) => ({
        ...prev,
        currentTourId: tourId,
        currentStepIndex: 0,
        tourStartedAt: { ...prev.tourStartedAt, [tourId]: Date.now() },
      }));
      setIsActive(true);

      // Execute onBeforeStep for first step
      const firstStep = tour.steps[0];
      if (firstStep?.onBeforeStep) {
        firstStep.onBeforeStep();
      }
    },
    [tours, isTourAvailable, addToast]
  );

  const resumeTour = useCallback((): boolean => {
    if (!resumableTour) return false;

    const { tour, stepIndex } = resumableTour;
    setProgress((prev) => ({
      ...prev,
      currentTourId: tour.id,
      currentStepIndex: stepIndex,
      tourStartedAt: {
        ...prev.tourStartedAt,
        [tour.id]: prev.tourStartedAt[tour.id] ?? Date.now(),
      },
    }));
    setIsActive(true);

    // Re-run the saved step's setup so targets like the mobile menu are open.
    const step = tour.steps[stepIndex];
    if (step?.onBeforeStep) {
      step.onBeforeStep();
    }

    return true;
  }, [resumableTour]);

  const nextStep = useCallback(async () => {
    if (!currentTour || !currentStep) return;

    // Execute onAfterStep for current step
    if (currentStep.onAfterStep) {
      await currentStep.onAfterStep();
    }

    const nextIndex = progress.currentStepIndex + 1;

    if (nextIndex >= currentTour.steps.length) {
      // Tour complete
      completeTour();
    } else {
      setProgress((prev) => ({ ...prev, currentStepIndex: nextIndex }));

      // Execute onBeforeStep for next step
      const nextStep = currentTour.steps[nextIndex];
      if (nextStep?.onBeforeStep) {
        await nextStep.onBeforeStep();
      }
    }
  }, [currentTour, currentStep, progress.currentStepIndex]);

  const prevStep = useCallback(async () => {
    if (!currentTour || progress.currentStepIndex <= 0) return;

    // Execute onAfterStep for current step
    if (currentStep?.onAfterStep) {
      await currentStep.onAfterStep();
    }

    const prevIndex = progress.currentStepIndex - 1;
    setProgress((prev) => ({ ...prev, currentStepIndex: prevIndex }));

    // Execute onBeforeStep for previous step
    const prevStepDef = currentTour.steps[prevIndex];
    if (prevStepDef?.onBeforeStep) {
      await prevStepDef.onBeforeStep();
    }
  }, [currentTour, currentStep, progress.currentStepIndex]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setProgress((prev) => ({ ...prev, hasSkippedOnboarding: true }));
    addToast('Tour paused. Resume anytime from the Walkthrough launcher.', 'info');
  }, [addToast]);

  const completeTour = useCallback(() => {
    if (!currentTour) return;

    const wasAlreadyCompleted = progress.completedTours.includes(currentTour.id);

    setProgress((prev) => {
      const newCompleted = prev.completedTours.includes(currentTour.id)
        ? prev.completedTours
        : [...prev.completedTours, currentTour.id];

      return {
        ...prev,
        completedTours: newCompleted,
        currentTourId: null,
        currentStepIndex: 0,
      };
    });

    setIsActive(false);

    if (!wasAlreadyCompleted) {
      addToast(`Completed: ${currentTour.name}!`, 'success');

      // Check if all tours completed
      const allTours = tours.map((t) => t.id);
      const completedCount = progress.completedTours.length + 1; // +1 for the one just completed
      if (completedCount >= allTours.length) {
        unlockAchievement('tour_graduate');
      }
    }
  }, [currentTour, progress.completedTours, tours, addToast, unlockAchievement]);

  const resetTour = useCallback(
    (tourId: string) => {
      setProgress((prev) => ({
        ...prev,
        completedTours: prev.completedTours.filter((id) => id !== tourId),
      }));
      addToast(`Tour "${tourId}" reset. You can start it again.`, 'info');
    },
    [addToast]
  );

  const resetAll = useCallback(() => {
    setProgress(defaultProgress);
    setIsActive(false);
    addToast('All tours reset. Welcome mode re-enabled.', 'info');
  }, [addToast]);

  const markFirstVisitComplete = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      isFirstVisit: false,
      hasSkippedOnboarding: true,
    }));
  }, []);

  const reopenWelcome = useCallback(() => {
    setProgress((prev) => ({ ...prev, isFirstVisit: true, hasSkippedOnboarding: false }));
  }, []);

  const value = useMemo(
    () => ({
      isActive,
      currentTour,
      currentStep,
      currentStepIndex: progress.currentStepIndex,
      totalSteps,
      progress,
      tours,
      resumableTour,
      startTour,
      resumeTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      resetTour,
      resetAll,
      markFirstVisitComplete,
      reopenWelcome,
      isTourCompleted,
      isTourAvailable,
      getCompletedStepsCount,
      getTotalToursCount,
      getCompletedToursCount,
    }),
    [
      isActive,
      currentTour,
      currentStep,
      progress,
      totalSteps,
      tours,
      resumableTour,
      startTour,
      resumeTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      resetTour,
      resetAll,
      markFirstVisitComplete,
      reopenWelcome,
      isTourCompleted,
      isTourAvailable,
      getCompletedStepsCount,
      getTotalToursCount,
      getCompletedToursCount,
    ]
  );

  return <WalkthroughContext.Provider value={value}>{children}</WalkthroughContext.Provider>;
};

export const useWalkthrough = () => {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
};

export const useWalkthroughSafe = () => {
  return useContext(WalkthroughContext);
};
