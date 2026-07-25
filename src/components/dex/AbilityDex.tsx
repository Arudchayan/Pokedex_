import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Loader from '../shared/Loader';
import { usePokemonUI } from '../../context/PokemonContext';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import { fetchAbilityDex } from '../../services/pokeapiService';
import Modal from '../base/Modal';

interface AbilityDexProps {
  onClose: () => void;
  initialSearch?: string;
}

const AbilityDex: React.FC<AbilityDexProps> = ({ onClose, initialSearch = '' }) => {
  const { theme } = usePokemonUI();
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const {
    data: abilities = [],
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['abilityDex'],
    queryFn: ({ signal }) => fetchAbilityDex(signal),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const error = queryError ? 'Unable to load abilities. Please try again.' : null;

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
        {!isLoading && !isError && (
          <p className="mt-2 text-xs opacity-70" aria-live="polite">
            Showing {displayedAbilities.length} of {filteredAbilities.length} abilities
          </p>
        )}
      </div>

      {isLoading || (isFetching && isError) ? (
        <Loader message="Loading Abilities..." />
      ) : error ? (
        <div className="grid place-items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
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
