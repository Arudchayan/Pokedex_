import React, { useEffect, useRef, useState } from 'react';
import { WalkersEngine } from '../../pets/walkersEngine';
import type { WalkerInstance } from '../../pets/walkersTypes';
import { loadWalkersSettings } from '../../pets/walkersSettings';
import { resolveEntryForSpecies, spriteUrlFor, VSCODE_POKEMON_INDEX } from '../../pets/walkersPack';
import { onWalkersSettingsChanged } from '../../pets/walkersEvents';

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type DragState = {
  walkerId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

const PokemonWalkersOverlay: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<WalkersEngine | null>(null);
  const walkerElsRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const walkersRef = useRef<WalkerInstance[]>([]);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const [renderWalkers, setRenderWalkers] = useState<WalkerInstance[]>([]);
  const [settingsRev, setSettingsRev] = useState(0);

  const applyWalkerStyle = (
    el: HTMLImageElement,
    w: WalkerInstance,
    baseUrl: string,
    spriteSizePx: number
  ) => {
    el.style.transform = `translate3d(${Math.round(w.x)}px, ${Math.round(w.y)}px, 0) scaleX(${w.facing})`;
    el.style.width = `${spriteSizePx}px`;
    el.style.height = `${spriteSizePx}px`;
    el.style.imageRendering = 'pixelated';
    el.style.willChange = 'transform';
    el.style.pointerEvents = 'auto';
    el.style.userSelect = 'none';
    el.style.touchAction = 'none';

    const entry = resolveEntryForSpecies(w.species);
    if (!entry) return;
    const nextSrc = spriteUrlFor(baseUrl, entry, w.anim);
    if (el.dataset.src !== nextSrc) {
      el.dataset.src = nextSrc;
      el.src = nextSrc;
    }
  };

  const spawnFromSettings = () => {
    if (prefersReducedMotion()) {
      walkersRef.current = [];
      setRenderWalkers((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    const settings = loadWalkersSettings();
    if (!settings.enabled || settings.count <= 0) {
      walkersRef.current = [];
      setRenderWalkers((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const world = { width: rect.width, height: rect.height };

    if (!engineRef.current) {
      engineRef.current = new WalkersEngine({
        playgroundHeightPx: settings.playgroundHeightPx,
        speedPxPerSec: settings.speedPxPerSec,
        spriteSizePx: settings.spriteSizePx,
      });
    } else {
      engineRef.current.setConfig({
        playgroundHeightPx: settings.playgroundHeightPx,
        speedPxPerSec: settings.speedPxPerSec,
        spriteSizePx: settings.spriteSizePx,
      });
    }

    const chosen = settings.rosterMode === 'choose' ? settings.chosenSpecies : [];

    const entries =
      settings.rosterMode === 'choose' && chosen.length > 0
        ? chosen.map(resolveEntryForSpecies).filter((e): e is NonNullable<typeof e> => !!e)
        : VSCODE_POKEMON_INDEX;

    const spawnStrategy =
      settings.rosterMode === 'choose' ? 'uniqueThenCycle' : 'randomWithReplacement';

    const spawned = engineRef.current.spawnFromEntries(
      settings.count,
      entries,
      world,
      spawnStrategy
    );
    engineRef.current.setWalkers(spawned);
    walkersRef.current = spawned;
    setRenderWalkers(spawned);
  };

  useEffect(() => {
    // Initial spawn (covers the case where settings were already enabled on load).
    spawnFromSettings();

    // Important: when enabling from "disabled", this component renders `null` (no container),
    // so `spawnFromSettings()` can't read container bounds yet. We force a rerender on settings
    // change, then spawn in a follow-up effect once the container ref exists.
    return onWalkersSettingsChanged(() => setSettingsRev((x) => x + 1));
  }, []);

  useEffect(() => {
    if (settingsRev === 0) return;
    spawnFromSettings();
  }, [settingsRev]);

  useEffect(() => {
    const onResize = () => {
      // Keep current walkers, just clamp on next tick
      // If enabled count changed, settings change event will respawn.
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const loop = (ts: number) => {
      const container = containerRef.current;
      const engine = engineRef.current;
      if (!container || !engine) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const settings = loadWalkersSettings();
      if (!settings.enabled || prefersReducedMotion()) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      engine.setConfig({
        playgroundHeightPx: settings.playgroundHeightPx,
        speedPxPerSec: settings.speedPxPerSec,
        spriteSizePx: settings.spriteSizePx,
      });

      const rect = container.getBoundingClientRect();
      engine.tick(ts, { width: rect.width, height: rect.height });

      const baseUrl = settings.assetBaseUrl;
      const spriteSizePx = settings.spriteSizePx;
      for (const w of walkersRef.current) {
        const el = walkerElsRef.current.get(w.id);
        if (!el) continue;
        applyWalkerStyle(el, w, baseUrl, spriteSizePx);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  const onPointerDown = (w: WalkerInstance) => (e: React.PointerEvent<HTMLImageElement>) => {
    const settings = loadWalkersSettings();
    if (!settings.enabled || !settings.interactive) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    w.dragging = true;
    dragRef.current = {
      walkerId: w.id,
      pointerId: e.pointerId,
      offsetX: px - w.x,
      offsetY: py - w.y,
    };

    (e.currentTarget as HTMLImageElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const container = containerRef.current;
    if (!container) return;
    if (e.pointerId !== drag.pointerId) return;

    const rect = container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const w = walkersRef.current.find((x) => x.id === drag.walkerId);
    if (!w) return;

    const sprite = Math.max(1, loadWalkersSettings().spriteSizePx || 48);
    w.x = Math.max(0, Math.min(rect.width - sprite, px - drag.offsetX));
    w.y = Math.max(0, Math.min(rect.height - sprite, py - drag.offsetY));
    w.anim = 'idle';
    w.vx = 0;
    w.facing = 1;

    const el = walkerElsRef.current.get(w.id);
    if (el) {
      const s = loadWalkersSettings();
      applyWalkerStyle(el, w, s.assetBaseUrl, s.spriteSizePx);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (e.pointerId !== drag.pointerId) return;

    const w = walkersRef.current.find((x) => x.id === drag.walkerId);
    if (w) {
      w.dragging = false;
      const settings = loadWalkersSettings();
      const dir = Math.random() < 0.5 ? -1 : 1;
      w.vx = dir * settings.speedPxPerSec;
      w.facing = w.vx >= 0 ? 1 : -1;
      w.anim = 'walk';
    }

    dragRef.current = null;
  };

  const settings = loadWalkersSettings();
  const enabled = settings.enabled && !prefersReducedMotion();

  if (!enabled) return null;

  // Keep this overlay below modals (z-50) and header (z-40).
  return (
    <div
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        height: settings.playgroundHeightPx,
        pointerEvents: 'none',
      }}
    >
      {/* We render the elements, but we animate imperatively for perf. */}
      {renderWalkers.map((w) => (
        <img
          key={w.id}
          ref={(el) => {
            if (!el) {
              walkerElsRef.current.delete(w.id);
              return;
            }
            walkerElsRef.current.set(w.id, el);
            // Apply a first style so they don't flash at 0,0.
            const s = loadWalkersSettings();
            applyWalkerStyle(el, w, s.assetBaseUrl, s.spriteSizePx);
          }}
          alt={w.species}
          draggable={false}
          onPointerDown={onPointerDown(w)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            pointerEvents: loadWalkersSettings().interactive ? 'auto' : 'none',
          }}
          title={`${w.species} (drag me)`}
          onError={(e) => {
            // If an asset is missing, hide this walker rather than spam network.
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ))}
    </div>
  );
};

export default PokemonWalkersOverlay;
