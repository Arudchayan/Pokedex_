import React, { useEffect, useState } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';

interface KeyboardShortcutsProps {
  onRandom: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onRandom }) => {
  const { theme } = usePokemon();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const activeElement = document.activeElement as HTMLElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable)
      ) {
        return;
      }

      if (e.shiftKey) {
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          usePokemonStore.getState().toggleTheme();
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          usePokemonStore.getState().toggleShiny();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          onRandom();
        }
      } else if (e.key === '?') {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRandom]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50" onClick={() => setShowHelp(false)}>
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
          theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowHelp(false)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200/20 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Keyboard Shortcuts
        </h2>

        <div className="space-y-3">
          <ShortcutRow shortcut="Ctrl + K" description="Open Command Palette" theme={theme} />
          <ShortcutRow shortcut="Shift + T" description="Toggle Dark/Light Theme" theme={theme} />
          <ShortcutRow shortcut="Shift + S" description="Toggle Shiny Mode" theme={theme} />
          <ShortcutRow shortcut="Shift + R" description="Open Random Pokemon" theme={theme} />
          <ShortcutRow shortcut="/" description="Focus Search Bar" theme={theme} />
          <ShortcutRow shortcut="Esc" description="Close Modals / Clear Selection" theme={theme} />
          <ShortcutRow shortcut="?" description="Show this Help Modal" theme={theme} />
        </div>

        <div className={`mt-6 text-xs text-center ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            Press <span className="font-mono font-bold bg-gray-500/20 px-1 rounded">Esc</span> to close
        </div>
      </div>
    </div>
  );
};

const ShortcutRow: React.FC<{ shortcut: string; description: string; theme: string }> = ({ shortcut, description, theme }) => (
  <div className={`flex items-center justify-between p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
    <span className={`font-mono text-sm font-bold px-2 py-1 rounded border ${theme === 'dark' ? 'bg-black/30 border-white/10 text-primary-300' : 'bg-white border-slate-200 text-primary-600'}`}>
      {shortcut}
    </span>
    <span className="text-sm font-medium opacity-90">{description}</span>
  </div>
);

export default KeyboardShortcuts;
