import React, { useEffect, useMemo, useState } from 'react';
import { fetchEncounterLocations } from '../../services/pokeapiService';
import { PokemonEncounter } from '../../types';

interface EncountersTabProps {
  pokemonId: number;
  theme: string;
}

const METHOD_ICONS: Record<string, string> = {
  walk: '🌿',
  'old rod': '🎣',
  'good rod': '🎣',
  'super rod': '🎣',
  surf: '🌊',
  'rock smash': '🪨',
  headbutt: '🌳',
  'rock climb': '⛰️',
  gift: '🎁',
  'only one': '⭐',
  pokeradar: '📡',
  'slot2': '📦',
  default: '📍',
};

const getMethodIcon = (method: string) => METHOD_ICONS[method.toLowerCase()] ?? METHOD_ICONS.default;

const formatVersionName = (name: string) =>
  name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const EncountersTab: React.FC<EncountersTabProps> = ({ pokemonId, theme }) => {
  const [encounters, setEncounters] = useState<PokemonEncounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>('all');

  const isDark = theme === 'dark';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchEncounterLocations(pokemonId).then((data) => {
      if (!cancelled) {
        setEncounters(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pokemonId]);

  const gameVersions = useMemo(() => {
    const seen = new Set<string>();
    encounters.forEach((e) => seen.add(e.gameVersion));
    return Array.from(seen).sort();
  }, [encounters]);

  const filtered = useMemo(
    () => (selectedGame === 'all' ? encounters : encounters.filter((e) => e.gameVersion === selectedGame)),
    [encounters, selectedGame],
  );

  // Group by game version for display
  const grouped = useMemo(() => {
    const map = new Map<string, PokemonEncounter[]>();
    filtered.forEach((enc) => {
      const list = map.get(enc.gameVersion) ?? [];
      list.push(enc);
      map.set(enc.gameVersion, list);
    });
    return map;
  }, [filtered]);

  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
        active
          ? 'bg-primary-500/30 text-primary-300 border border-primary-400/60'
          : isDark
            ? 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-200'
            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <span className={`ml-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Loading encounter data…
        </span>
      </div>
    );
  }

  if (encounters.length === 0) {
    return (
      <div className={`rounded-xl p-6 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        No wild encounter data available for this Pokémon.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Game filter pills */}
      {gameVersions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {pill('All Games', selectedGame === 'all', () => setSelectedGame('all'))}
          {gameVersions.map((v) =>
            pill(formatVersionName(v), selectedGame === v, () => setSelectedGame(v)),
          )}
        </div>
      )}

      {/* Encounter groups */}
      {Array.from(grouped.entries()).map(([game, encs]) => (
        <div key={game} className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          {/* Game header */}
          <div
            className={`px-4 py-2 flex items-center gap-2 text-sm font-bold ${
              isDark ? 'bg-white/5 text-primary-300' : 'bg-slate-100 text-primary-700'
            }`}
          >
            🎮 {formatVersionName(game)}
          </div>

          {/* Encounter rows */}
          <div className="divide-y divide-white/5">
            {encs.map((enc, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-4 py-2.5 text-sm ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {/* Location */}
                <span className="font-medium capitalize">{enc.locationName}</span>

                {/* Method */}
                <span
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {getMethodIcon(enc.encounterMethod)} {enc.encounterMethod}
                </span>

                {/* Level range */}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                    isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  Lv {enc.minLevel === enc.maxLevel ? enc.minLevel : `${enc.minLevel}–${enc.maxLevel}`}
                </span>

                {/* Chance */}
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full whitespace-nowrap ${
                    isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {enc.chance}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EncountersTab;
