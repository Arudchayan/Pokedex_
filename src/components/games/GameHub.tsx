import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FC,
  type LazyExoticComponent,
} from 'react';
import { usePokemonData, usePokemonDispatch, usePokemonUI } from '../../context/PokemonContext';
import { useGameStats } from '../../hooks/useGameStats';
import { dateToSeed } from '../../utils/seededRandom';
import ErrorBoundary from '../shared/ErrorBoundary';
import Loader from '../shared/Loader';

const GAME_LOAD_TIMEOUT_MS = 12_000;
const focusableSelectors =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface GameProps {
  onClose: () => void;
  date: string;
  seed: number;
  onReady?: () => void;
}

const GAME_IMPORTERS = {
  pokedle: () => import('./PokedleGame'),
  whosthat: () => import('./WhosThatPokemonGame'),
  flavor: () => import('./FlavorGame'),
  cry: () => import('./CryGame'),
  stat: () => import('./StatGame'),
  move: () => import('./MoveGame'),
  item: () => import('./ItemGame'),
  trainer: () => import('./TrainerGame'),
};

const GAME_LABELS = {
  pokedle: 'Pokédle',
  whosthat: "Who's That Pokémon?",
  flavor: 'FlavorDle',
  cry: 'CryDle',
  stat: 'StatDle',
  move: 'MoveDle',
  item: 'ItemDle',
  trainer: 'TrainerDle',
};

type GameType = 'none' | keyof typeof GAME_LABELS;
type GameKey = keyof typeof GAME_LABELS;
type GameComponentMap = Record<GameKey, LazyExoticComponent<FC<GameProps>>>;

// Recreate the lazy components on retry so a failed chunk import gets a fresh attempt.
const createGameComponents = (): GameComponentMap => ({
  pokedle: lazy(GAME_IMPORTERS.pokedle),
  whosthat: lazy(GAME_IMPORTERS.whosthat),
  flavor: lazy(GAME_IMPORTERS.flavor),
  cry: lazy(GAME_IMPORTERS.cry),
  stat: lazy(GAME_IMPORTERS.stat),
  move: lazy(GAME_IMPORTERS.move),
  item: lazy(GAME_IMPORTERS.item),
  trainer: lazy(GAME_IMPORTERS.trainer),
});

const GameBadge = ({ id, unavailable = false }: { id: string; unavailable?: boolean }) => {
  const { getStats, hasPlayedToday } = useGameStats();
  const stats = getStats(id);

  if (unavailable) {
    return (
      <span className="absolute top-2 right-2 rounded-md bg-slate-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        Unavailable
      </span>
    );
  }

  if (hasPlayedToday(id)) {
    return (
      <span className="absolute top-2 right-2 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
        Done
      </span>
    );
  }

  if (stats.currentStreak > 0) {
    return (
      <span className="absolute top-2 right-2 rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
        {stats.currentStreak} streak
      </span>
    );
  }

  return null;
};

const GameLoadingState: FC<{ label: string; onBack: () => void }> = ({ label, onBack }) => {
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    backRef.current?.focus();
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8" aria-busy="true">
      <Loader message={`Loading ${label}…`} />
      <button
        ref={backRef}
        type="button"
        onClick={onBack}
        className="text-sm font-bold opacity-70 transition-opacity hover:opacity-100"
      >
        ← Back to games
      </button>
    </div>
  );
};

interface GameLoadErrorStateProps {
  label: string;
  theme: 'dark' | 'light';
  onRetry: () => void;
  onBack: () => void;
}

