import { useWalkthrough } from '../../context/WalkthroughContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import Button from '../base/Button';
import Modal from '../base/Modal';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalkthroughModal({ isOpen, onClose }: WalkthroughModalProps) {
  const {
    progress,
    startTour,
    isTourCompleted,
    isTourAvailable,
    getCompletedToursCount,
    getTotalToursCount,
    resetAll,
    markFirstVisitComplete,
  } = useWalkthrough();

  const theme = usePokemonStore((s) => s.theme);
  const isDark = theme === 'dark';
  const completed = getCompletedToursCount();
  const total = getTotalToursCount();
  const percentage = Math.round((completed / total) * 100);
  const isWelcome = progress.isFirstVisit && !progress.hasSkippedOnboarding;

  const handleStartTour = (tourId: string) => {
    onClose();
    startTour(tourId);
  };

  const handleSkip = () => {
    markFirstVisitComplete();
    onClose();
  };

  const handleDontShowAgain = () => {
    markFirstVisitComplete();
    onClose();
  };

  const handleReset = () => {
    if (confirm('Reset all tour progress? This cannot be undone.')) {
      resetAll();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isWelcome ? 'Welcome to Advanced Pokédex!' : 'Walkthrough Tours'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Welcome message */}
        {isWelcome && (
          <div
            className={`p-4 rounded-lg ${
              isDark ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-primary-50 border border-primary-100'
            }`}
          >
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Welcome to the ultimate Pokédex experience! This app is packed with features to help you explore,
              build teams, calculate battles, and play games. Take a quick tour to discover everything, or
              explore on your own and come back anytime.
            </p>
          </div>
        )}

        {/* Progress overview */}
        {!isWelcome && (
          <div className="flex items-center gap-4">
            <div
              className={`flex-1 h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
            >
              <div
                className="h-full bg-primary-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {completed}/{total} completed
            </span>
          </div>
        )}

        {/* Tour list */}
        <div className="space-y-3">
          <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Available Tours
          </h3>

          {/* We'll get tours from context */}
          <TourList onStartTour={handleStartTour} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            {isWelcome ? (
              <>
                <Button variant="secondary" onClick={handleSkip}>
                  Skip for Now
                </Button>
                <Button variant="ghost" onClick={handleDontShowAgain}>
                  Don&apos;t Show Again
                </Button>
              </>
            ) : (
              <>
                {!progress.isFirstVisit && (
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Reset All
                  </Button>
                )}
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            You can always access tours from the menu
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Inner component to access tours from context
function TourList({ onStartTour }: { onStartTour: (tourId: string) => void }) {
  const { progress } = useWalkthrough();
  const walkthrough = useWalkthrough();
  const theme = usePokemonStore((s) => s.theme);
  const isDark = theme === 'dark';

  // Get tours from the provider - we need to access them somehow
  // For now, we'll use a simplified approach
  const tours = getTourList();

  return (
    <div className="grid gap-3">
      {tours.map((tour) => {
        const isCompleted = walkthrough.isTourCompleted(tour.id);
        const isAvailable = walkthrough.isTourAvailable(tour.id);
        const isLocked = !isAvailable && !isCompleted;

        return (
          <div
            key={tour.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              isCompleted
                ? isDark
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-green-50 border-green-200'
                : isLocked
                  ? isDark
                    ? 'bg-slate-800/50 border-slate-700 opacity-60'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                  : isDark
                    ? 'bg-slate-800 border-slate-700 hover:border-primary-500/50'
                    : 'bg-white border-slate-200 hover:border-primary-300'
            }`}
          >
            <div className="text-2xl">{tour.icon}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold truncate">{tour.name}</h4>
                {isCompleted && (
                  <span className="text-green-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
                {isLocked && (
                  <span className="text-slate-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tour.description}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                ~{tour.estimatedTimeMinutes} min • {tour.steps} steps
              </p>
            </div>

            <Button
              variant={isCompleted ? 'ghost' : 'primary'}
              size="sm"
              onClick={() => onStartTour(tour.id)}
              disabled={isLocked}
            >
              {isCompleted ? 'Replay' : isLocked ? 'Locked' : 'Start'}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// Tour definitions - this will be replaced by actual data from context
function getTourList() {
  return [
    {
      id: 'welcome',
      name: 'Welcome & Navigation',
      description: 'Learn the basics: menu, search, themes, and quick access.',
      icon: '👋',
      estimatedTimeMinutes: 3,
      steps: 5,
    },
    {
      id: 'browsing',
      name: 'Browsing Pokémon',
      description: 'Search, filter, and explore detailed Pokémon information.',
      icon: '🔍',
      estimatedTimeMinutes: 5,
      steps: 7,
    },
    {
      id: 'team-builder',
      name: 'Team Builder',
      description: 'Build and analyze competitive teams with coverage tools.',
      icon: '🛠️',
      estimatedTimeMinutes: 6,
      steps: 7,
    },
    {
      id: 'calculators',
      name: 'Calculators',
      description: 'Master damage, stats, catch rates, and breeding odds.',
      icon: '🧮',
      estimatedTimeMinutes: 4,
      steps: 5,
    },
    {
      id: 'games',
      name: 'Games Hub',
      description: 'Play daily challenges and test your Pokémon knowledge.',
      icon: '🎮',
      estimatedTimeMinutes: 3,
      steps: 4,
    },
    {
      id: 'advanced',
      name: 'Advanced Features',
      description: 'Comparison tool, reference data, favorites, and data management.',
      icon: '⚡',
      estimatedTimeMinutes: 4,
      steps: 5,
    },
  ];
}
