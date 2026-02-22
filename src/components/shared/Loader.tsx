import React from 'react';

interface LoaderProps {
  size?: string;
  message?: string;
  label?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'h-16 w-16', message, label = "Loading..." }) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      {/* Animated Pokeball — theme-aware colors */}
      <div className="relative">
        <div className={`${size} relative`}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full animate-spin-slow"
            aria-hidden="true"
          >
            {/* Top half - red (works on both themes) */}
            <path
              d="M 50 5 A 45 45 0 0 1 95 50 L 50 50 Z"
              className="fill-red-500"
            />
            <path
              d="M 50 5 A 45 45 0 0 0 5 50 L 50 50 Z"
              className="fill-red-500"
            />
            {/* Bottom half - theme-aware white/light */}
            <path
              d="M 50 50 L 95 50 A 45 45 0 0 1 50 95 A 45 45 0 0 1 5 50 L 50 50 Z"
              className="fill-slate-50 dark:fill-slate-200"
            />
            {/* Middle band - theme-aware dark */}
            <rect x="5" y="45" width="90" height="10" className="fill-slate-800 dark:fill-slate-300" />
            {/* Center circle - outer */}
            <circle cx="50" cy="50" r="15" className="fill-slate-50 dark:fill-slate-200 stroke-slate-800 dark:stroke-slate-300" strokeWidth="3" />
            {/* Center circle - inner */}
            <circle cx="50" cy="50" r="8" className="fill-slate-800 dark:fill-slate-300" />
          </svg>
        </div>
      </div>

      {message && (
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{message}</p>
      )}

      {/* Screen reader only label when no visible message is present */}
      {!message && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
};

export default Loader;
