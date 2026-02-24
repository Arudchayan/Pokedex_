import React, { useState, memo } from 'react';
import { TYPE_RELATIONS } from '../../constants';
import TypeBadge from '../charts/TypeBadge';
import { usePokemon } from '../../context/PokemonContext';

interface BattleCalculatorProps {
  onClose: () => void;
}

const BattleCalculator: React.FC<BattleCalculatorProps> = memo(({ onClose }) => {
  const { theme } = usePokemon();
  const [attackerType, setAttackerType] = useState<string>('normal');
  const [defenderTypes, setDefenderTypes] = useState<string[]>(['normal']);

  const allTypes = Object.keys(TYPE_RELATIONS);

  const calculateEffectiveness = () => {
    let multiplier = 1;
    defenderTypes.forEach((defType) => {
      const effectiveness = TYPE_RELATIONS[attackerType]?.[defType];
      if (effectiveness !== undefined) {
        multiplier *= effectiveness;
      }
    });
    return multiplier;
  };

  const effectiveness = calculateEffectiveness();

  const getEffectivenessText = (value: number) => {
    if (value === 0) return { text: 'No Effect', color: 'text-gray-400' };
    if (value < 0.5) return { text: 'Not Very Effective', color: 'text-red-400' };
    if (value === 0.5) return { text: 'Not Very Effective', color: 'text-orange-400' };
    if (value === 1) return { text: 'Normal Damage', color: 'text-slate-300' };
    if (value === 2) return { text: 'Super Effective!', color: 'text-green-400' };
    if (value >= 4) return { text: 'Extremely Effective!', color: 'text-emerald-300' };
    return { text: 'Effective', color: 'text-blue-400' };
  };

  const effectivenessInfo = getEffectivenessText(effectiveness);

  const toggleDefenderType = (type: string) => {
    if (defenderTypes.includes(type)) {
      if (defenderTypes.length > 1) {
        setDefenderTypes(defenderTypes.filter((t) => t !== type));
      }
    } else if (defenderTypes.length < 2) {
      setDefenderTypes([...defenderTypes, type]);
    }
  };

  return (
    <div
      className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${
        theme === 'dark' ? 'bg-black/80' : 'bg-slate-500/50'
      }`}
      onClick={onClose}
    >
      <div
        className={`border rounded-2xl max-w-2xl w-full p-6 animate-bounce-in ${
          theme === 'dark'
            ? 'bg-slate-950/95 border-white/20'
            : 'bg-white/95 border-slate-200 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2
              className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
            >
              Battle Calculator
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Calculate type matchup effectiveness
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-black/5 text-slate-400 hover:text-slate-800'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Attacker Type */}
          <div
            className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}
          >
            <h3
              className={`text-lg font-bold mb-3 ${theme === 'dark' ? 'text-primary-300' : 'text-primary-600'}`}
            >
              Attacking Type
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setAttackerType(type)}
                  className={`transition-all ${
                    attackerType === type
                      ? 'ring-2 ring-primary-400 scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <TypeBadge type={type} />
                </button>
              ))}
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div
              className={`flex-1 h-px bg-gradient-to-r from-transparent to-transparent ${theme === 'dark' ? 'via-white/20' : 'via-slate-300'}`}
            />
            <span
              className={`px-4 text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-400'}`}
            >
              VS
            </span>
            <div
              className={`flex-1 h-px bg-gradient-to-r from-transparent to-transparent ${theme === 'dark' ? 'via-white/20' : 'via-slate-300'}`}
            />
          </div>

          {/* Defender Types */}
          <div
            className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}
          >
            <h3
              className={`text-lg font-bold mb-3 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}
            >
              Defending Type{defenderTypes.length > 1 ? 's' : ''} (Select 1-2)
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleDefenderType(type)}
                  className={`transition-all ${
                    defenderTypes.includes(type)
                      ? 'ring-2 ring-purple-400 scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <TypeBadge type={type} />
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div
            className={`p-6 rounded-xl border-2 ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-black/40 to-black/20 border-white/20'
                : 'bg-white border-slate-200 shadow-inner'
            }`}
          >
            <h3
              className={`text-lg font-bold mb-4 text-center ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
            >
              Effectiveness
            </h3>
            <div className="text-center">
              <div className={`text-6xl font-black mb-2 ${effectivenessInfo.color}`}>
                ×{effectiveness.toFixed(2)}
              </div>
              <p className={`text-2xl font-bold ${effectivenessInfo.color}`}>
                {effectivenessInfo.text}
              </p>
            </div>

            {/* Visual Damage Bar */}
            <div className="mt-6">
              <div
                className={`h-4 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}
              >
                <div
                  className={`h-full transition-all duration-500 ${
                    effectiveness === 0
                      ? 'bg-gray-500'
                      : effectiveness < 1
                        ? 'bg-red-500'
                        : effectiveness === 1
                          ? 'bg-blue-500'
                          : effectiveness === 2
                            ? 'bg-green-500'
                            : 'bg-emerald-400'
                  }`}
                  style={{
                    width: `${Math.min(effectiveness * 50, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BattleCalculator.displayName = 'BattleCalculator';

export default BattleCalculator;
