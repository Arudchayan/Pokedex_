import { useEffect, useRef, useState } from 'react';

export const DEFAULT_DOCUMENT_TITLE = 'Pokedex - Explore All Pokemon with Advanced Features';

function parsePokemonId(raw: string | null): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Hydrate and sync Pokemon detail selection with `?pokemon=<id>`.
 * Preserves other query params (team, compare, etc.).
 */
export function usePokemonDetailSharer({
  selectedPokemonId,
  onSelect,
}: {
  selectedPokemonId: number | null;
  onSelect: (id: number) => void;
}) {
  const [ready, setReady] = useState(false);
  const hydratedFromUrlRef = useRef<number | null>(null);

  // Hydrate once from the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = parsePokemonId(params.get('pokemon'));
    if (id != null) {
      hydratedFromUrlRef.current = id;
      onSelect(id);
    }
    setReady(true);
    // Intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only hydrate
  }, []);

  // Keep the URL in sync with selection
  useEffect(() => {
    if (!ready) return;

    const pendingHydrateId = hydratedFromUrlRef.current;

    // Wait for selection to catch up after URL hydrate — never wipe ?pokemon early
    if (pendingHydrateId != null) {
      if (selectedPokemonId == null) return;
      if (selectedPokemonId === pendingHydrateId) {
        hydratedFromUrlRef.current = null;
        return;
      }
      // User selected a different Pokémon before hydrate applied — clear pending
      hydratedFromUrlRef.current = null;
    }

    const params = new URLSearchParams(window.location.search);
    const current = params.get('pokemon');
    const next = selectedPokemonId != null ? String(selectedPokemonId) : null;

    if (current === next) return;

    if (selectedPokemonId != null) {
      params.set('pokemon', String(selectedPokemonId));
    } else {
      params.delete('pokemon');
    }

    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [selectedPokemonId, ready]);
}