const GameLoadErrorState: FC<GameLoadErrorStateProps> = ({ label, theme, onRetry, onBack }) => {
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    retryRef.current?.focus();
  }, []);

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div
        role="alert"
        aria-atomic="true"
        className={`w-full max-w-md rounded-2xl border p-6 text-center shadow-xl ${
          theme === 'dark'
            ? 'border-red-500/30 bg-slate-900 text-slate-100'
            : 'border-red-200 bg-white text-slate-800'
        }`}
      >
        <h2 className="text-xl font-black">Game data couldn&apos;t load</h2>
        <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          We couldn&apos;t load {label}. Check your connection and try again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            ref={retryRef}
            type="button"
            onClick={onRetry}
            className="rounded-full bg-primary-500 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-600"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onBack}
            className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${
              theme === 'dark'
                ? 'border-white/20 text-slate-200 hover:bg-white/10'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Back to games
          </button>
        </div>
      </div>
    </div>
  );
};

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

interface GameHubProps {
  onClose: () => void;
}

const GameHub: FC<GameHubProps> = ({ onClose }) => {
  const { theme } = usePokemonUI();
  const { masterPokemonList, error } = usePokemonData();
  const { reload } = usePokemonDispatch();
  const [selectedGame, setSelectedGame] = useState<GameType>('none');
  const [gameComponents, setGameComponents] = useState(createGameComponents);
  const [gameReady, setGameReady] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [gameFailed, setGameFailed] = useState(false);
  const [launchAttempt, setLaunchAttempt] = useState(0);
  const titleId = useId();
  const dataWarningId = useId();
  const viewRef = useRef<HTMLDivElement>(null);
  const gameContentRef = useRef<HTMLDivElement>(null);
  const lastGameRef = useRef<GameKey | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Date Management
  const [date] = useState(getTodayDateString());

  const gameRequiresPokemon =
    selectedGame !== 'none' && selectedGame !== 'move' && selectedGame !== 'item';
  const datasetUnavailable = error !== null && masterPokemonList.length === 0;
  const datasetBlocksGame = gameRequiresPokemon && datasetUnavailable;
  const showGameError = loadTimedOut || gameFailed || datasetBlocksGame;
  const showGameLoading = selectedGame !== 'none' && !showGameError && !gameReady;

  const handleBackToGames = useCallback(() => {
    setSelectedGame('none');
    setGameReady(false);
    setLoadTimedOut(false);
    setGameFailed(false);
  }, []);

  const openGame = useCallback((game: GameKey) => {
    lastGameRef.current = game;
    setSelectedGame(game);
    setGameReady(false);
    setLoadTimedOut(false);
    setGameFailed(false);
    setGameComponents(createGameComponents());
  }, []);

  const handleGameReady = useCallback(() => {
    setGameReady(true);
  }, []);

  const handleGameError = useCallback(() => {
    setGameFailed(true);
  }, []);

  const handleRetry = useCallback(() => {
    setGameReady(false);
    setLoadTimedOut(false);
    setGameFailed(false);
    setGameComponents(createGameComponents());
    setLaunchAttempt((attempt) => attempt + 1);
    if (gameRequiresPokemon && masterPokemonList.length === 0) {
      void reload();
    }
  }, [gameRequiresPokemon, masterPokemonList.length, reload]);

  // Restore focus to whatever opened the Game Hub when it unmounts.
  useEffect(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => triggerRef.current?.focus();
  }, []);

  // Bound the loading state: if the lazy chunk or the game's data never resolves, fail visibly.
  useEffect(() => {
    if (selectedGame === 'none' || gameReady || showGameError) return;

    const timer = window.setTimeout(() => setLoadTimedOut(true), GAME_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [selectedGame, gameReady, showGameError, launchAttempt]);

  // Keep keyboard users inside the active view and let Escape step back to the hub.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedGame === 'none') onClose();
        else handleBackToGames();
        return;
      }
      if (e.key !== 'Tab') return;

      const container = viewRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => !el.closest('[hidden], [inert]'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedGame, onClose, handleBackToGames]);

  // Focus the first hub control when the hub opens or comes back into view.
  useEffect(() => {
    if (selectedGame !== 'none') return;
    const first = viewRef.current?.querySelector<HTMLElement>(focusableSelectors);
    first?.focus();
  }, [selectedGame]);

  // Returning from a game should put focus back on the card that launched it.
  useEffect(() => {
    if (selectedGame !== 'none') return;
    const game = lastGameRef.current;
    if (!game) return;
    lastGameRef.current = null;
    viewRef.current?.querySelector<HTMLElement>(`[data-game="${game}"]`)?.focus();
  }, [selectedGame]);

  // Once the game is mounted and ready, move focus into it.
  useEffect(() => {
    if (selectedGame === 'none' || !gameReady || showGameError) return;
    const first = gameContentRef.current?.querySelector<HTMLElement>(focusableSelectors);
    first?.focus();
  }, [selectedGame, gameReady, showGameError]);

  const renderGame = (game: GameKey) => {
    const GameComponent = gameComponents[game];
    return (
      <GameComponent
        onClose={handleBackToGames}
        date={date}
        seed={dateToSeed(date + '-' + game)}
        onReady={handleGameReady}
      />
    );
  };

  if (selectedGame !== 'none') {
    const label = GAME_LABELS[selectedGame];

    return (
      <div
        ref={viewRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${label} game`}
        aria-busy={showGameLoading}
        className={`fixed inset-0 z-[1050] flex flex-col ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}
      >
        <div className="flex-1 overflow-hidden p-4">
          {showGameError ? (
            <GameLoadErrorState
              label={label}
              theme={theme}
              onRetry={handleRetry}
              onBack={handleBackToGames}
            />
          ) : (
            <>
              {showGameLoading && <GameLoadingState label={label} onBack={handleBackToGames} />}
              <ErrorBoundary
                key={`${selectedGame}-${launchAttempt}`}
                onError={handleGameError}
                fallback={null}
              >
                <Suspense fallback={null}>
                  <div
                    ref={gameContentRef}
                    className="h-full"
                    hidden={!gameReady}
                    aria-hidden={!gameReady}
                  >
                    {renderGame(selectedGame)}
                  </div>
                </Suspense>
              </ErrorBoundary>
            </>
          )}
        </div>
      </div>
    );
  }

  const gameCardClass = (unavailable: boolean) =>
    `relative p-4 sm:p-6 rounded-xl shadow-lg transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 ${
      unavailable ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
    } ${
      theme === 'dark'
        ? `bg-slate-800 ${unavailable ? '' : 'hover:bg-slate-700'}`
        : `bg-white border border-slate-100 ${unavailable ? '' : 'hover:bg-slate-50'}`
    }`;

  return (
    <div
      className={`fixed inset-0 z-[1050] flex items-center justify-center p-4 backdrop-blur-sm ${theme === 'dark' ? 'bg-black/80' : 'bg-slate-500/50'}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={viewRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl animate-fade-in-up ${theme === 'dark' ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2
              id={titleId}
              className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
            >
              Game Suite
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Play daily challenges!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close game suite"
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-black/5 text-slate-400 hover:text-slate-800'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {datasetUnavailable && (
          <div
            id={dataWarningId}
            role="alert"
            className={`mb-4 rounded-xl border p-4 ${
              theme === 'dark'
                ? 'border-red-500/30 bg-red-500/10 text-red-100'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <p className="font-bold">Game data is unavailable</p>
            <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-red-200/80' : 'text-red-600'}`}>
              Pokémon data couldn&apos;t load, so those games are paused. MoveDle and ItemDle still
              work.
            </p>
            <button
              type="button"
              onClick={() => void reload()}
              className={`mt-3 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${
                theme === 'dark'
                  ? 'border-red-200/60 hover:bg-red-500/20'
                  : 'border-red-300 hover:bg-red-100'
              }`}
            >
              Retry loading data
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Battle Button - Featured */}
          <button
            type="button"
            onClick={() =>
              window.open('https://play.pokemonshowdown.com/', '_blank', 'noopener,noreferrer')
            }
            className={`col-span-2 lg:col-span-3 p-4 sm:p-8 rounded-xl shadow-lg transition-all hover:scale-[1.01] flex flex-row items-center justify-between gap-3 sm:gap-6 overflow-hidden relative group ${theme === 'dark' ? 'bg-gradient-to-r from-red-900 to-slate-800 border-red-700' : 'bg-gradient-to-r from-red-100 to-slate-100 border-red-200'} border`}
          >
            <div className="flex flex-col items-start z-10 min-w-0">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-500 mb-1">
                External Link
              </span>
              <h3 className="font-black text-xl sm:text-3xl">Battle Simulator</h3>
              <p
                className={`text-xs sm:text-sm mt-1 sm:mt-2 max-w-md text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
              >
                Play on Pokémon Showdown!
              </p>
            </div>
            <div className="text-4xl sm:text-6xl animate-bounce-slow flex-shrink-0">⚔️</div>
            <div className="absolute right-4 bottom-4 opacity-50 text-xs">Opens in new tab ↗</div>
          </button>

          <button
            type="button"
            onClick={() => openGame('pokedle')}
            disabled={datasetUnavailable}
            aria-describedby={datasetUnavailable ? dataWarningId : undefined}
            data-game="pokedle"
            className={gameCardClass(datasetUnavailable)}
          >
            <GameBadge id="pokedle" unavailable={datasetUnavailable} />
            <span className="text-3xl sm:text-4xl">🦋</span>
            <div className="text-center">
              <h3 className="font-bold text-sm sm:text-lg">Pokédle</h3>
              <p
                className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Guess the Pokémon properties
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openGame('whosthat')}
            disabled={datasetUnavailable}
            aria-describedby={datasetUnavailable ? dataWarningId : undefined}
            data-game="whosthat"
            className={gameCardClass(datasetUnavailable)}
          >
            <GameBadge id="whosthat" unavailable={datasetUnavailable} />
            <span className="text-4xl">❓</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">Who's That Pokémon?</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Identify from silhouette
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openGame('flavor')}
            disabled={datasetUnavailable}
            aria-describedby={datasetUnavailable ? dataWarningId : undefined}
            data-game="flavor"
            className={gameCardClass(datasetUnavailable)}
          >
            <GameBadge id="flavor" unavailable={datasetUnavailable} />
            <span className="text-4xl">📜</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">FlavorDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess from Pokédex entry
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openGame('cry')}
            disabled={datasetUnavailable}
            aria-describedby={datasetUnavailable ? dataWarningId : undefined}
            data-game="cry"
            className={gameCardClass(datasetUnavailable)}
          >
            <GameBadge id="cry" unavailable={datasetUnavailable} />
            <span className="text-4xl">🔊</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">CryDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Identify the Pokémon cry
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openGame('stat')}
            disabled={datasetUnavailable}
            aria-describedby={datasetUnavailable ? dataWarningId : undefined}
            data-game="stat"
            className={gameCardClass(datasetUnavailable)}
          >
            <GameBadge id="stat" unavailable={datasetUnavailable} />
            <span className="text-4xl">📊</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">StatDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess from base stats
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openGame('move')}
            data-game="move"
            className={gameCardClass(false)}
          >
            <GameBadge id="move" />
            <span className="text-4xl">⚔️</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">MoveDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess the move attributes
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openGame('item')}
            data-game="item"
            className={gameCardClass(false)}
          >
            <GameBadge id="item" />
            <span className="text-4xl">🎒</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">ItemDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess the item
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openGame('trainer')}
            disabled={datasetUnavailable}
            aria-describedby={datasetUnavailable ? dataWarningId : undefined}
            data-game="trainer"
            className={gameCardClass(datasetUnavailable)}
          >
            <GameBadge id="trainer" unavailable={datasetUnavailable} />
            <span className="text-4xl">🧢</span>
            <div className="text-center">
              <h3 className="font-bold text-lg">TrainerDle</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Guess the trainer team
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHub;
