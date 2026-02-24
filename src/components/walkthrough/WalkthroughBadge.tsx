import { useWalkthroughSafe } from '../../context/WalkthroughContext';
import { usePokemonStore } from '../../store/usePokemonStore';

interface WalkthroughBadgeProps {
  onClick?: () => void;
}

export default function WalkthroughBadge({ onClick }: WalkthroughBadgeProps) {
  const walkthrough = useWalkthroughSafe();
  const theme = usePokemonStore((s) => s.theme);
  const isDark = theme === 'dark';

  if (!walkthrough) return null;

  const { progress, getCompletedToursCount, getTotalToursCount, isActive } = walkthrough;
  const completed = getCompletedToursCount();
  const total = getTotalToursCount();
  const hasIncomplete = completed < total;

  // Don't show if first visit (welcome modal handles that)
  // Don't show if all tours completed
  if (progress.isFirstVisit || !hasIncomplete || isActive) return null;

  const percentage = Math.round((completed / total) * 100);

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
        isDark
          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30'
          : 'bg-primary-100 text-primary-700 border border-primary-200 hover:bg-primary-200'
      }`}
      aria-label={`Walkthrough progress: ${completed} of ${total} tours completed. Click to resume.`}
    >
      <span>🎓</span>
      <span className="hidden sm:inline">
        Tour {completed}/{total}
      </span>
      <div
        className={`w-12 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
        aria-hidden="true"
      >
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  );
}
