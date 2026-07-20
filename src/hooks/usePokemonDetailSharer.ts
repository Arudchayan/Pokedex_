import { useEffect, useRef, useState } from 'react';

const DEFAULT_DOCUMENT_TITLE = 'Pokedex - Explore All Pokemon with Advanced Features';

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
    const raw = params.get('pokemon');
    if (raw) {
      const id = parseInt(raw, 10);
      if (Number.isFinite(id) && id > 0) {
        hydratedFromUrlRef.current = id;
        onSelect(id);
      }
    }
    setReady(true);
    // Intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only hydrate
  }, []);

  // Keep the URL in sync with selection
  useEffect(() => {
    if (!ready) return;

    if (
      hydratedFromUrlRef.current != null &&
      selectedPokemonId === hydratedFromUrlRef.current
    ) {
      hydratedFromUrlRef.current = null;
      return;
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

export { DEFAULT_DOCUMENT_TITLE };
