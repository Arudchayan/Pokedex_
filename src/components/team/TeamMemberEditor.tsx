import React, { useState, useEffect, useMemo } from 'react';
import { TeamMember, PokemonDetails, Item } from '../../types';
import { fetchPokemonDetails, fetchAllItems } from '../../services/pokeapiService';
import { NATURES, STAT_COLORS } from '../../constants';
import { calculateStat } from '../../utils/damageFormula';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import TypeBadge from '../charts/TypeBadge';
import Loader from '../shared/Loader';

interface TeamMemberEditorProps {
  member: TeamMember;
  onClose: () => void;
  onSave: (updates: Partial<TeamMember>) => void;
  theme: 'dark' | 'light';
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
};

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

const TeamMemberEditor: React.FC<TeamMemberEditorProps> = ({ member, onClose, onSave, theme }) => {
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<'main' | 'stats'>('main');

  // Form State
  const [moves, setMoves] = useState<(string | null)[]>([null, null, null, null]);
  const [ability, setAbility] = useState<string>('');
  const [nature, setNature] = useState<string>('Hardy');
  const [item, setItem] = useState<string>('');
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [isShiny, setIsShiny] = useState(false);

  // Stats State
  const [level, setLevel] = useState(100);
  const [evs, setEvs] = useState<Record<string, number>>({
    hp: 0,
    attack: 0,
    defense: 0,
    'special-attack': 0,
    'special-defense': 0,
    speed: 0,
  });
  const [ivs, setIvs] = useState<Record<string, number>>({
    hp: 31,
    attack: 31,
    defense: 31,
    'special-attack': 31,
    'special-defense': 31,
    speed: 31,
  });

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pokemonData, itemsData] = await Promise.all([
          fetchPokemonDetails(member.id),
          fetchAllItems(),
        ]);

        if (!isMounted) return;

        if (!pokemonData) {
          setError('Failed to load Pokemon details.');
          setLoading(false);
          return;
        }

        setDetails(pokemonData);
        setItems(itemsData || []);

        // Initialize state from existing member data or defaults
        if (member.selectedMoves) {
          const newMoves = [...member.selectedMoves];
          while (newMoves.length < 4) newMoves.push(null);
          setMoves(newMoves);
        }
        if (member.selectedAbility) setAbility(member.selectedAbility);
        else if (pokemonData && pokemonData.abilities.length > 0)
          setAbility(pokemonData.abilities[0].name);

        if (member.selectedNature) setNature(member.selectedNature);
        if (member.selectedItem) {
          setItem(member.selectedItem);
          setItemSearch(member.selectedItem);
        }

        // Initialize Shiny State
        if (member.isShiny !== undefined) {
          setIsShiny(member.isShiny);
        } else {
          // Fallback detection for legacy data
          setIsShiny(member.imageUrl === member.shinyImageUrl);
        }

        // Initialize Stats
        if (member.evs) setEvs({ ...evs, ...member.evs });
        if (member.ivs) setIvs({ ...ivs, ...member.ivs });
      } catch (e) {
        if (isMounted) {
          console.error('Failed to load editor data', e);
          setError('Failed to load data.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [member.id]);

  const handleSave = () => {
    const cleanMoves = moves.filter((m): m is string => !!m);

    // Determine the correct image URL based on shiny state
    // We prefer the fresh data from details if available, otherwise fallback to member props
    let finalImageUrl = member.imageUrl;
    if (details) {
      finalImageUrl = isShiny ? details.shinyImageUrl : details.imageUrl;
    } else {
      // Fallback if details failed to load but user saved anyway (unlikely but safe)
      if (isShiny && member.shinyImageUrl) finalImageUrl = member.shinyImageUrl;
      // If switching to non-shiny and we don't have original URL stored in member,
      // we might be stuck with shiny URL if it was already overwritten.
      // But in most cases details will be loaded.
    }

    onSave({
      selectedMoves: cleanMoves,
      selectedAbility: ability,
      selectedNature: nature,
      selectedItem: item,
      evs,
      ivs,
      isShiny,
      imageUrl: finalImageUrl,
    });
    onClose();
  };

  const updateMove = (index: number, moveName: string) => {
    const newMoves = [...moves];
    newMoves[index] = moveName === '' ? null : moveName;
    setMoves(newMoves);
  };

  const updateEV = (stat: string, value: number) => {
    const val = Math.max(0, Math.min(252, value));
    // Calculate total used EVs excluding current stat
    const currentTotal = (Object.entries(evs) as Array<[string, number]>).reduce(
      (sum, [k, v]) => (k === stat ? sum : sum + v),
      0
    );

    if (currentTotal + val <= 510) {
      setEvs((prev) => ({ ...prev, [stat]: val }));
    } else {
      // Cap at remaining
      const remaining = 510 - currentTotal;
      setEvs((prev) => ({ ...prev, [stat]: Math.max(0, remaining) }));
    }
  };

  const updateIV = (stat: string, value: number) => {
    setIvs((prev) => ({ ...prev, [stat]: Math.max(0, Math.min(31, value)) }));
  };

  const applyPreset = (
    type: 'physical' | 'special' | 'bulk' | 'fast_physical' | 'fast_special'
  ) => {
    const newEvs = {
      hp: 0,
      attack: 0,
      defense: 0,
      'special-attack': 0,
      'special-defense': 0,
      speed: 0,
    };

    switch (type) {
      case 'physical':
        newEvs.hp = 252;
        newEvs.attack = 252;
        newEvs.speed = 4;
        break;
      case 'special':
        newEvs.hp = 252;
        newEvs['special-attack'] = 252;
        newEvs.speed = 4;
        break;
      case 'fast_physical':
        newEvs.attack = 252;
        newEvs.speed = 252;
        newEvs.defense = 4;
        break;
      case 'fast_special':
        newEvs['special-attack'] = 252;
        newEvs.speed = 252;
        newEvs.defense = 4;
        break;
      case 'bulk':
        newEvs.hp = 252;
        newEvs.defense = 128;
        newEvs['special-defense'] = 128;
        break;
    }
    setEvs(newEvs);
  };

  const filteredItems = useMemo(() => {
    if (!itemSearch) return items.slice(0, 10);
    const searchLower = itemSearch.toLowerCase();
    return items
      .filter((i) => (i.nameLower || i.name.toLowerCase()).includes(searchLower))
      .slice(0, 10);
  }, [items, itemSearch]);

  const totalEVs = (Object.values(evs) as number[]).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <Loader message="Loading Editor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl text-center">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col h-[90vh] md:h-auto md:max-h-[90vh] ${theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <img
                src={
                  details ? (isShiny ? details.shinyImageUrl : details.imageUrl) : member.imageUrl
                }
                className="w-16 h-16 object-contain"
                alt={member.name}
              />
              <label
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <input
                  type="checkbox"
                  checked={isShiny}
                  onChange={(e) => setIsShiny(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500 bg-transparent border-current w-3.5 h-3.5"
                />
                Shiny
              </label>
            </div>
            <div>
              <h2 className="text-2xl font-bold capitalize">{member.name}</h2>
              <div className="flex gap-1 mt-1">
                {member.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close editor"
            title="Close"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          className={`flex border-b shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
        >
          <button
            role="tab"
            aria-selected={activeTab === 'main'}
            aria-controls="panel-main"
            id="tab-main"
            onClick={() => setActiveTab('main')}
            className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors ${activeTab === 'main' ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-500/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Moves & Info
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'stats'}
            aria-controls="panel-stats"
            id="tab-stats"
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors ${activeTab === 'stats' ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-500/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Stats & EVs
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'main' && (
            <div role="tabpanel" id="panel-main" aria-labelledby="tab-main" className="space-y-6">
              {/* Ability & Nature & Item */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ability */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                    Ability
                  </label>
                  <select
                    value={ability}
                    onChange={(e) => setAbility(e.target.value)}
                    className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 capitalize ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                  >
                    {details.abilities.map((a) => (
                      <option key={a.name} value={a.name}>
                        {a.name.replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nature */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                    Nature
                  </label>
                  <select
                    value={nature}
                    onChange={(e) => setNature(e.target.value)}
                    className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                  >
                    {Object.keys(NATURES).map((natureName) => {
                      const n = NATURES[natureName];
                      const desc = n.up
                        ? `(+${STAT_LABELS[n.up] || n.up}, -${STAT_LABELS[n.down!] || n.down})`
                        : '(Neutral)';
                      return (
                        <option key={natureName} value={natureName}>
                          {natureName} {desc}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Item */}
                <div className="md:col-span-2 relative">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                    Held Item
                  </label>
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value);
                      setShowItemDropdown(true);
                      if (e.target.value === '') setItem('');
                    }}
                    onFocus={() => setShowItemDropdown(true)}
                    maxLength={MAX_INPUT_LENGTH}
                    placeholder="Search for an item..."
                    className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 capitalize ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                  />
                  {showItemDropdown && itemSearch && (
                    <div
                      role="listbox"
                      className={`absolute z-20 w-full mt-1 max-h-48 overflow-y-auto rounded-lg shadow-xl border ${theme === 'dark' ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}
                    >
                      {filteredItems.map((i) => (
                        <button
                          type="button"
                          role="option"
                          key={i.id}
                          onClick={() => {
                            setItem(i.name);
                            setItemSearch(i.name);
                            setShowItemDropdown(false);
                          }}
                          className={`w-full text-left p-2 cursor-pointer flex items-center gap-2 hover:bg-primary-500/20 focus:bg-primary-500/20 focus:outline-none`}
                        >
                          <img src={i.imageUrl} className="w-6 h-6" alt="" />
                          <span className="capitalize text-sm font-medium">
                            {i.name.replace('-', ' ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Overlay to close dropdown */}
                  {showItemDropdown && (
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowItemDropdown(false)}
                    ></div>
                  )}
                </div>
              </div>

              <hr
                className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
              />

              {/* Moves */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-primary-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Moveset
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((index) => {
                    const selectedName = moves[index];
                    return (
                      <div key={index} className="space-y-1">
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-50">
                          Move {index + 1}
                        </label>
                        <select
                          value={selectedName || ''}
                          onChange={(e) => updateMove(index, e.target.value)}
                          className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 capitalize ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <option value="">-- Empty Slot --</option>
                          {selectedName && (
                            <option value={selectedName}>{selectedName.replace('-', ' ')}</option>
                          )}
                          {details.moves
                            .filter((m) => !moves.includes(m.name) || m.name === selectedName)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((m) => (
                              <option key={m.name} value={m.name}>
                                {m.name.replace('-', ' ')} ({m.type.slice(0, 3)})
                              </option>
                            ))}
                        </select>
                        {selectedName && (
                          <div className="flex items-center justify-between text-[11px]">
                            {(() => {
                              const m = details.moves.find((mv) => mv.name === selectedName);
                              if (!m) return null;
                              const isStab =
                                m.type &&
                                (member.types || []).some(
                                  (t) => t.toLowerCase() === m.type.toLowerCase()
                                );
                              const cls =
                                theme === 'dark'
                                  ? 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-200'
                                  : 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700';
                              return (
                                <>
                                  <span className={cls}>
                                    {m.damageClass === 'physical'
                                      ? 'Physical'
                                      : m.damageClass === 'special'
                                        ? 'Special'
                                        : 'Status'}
                                  </span>
                                  {isStab && (
                                    <span
                                      className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        theme === 'dark'
                                          ? 'bg-amber-500/30 text-amber-200'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      STAB
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div role="tabpanel" id="panel-stats" aria-labelledby="tab-stats" className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                <div className="w-full md:w-auto">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                    Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={level}
                    onChange={(e) =>
                      setLevel(Math.max(1, Math.min(100, parseInt(e.target.value) || 100)))
                    }
                    className={`w-24 p-2 text-center rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono font-bold ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div className="w-full md:w-auto flex flex-col items-end">
                  <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                    Quick Presets
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={() => applyPreset('fast_physical')}
                      className="px-2 py-1 text-xs border rounded hover:bg-primary-500/20"
                    >
                      Fast Physical
                    </button>
                    <button
                      onClick={() => applyPreset('fast_special')}
                      className="px-2 py-1 text-xs border rounded hover:bg-primary-500/20"
                    >
                      Fast Special
                    </button>
                    <button
                      onClick={() => applyPreset('bulk')}
                      className="px-2 py-1 text-xs border rounded hover:bg-primary-500/20"
                    >
                      Bulky
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Table */}
              <div
                className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
              >
                <div
                  className={`grid grid-cols-[1fr_50px_60px_1fr_60px] md:grid-cols-[1fr_60px_80px_2fr_80px] gap-2 p-3 font-bold text-xs uppercase tracking-wider border-b ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}
                >
                  <div>Stat</div>
                  <div className="text-center">Base</div>
                  <div className="text-center">IVs</div>
                  <div className="text-center">EVs ({totalEVs}/510)</div>
                  <div className="text-center">Total</div>
                </div>
                {STAT_ORDER.map((stat) => {
                  const base = details.stats.find((s) => s.name === stat)?.value || 0;
                  const ev = evs[stat];
                  const iv = ivs[stat];
                  const total = calculateStat(stat, base, iv, ev, level, nature);
                  const color = STAT_COLORS[stat] || STAT_COLORS.hp;
                  const natureMod = NATURES[nature];
                  const isPlus = natureMod.up === stat;
                  const isMinus = natureMod.down === stat;

                  return (
                    <div
                      key={stat}
                      className={`grid grid-cols-[1fr_50px_60px_1fr_60px] md:grid-cols-[1fr_60px_80px_2fr_80px] gap-2 items-center p-3 border-b last:border-0 ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}
                    >
                      <div className="font-bold flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${color.bar}`}></span>
                        <span className="hidden md:inline capitalize">
                          {stat.replace('special-', 'Sp. ')}
                        </span>
                        <span className="md:hidden">{STAT_LABELS[stat]}</span>
                      </div>
                      <div className="text-center opacity-70 font-mono">{base}</div>

                      {/* IV Input */}
                      <input
                        type="number"
                        min="0"
                        max="31"
                        value={iv}
                        onChange={(e) => updateIV(stat, parseInt(e.target.value) || 0)}
                        aria-label={`${stat.replace('-', ' ')} IV`}
                        className={`w-full p-1 text-center rounded border focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono text-sm ${theme === 'dark' ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200'}`}
                      />

                      {/* EV Slider & Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="252"
                          step="4"
                          value={ev}
                          onChange={(e) => updateEV(stat, parseInt(e.target.value))}
                          aria-label={`${stat.replace('-', ' ')} EV slider`}
                          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
                        />
                        <input
                          type="number"
                          min="0"
                          max="252"
                          value={ev}
                          onChange={(e) => updateEV(stat, parseInt(e.target.value) || 0)}
                          aria-label={`${stat.replace('-', ' ')} EV value`}
                          className={`w-12 p-1 text-center rounded border focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono text-xs ${theme === 'dark' ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200'}`}
                        />
                      </div>

                      {/* Total */}
                      <div
                        className={`text-center font-mono font-bold ${isPlus ? 'text-green-500' : isMinus ? 'text-red-500' : ''}`}
                        title={`Total ${stat.replace('-', ' ')} (${isPlus ? 'Boosted' : isMinus ? 'Hindered' : 'Neutral'})`}
                        aria-label={`Total ${stat.replace('-', ' ')} (${isPlus ? 'Boosted' : isMinus ? 'Hindered' : 'Neutral'})`}
                      >
                        {total}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-center opacity-50">
                Values update automatically based on Level, Nature, IVs, and EVs.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-6 border-t flex justify-end gap-3 shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold shadow-lg shadow-primary-500/20 transition-all transform hover:scale-105"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberEditor;
