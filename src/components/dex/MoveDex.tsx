import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import TypeBadge from '../charts/TypeBadge';
import Loader from '../shared/Loader';
import { usePokemonUI } from '../../context/PokemonContext';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import { fetchMoveDex } from '../../services/pokeapiService';
import Modal from '../base/Modal';

interface MoveDexProps {
  onClose: () => void;
  initialSearch?: string;
}

const MoveDex: React.FC<MoveDexProps> = ({ onClose, initialSearch = '' }) => {
  const { theme } = usePokemonUI();
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const {
    data: moves = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['moveDex'],
    queryFn: ({ signal }) => fetchMoveDex(signal),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const error = queryError ? 'Unable to load moves. Please try again.' : null;

  useEffect(() => {
    setPage(0);
  }, [search]);

  const filteredMoves = useMemo(() => {
    const normalize = (s: string) => s.toLowerCase().replace(/-/g, ' ');
    const query = normalize(search);
    return moves.filter((m) => m.nameLower.includes(query) || m.typeLower.includes(query));
  }, [moves, search]);

  const displayedMoves = useMemo(() => {
    return filteredMoves.slice(0, (page + 1) * PAGE_SIZE);
  }, [filteredMoves, page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_INPUT_LENGTH) {
      setSearch(value);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Move Dex" size="xl">
      <div className="mb-4">
        <input
          type="text"
          aria-label="Search moves"
          placeholder="Search moves by name or type..."
          className={`w-full p-3 rounded-lg border ${theme === 'dark' ? 'bg-black/30 border-white/20 text-white' : 'bg-slate-100 border-slate-300'}`}
          value={search}
          onChange={handleSearchChange}
          maxLength={MAX_INPUT_LENGTH}
        />
        {!loading && !error && (
          <p className="mt-2 text-xs opacity-70" aria-live="polite">
            Showing {displayedMoves.length} of {filteredMoves.length} moves
          </p>
        )}
      </div>

      {loading ? (
        <Loader message="Loading Moves..." />
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
            if (bottom && displayedMoves.length < filteredMoves.length) {
              setPage((p) => p + 1);
            }
          }}
        >
          <table className="w-full text-left border-collapse">
            <thead
              className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
            >
              <tr
                className={`border-b ${theme === 'dark' ? 'border-white/20 text-slate-400' : 'border-slate-300 text-slate-600'}`}
              >
                <th className="p-3">Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Class</th>
                <th className="p-3">Power</th>
                <th className="p-3">Acc</th>
                <th className="p-3">PP</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-slate-200'}`}
            >
              {displayedMoves.map((move, i) => (
                <tr key={`${move.name}-${i}`} className="hover:bg-white/5 transition-colors">
                  <td
                    className={`p-3 font-bold capitalize ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                  >
                    {move.name.replace(/-/g, ' ')}
                  </td>
                  <td className="p-3">
                    <TypeBadge type={move.type} />
                  </td>
                  <td className="p-3 capitalize opacity-80">{move.damageClass}</td>
                  <td className="p-3">{move.power || '-'}</td>
                  <td className="p-3">{move.accuracy || '-'}</td>
                  <td className="p-3">{move.pp}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayedMoves.length === 0 && (
            <div className="text-center p-10 opacity-50">No moves found.</div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default MoveDex;
