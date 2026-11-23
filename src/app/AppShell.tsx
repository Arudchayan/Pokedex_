import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import AppHeader from '../components/layout/AppHeader';
import AnnouncementBanner from '../components/layout/AnnouncementBanner';
import KeyboardShortcuts from '../components/layout/KeyboardShortcuts';
import ScrollToTop from '../components/layout/ScrollToTop';
import CommandPalette from '../components/layout/CommandPalette';
import AppMain from './AppMain';
import AppModals from './AppModals';
import ComparisonBar from '../components/compare/ComparisonBar';
import { WalkthroughManager } from '../components/walkthrough';
import { useAppController } from './useAppController';
import { useComparisonSharer } from '../hooks/useComparisonSharer';
import { usePokemonDetailSharer } from '../hooks/usePokemonDetailSharer';
import { useToast } from '../context/ToastContext';
import { usePokemonStore } from '../store/usePokemonStore';
import {
  SW_OFFLINE_READY_EVENT,
  SW_UPDATE_AVAILABLE_EVENT,
  type ServiceWorkerUpdateEventDetail,
} from '../utils/swEvents';
import { loadWalkersSettings } from '../pets/walkersSettings';
import { onWalkersSettingsChanged } from '../pets/walkersEvents';

const PokemonWalkersOverlay = lazy(() => import('../components/shared/PokemonWalkersOverlay'));

/** Mount walkers only when enabled so the sprite pack stays out of the initial bundle. */
function WalkersHost() {
  const [enabled, setEnabled] = useState(() => loadWalkersSettings().enabled);

  useEffect(() => onWalkersSettingsChanged(() => setEnabled(loadWalkersSettings().enabled)), []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <PokemonWalkersOverlay />
    </Suspense>
  );
}

/** Approx ComparisonBar height (padding + sprite row) excluding safe-area. */
const COMPARISON_BAR_HEIGHT = '5.5rem';

export default function AppShell() {
  const controller = useAppController();
  const { theme, isCyberpunk, handleRandomPokemon } = controller;
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const updateRef = useRef<(() => Promise<void>) | null>(null);
  const { addToast } = useToast();
  const hasComparisonBar = usePokemonStore((s) => s.comparisonList.length > 0);

  // Handle shareable comparison and detail URLs
  useComparisonSharer();
  usePokemonDetailSharer({
    selectedPokemonId: controller.selectedPokemonId,
    onSelect: controller.handleSelectPokemon,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const onUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent<ServiceWorkerUpdateEventDetail>;
      updateRef.current = customEvent.detail?.applyUpdate ?? null;
      setShowUpdateBanner(true);
      addToast('A new app version is available.', 'info', 4000);
    };

    const onOfflineReady = () => {
      addToast('Offline mode is ready.', 'success', 3500);
    };

    window.addEventListener(SW_UPDATE_AVAILABLE_EVENT, onUpdateAvailable);
    window.addEventListener(SW_OFFLINE_READY_EVENT, onOfflineReady);
    return () => {
      window.removeEventListener(SW_UPDATE_AVAILABLE_EVENT, onUpdateAvailable);
      window.removeEventListener(SW_OFFLINE_READY_EVENT, onOfflineReady);
    };
  }, [addToast]);

  const handleApplyUpdate = async () => {
    if (isApplyingUpdate) return;
    setIsApplyingUpdate(true);
    try {
      if (updateRef.current) {
        await updateRef.current();
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  const chromeBottomOffset = hasComparisonBar
    ? `calc(${COMPARISON_BAR_HEIGHT} + env(safe-area-inset-bottom, 0px))`
    : '0px';

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      } ${isCyberpunk ? 'cyber-scanlines' : ''}`}
      style={{ ['--chrome-bottom-offset' as string]: chromeBottomOffset }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary-600 focus:px-4 focus:py-2 focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Skip to content
      </a>
      <AnnouncementBanner />
      <KeyboardShortcuts onRandom={handleRandomPokemon} />

      <AppHeader onRandomPokemon={handleRandomPokemon} />

      <AppMain controller={controller} />

      {showUpdateBanner && (
        <div
          className={`sticky bottom-0 z-40 mx-auto mt-4 flex w-[min(720px,95%)] items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg ${
            theme === 'dark'
              ? 'border-cyan-400/40 bg-slate-900/95 text-slate-100'
              : 'border-cyan-600/30 bg-white/95 text-slate-900'
          }`}
          role="status"
          aria-live="polite"
        >
          <span className="text-sm">Update available. Refresh to get the latest fixes.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUpdateBanner(false)}
              className="rounded-md px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleApplyUpdate}
              disabled={isApplyingUpdate}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApplyingUpdate ? 'Updating...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}

      <ScrollToTop />
      <WalkersHost />
      <AppModals controller={controller} />
      <ComparisonBar />
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        controller={controller}
      />
      <WalkthroughManager />
    </div>
  );
}
