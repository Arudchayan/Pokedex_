import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { POKEAPI_GRAPHQL_URL } from '../../constants';
import Loader from '../shared/Loader';
import { usePokemon } from '../../context/PokemonContext';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import fetchAbilityDexQuery from '../../graphql/fetchAbilityDex.graphql?raw';
import { FetchAbilityDexQuery } from '../../graphql/generated';
import Modal from '../base/Modal';
import { logger } from '../../utils/logger';

interface AbilityDexProps {
  onClose: () => void;
  initialSearch?: string;
}

interface Ability {
  name: string;
  effect: string;
}

const AbilityDex: React.FC<AbilityDexProps> = ({ onClose, initialSearch = '' }) => {
  const { theme } = usePokemon();
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchAbilities = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(POKEAPI_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fetchAbilityDexQuery }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Unable to load abilities (${response.status})`);
      }

      const json = (await response.json()) as { data?: FetchAbilityDexQuery };
      const fetchedAbilities: Ability[] =
        json.data?.pokemon_v2_ability.map((a) => ({
          name: a.name,
          effect: a.pokemon_v2_abilityeffecttexts[0]?.effect || 'No description available.',
        })) ?? [];
      setAbilities(fetchedAbilities);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      logger.warn('AbilityDex fetch failed', e);
      setError('Unable to load abilities. Please try again.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAbilities(controller.signal);
    return () => controller.abort();
  }, [fetchAbilities]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const filteredAbilities = useMemo(() => {
    const normalize = (s: string) => s.toLowerCase().replace(/-/g, ' ');
    const query = normalize(search);
    return abilities.filter((a) => normalize(a.name).includes(query));
  }, [abilities, search]);

  const displayedAbilities = useMemo(() => {
    return filteredAbilities.slice(0, (page + 1) * PAGE_SIZE);
  }, [filteredAbilities, page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_INPUT_LENGTH) {
      setSearch(value);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Ability Dex" size="xl">
      <div className="mb-4">
        <input
          type="text"
          aria-label="Search abilities"
          placeholder="Search abilities..."
          className={`w-full p-3 rounded-lg border ${theme === 'dark' ? 'bg-black/30 border-white/20 text-white' : 'bg-slate-100 border-slate-300'}`}
          value={search}
          onChange={handleSearchChange}
          maxLength={MAX_INPUT_LENGTH}
        />
        {!loading && !error && (
          <p className="mt-2 text-xs opacity-70" aria-live="polite">
            Showing {displayedAbilities.length} of {filteredAbilities.length} abilities
          </p>
        )}
      </div>

      {loading ? (
        <Loader message="Loading Abilities..." />
      ) : error ? (
        <div className="grid place-items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={() => void fetchAbilities()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto pr-2 scrollbar-thin"
          onScroll={(e) => {
            const bottom =
              e.currentTarget.scrollTop + e.currentTarget.clientHeight >=
              e.currentTarget.scrollHeight - 8;
            if (bottom && displayedAbilities.length < filteredAbilities.length) {
              setPage((p) => p + 1);
            }
          }}
        >
          <div className="grid gap-4">
            {displayedAbilities.map((ability, i) => (
              <div
                key={`${ability.name}-${i}`}
                className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
              >
                <h3
                  className={`text-lg font-bold capitalize mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                >
                  {ability.name.replace(/-/g, ' ')}
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {ability.effect}
                </p>
              </div>
            ))}
          </div>
          {displayedAbilities.length === 0 && (
            <div className="text-center p-10 opacity-50">No abilities found.</div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AbilityDex;
