import React, { useState, useMemo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import {
  GENERATIONS,
  SHINY_METHODS,
  GenerationKey,
  calculateShinyOdds,
} from '../../utils/shinyOddsUtils';
import Modal from '../base/Modal';

interface ShinyOddsCalculatorProps {
  onClose: () => void;
}

const ShinyOddsCalculator: React.FC<ShinyOddsCalculatorProps> = ({ onClose }) => {
  const { theme } = usePokemon();
  const [generation, setGeneration] = useState<GenerationKey>('gen9');
  const [method, setMethod] = useState<string>('random');
  const [hasCharm, setHasCharm] = useState(false);
  const [hasSandwich, setHasSandwich] = useState(false); // Gen 9 only

  // Reset method when generation changes
  const handleGenerationChange = (gen: GenerationKey) => {
    setGeneration(gen);
    const defaultMethod = SHINY_METHODS[gen]?.[0]?.id || 'random';
    setMethod(defaultMethod);
    setHasSandwich(false);
    // Keep charm if possible, though Gen 2 doesn't have it
    if (gen === 'gen2') setHasCharm(false);
  };

  const currentMethods = SHINY_METHODS[generation] || [];

  const result = useMemo(() => {
    return calculateShinyOdds(generation, method, hasCharm, hasSandwich);
  }, [generation, method, hasCharm, hasSandwich]);

  const percentage = (result.odds * 100).toFixed(4);

  // Background visual based on odds
  const getOddsColor = () => {
    if (result.odds >= 1 / 100) return 'text-purple-400'; // Very high
    if (result.odds >= 1 / 512) return 'text-pink-400'; // Masuda/good odds
    if (result.odds >= 1 / 1365) return 'text-blue-400'; // Charm odds
    return 'text-slate-400'; // Base odds
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Shiny Odds Calculator" size="md">
      <div className="space-y-6">
        {/* Generation Selection */}
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider mb-2 opacity-70">
            Game Generation
          </label>
          <select
            value={generation}
            onChange={(e) => handleGenerationChange(e.target.value as GenerationKey)}
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors appearance-none cursor-pointer ${theme === 'dark' ? 'bg-black/20 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
          >
            {Object.entries(GENERATIONS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Method Selection */}
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider mb-2 opacity-70">
            Hunting Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  method === m.id
                    ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20'
                    : theme === 'dark'
                      ? 'bg-black/20 border-white/5 hover:bg-black/40'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="block font-bold text-sm">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modifiers */}
        <div className="space-y-3">
          <label className="block text-sm font-bold uppercase tracking-wider mb-2 opacity-70">
            Modifiers
          </label>

          {generation !== 'gen2' && (
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${hasCharm ? 'bg-yellow-500/10 border-yellow-500/50' : 'border-transparent bg-black/5 hover:bg-black/10'}`}
            >
              <input
                type="checkbox"
                checked={hasCharm}
                onChange={(e) => setHasCharm(e.target.checked)}
                className="w-5 h-5 rounded text-yellow-500 focus:ring-yellow-500 border-gray-500 bg-transparent"
              />
              <div className="flex-1">
                <span className={`font-bold block ${hasCharm ? 'text-yellow-500' : ''}`}>
                  Shiny Charm
                </span>
                <span className="text-xs opacity-60">
                  Key Item that increases shiny odds drastically.
                </span>
              </div>
              <span className="text-2xl">🗝️</span>
            </label>
          )}

          {generation === 'gen9' && (
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${hasSandwich ? 'bg-orange-500/10 border-orange-500/50' : 'border-transparent bg-black/5 hover:bg-black/10'}`}
            >
              <input
                type="checkbox"
                checked={hasSandwich}
                onChange={(e) => setHasSandwich(e.target.checked)}
                className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 border-gray-500 bg-transparent"
              />
              <div className="flex-1">
                <span className={`font-bold block ${hasSandwich ? 'text-orange-500' : ''}`}>
                  Sandwich Power Lv. 3
                </span>
                <span className="text-xs opacity-60">Sparkling Power Level 3 active.</span>
              </div>
              <span className="text-2xl">🥪</span>
            </label>
          )}
        </div>

        {/* Result Display */}
        <div
          className={`mt-6 p-6 rounded-xl border text-center relative overflow-hidden ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'}`}
        >
          <div className="absolute top-0 right-0 p-24 bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <p className="text-sm uppercase tracking-widest opacity-60 font-bold mb-1">
            Estimated Odds
          </p>
          <div className={`text-5xl font-black tracking-tight mb-2 ${getOddsColor()}`}>
            {result.text}
          </div>
          <p className="text-sm font-mono opacity-50">{percentage}%</p>
        </div>
      </div>
    </Modal>
  );
};

export default ShinyOddsCalculator;
