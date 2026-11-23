import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Loader from '../shared/Loader';
import { usePokemonUI } from '../../context/PokemonContext';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import { fetchItemDex } from '../../services/pokeapiService';
import Modal from '../base/Modal';

interface ItemDexProps {
  onClose: () => void;
  initialSearch?: string;
}

const ItemDex: React.FC<ItemDexProps> = ({ onClose, initialSearch = '' }) => {
  const { theme } = usePokemonUI();
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const {
    data: items = [],
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['itemDex'],
    queryFn: ({ signal }) => fetchItemDex(signal),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const error = queryError ? 'Unable to load items. Please try again.' : null;

  useEffect(() => {
    setPage(0);
  }, [search]);

  const filteredItems = useMemo(() => {
    const normalize = (s: string) => s.toLowerCase().replace(/-/g, ' ');
    const query = normalize(search);
    return items.filter(
      (item) => normalize(item.name).includes(query) || normalize(item.category).includes(query)
    );
  }, [items, search]);

  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, (page + 1) * PAGE_SIZE);
  }, [filteredItems, page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_INPUT_LENGTH) {
      setSearch(value);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Item Dex" size="xl">
      <div className="mb-4">
        <input
          type="text"
          aria-label="Search items"
          placeholder="Search items..."
          className={`w-full p-3 rounded-lg border ${theme === 'dark' ? 'bg-black/30 border-white/20 text-white' : 'bg-slate-100 border-slate-300'}`}
          value={search}
          onChange={handleSearchChange}
          maxLength={MAX_INPUT_LENGTH}
        />
        {!isLoading && !isError && (
          <p className="mt-2 text-xs opacity-70" aria-live="polite">
            Showing {displayedItems.length} of {filteredItems.length} items
          </p>
        )}
      </div>

      {isLoading || (isFetching && isError) ? (
        <Loader message="Loading Items..." />
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
            if (bottom && displayedItems.length < filteredItems.length) {
              setPage((p) => p + 1);
            }
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedItems.map((item, i) => (
              <div
                key={`${item.name}-${i}`}
                className={`p-4 rounded-xl border flex items-start gap-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
              >
                <img
                  src={item.sprite}
                  alt={item.name}
                  className="w-12 h-12 object-contain pixelated"
                  onError={(e) =>
                    (e.currentTarget.src =
                      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png')
                  }
                />
                <div>
                  <h3
                    className={`font-bold capitalize ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                  >
                    {item.name.replace(/-/g, ' ')}
                  </h3>
                  <p className="text-xs text-primary-500 font-semibold mb-1 capitalize">
                    {item.category}
                  </p>
                  <p
                    className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} line-clamp-3`}
                  >
                    {item.effect}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {displayedItems.length === 0 && (
            <div className="text-center p-10 opacity-50">No items found.</div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ItemDex;
