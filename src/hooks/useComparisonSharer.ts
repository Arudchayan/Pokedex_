import { useEffect, useRef } from 'react';
import { usePokemonStore } from '../store/usePokemonStore';
import { useModalStore } from '../store/useModalStore';

/**
 * Hook to handle sharing comparison via URL query parameters.
 * Checks for `?compare=id1,id2` on mount and opens the comparison modal.
 */
export const useComparisonSharer = () => {
  const setComparisonList = usePokemonStore((s) => s.setComparisonList);
  const openComparison = useModalStore((s) => s.openComparison);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const compareParam = params.get('compare');

    if (compareParam) {
      const ids = compareParam
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id) && id > 0);

      if (ids.length > 0) {
        setComparisonList(ids);
        openComparison();

        // Optional: clear the query param to avoid reopening on refresh?
        // For now, we keep it so the URL remains shareable.
      }
    }

    hasCheckedRef.current = true;
  }, [setComparisonList, openComparison]);
};
