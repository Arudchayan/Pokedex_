import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { loadWalkersSettings, saveWalkersSettings } from '../../pets/walkersSettings';
import type { WalkersSettings } from '../../pets/walkersTypes';
import { listAvailableSpecies } from '../../pets/walkersPack';
import { notifyWalkersSettingsChanged } from '../../pets/walkersEvents';
import Modal from '../base/Modal';
import PokemonGardenSelector from './PokemonGardenSelector';

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface PokemonWalkersSettingsModalProps {
  onClose: () => void;
}

const PokemonWalkersSettingsModal: React.FC<PokemonWalkersSettingsModalProps> = ({ onClose }) => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<WalkersSettings>(() => loadWalkersSettings());

  const speciesOptions = useMemo(() => listAvailableSpecies(), []);

  useEffect(() => {
    // Refresh on open (in case something else changed settings)
    setSettings(loadWalkersSettings());
  }, []);

  const save = () => {
    saveWalkersSettings(settings);
    notifyWalkersSettingsChanged();
    addToast('Pokemon Walkers settings saved.', 'success');
  };

  const toggleEnabled = () => {
    if (!settings.enabled && prefersReducedMotion()) {
      addToast(
        'Walkers are disabled because “Reduce motion” is enabled in your OS/browser.',
        'warning'
      );
      return;
    }
    setSettings((s) => ({ ...s, enabled: !s.enabled }));
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Pokemon Walkers Settings" size="md">
      <p className="text-sm text-slate-400 dark:text-slate-400 mb-4">
        Bottom playground walkers, local-only. Drag them around when enabled.
      </p>

      {prefersReducedMotion() && (
        <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          Reduce motion is enabled. Walkers will stay disabled.
        </div>
      )}

      <div className="mt-6 grid gap-6">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div>
            <div className="font-bold text-white">Enable Walkers</div>
            <div className="text-sm text-slate-400">
              Shows a draggable Pokemon playground at the bottom.
            </div>
          </div>
          <button
            type="button"
            onClick={toggleEnabled}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              settings.enabled
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                : 'bg-white/5 text-slate-200 border border-white/10'
            }`}
            aria-pressed={settings.enabled}
          >
            {settings.enabled ? 'On' : 'Off'}
          </button>
        </div>

        <div className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-2">
            <label className="text-sm font-bold text-white" htmlFor="walkers-count">
              How many (0+)
            </label>
            <input
              id="walkers-count"
              type="number"
              min={0}
              value={settings.count}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  count: Math.max(0, Math.round(Number(e.target.value) || 0)),
                }))
              }
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            />
            <p className="text-xs text-slate-400">
              Note: very large counts can reduce performance.
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-bold text-white" htmlFor="walkers-speed">
              Speed (px/sec)
            </label>
            <input
              id="walkers-speed"
              type="number"
              min={10}
              max={220}
              value={Math.round(settings.speedPxPerSec)}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  speedPxPerSec: Math.max(10, Math.min(220, Number(e.target.value) || 50)),
                }))
              }
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-bold text-white" htmlFor="walkers-spriteSize">
              Sprite size (px)
            </label>
            <input
              id="walkers-spriteSize"
              type="number"
              min={12}
              max={256}
              value={settings.spriteSizePx}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  spriteSizePx: Math.max(
                    12,
                    Math.min(256, Math.round(Number(e.target.value) || 48))
                  ),
                }))
              }
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-bold text-white" htmlFor="walkers-height">
              Playground height (px)
            </label>
            <input
              id="walkers-height"
              type="number"
              min={90}
              max={260}
              value={settings.playgroundHeightPx}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  playgroundHeightPx: Math.max(90, Math.min(260, Number(e.target.value) || 150)),
                }))
              }
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-3">
            <div>
              <div className="font-bold text-white">Interactive (drag)</div>
              <div className="text-sm text-slate-400">Allow dragging the walkers.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.interactive}
              onChange={(e) => setSettings((s) => ({ ...s, interactive: e.target.checked }))}
              aria-label="Interactive"
            />
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-2">
            <label className="text-sm font-bold text-white" htmlFor="walkers-baseurl">
              Asset base URL
            </label>
            <input
              id="walkers-baseurl"
              type="text"
              value={settings.assetBaseUrl}
              onChange={(e) => setSettings((s) => ({ ...s, assetBaseUrl: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
              placeholder="https://raw.githubusercontent.com/Arudchayan/vscode-pokemon/main"
            />
            <p className="text-xs text-slate-400">
              Uses your fork on GitHub. We only request <code>default_idle_8fps.gif</code> and{' '}
              <code>default_walk_8fps.gif</code>.
            </p>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-bold text-white">Roster</div>
            <div className="flex gap-4 text-sm text-slate-300">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="walkers-roster"
                  checked={settings.rosterMode === 'random'}
                  onChange={() => setSettings((s) => ({ ...s, rosterMode: 'random' }))}
                />
                Random
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="walkers-roster"
                  checked={settings.rosterMode === 'choose'}
                  onChange={() => setSettings((s) => ({ ...s, rosterMode: 'choose' }))}
                />
                Choose
              </label>
            </div>
          </div>

          {settings.rosterMode === 'choose' && (
            <div className="grid gap-2">
              <label className="text-sm font-bold text-white">Choose species</label>
              <PokemonGardenSelector
                value={settings.chosenSpecies}
                onChange={(selected) => setSettings((s) => ({ ...s, chosenSpecies: selected }))}
                options={speciesOptions}
                placeholder="Search and select Pokemon..."
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              save();
              onClose();
            }}
            className="rounded-lg bg-primary-600 px-4 py-2 font-bold text-white hover:bg-primary-500"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              save();
              notifyWalkersSettingsChanged();
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-bold text-white hover:bg-white/10"
          >
            Apply (keep open)
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PokemonWalkersSettingsModal;
