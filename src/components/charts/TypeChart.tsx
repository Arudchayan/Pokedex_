import React, { memo } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { TYPE_COLORS, TYPE_RELATIONS } from '../../constants';
import TypeBadge from './TypeBadge';
import Modal from '../base/Modal';

interface TypeChartProps {
  onClose: () => void;
}

const ALL_TYPES = Object.keys(TYPE_COLORS);

const TypeChart: React.FC<TypeChartProps> = ({ onClose }) => {
  const { theme } = usePokemon();

  const getEffectiveness = (attacker: string, defender: string) => {
    const relation = TYPE_RELATIONS[attacker];
    if (!relation) return 1;
    return relation[defender] ?? 1;
  };

  const renderCell = (attacker: string, defender: string) => {
    const effectiveness = getEffectiveness(attacker, defender);

    if (effectiveness === 1) return null;

    let content = '';
    let className = '';

    if (effectiveness === 2) {
      content = '2x';
      className = 'text-green-500 font-bold';
    } else if (effectiveness === 0.5) {
      content = '½';
      className = 'text-red-500 font-bold';
    } else if (effectiveness === 0) {
      content = '0';
      className = 'text-slate-400 font-bold';
    }

    return <span className={className}>{content}</span>;
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Type Effectiveness Chart" size="full">
      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
        Rows attack Columns. Green = Super Effective (2x), Red = Not Very Effective (½x), Gray = No
        Effect (0x).
      </p>
      <p className="text-xs text-slate-400 mb-2 md:hidden">Scroll horizontally to see all types</p>

      <div className="overflow-x-auto overflow-y-auto scrollbar-thin max-h-[70vh]">
        <table className="w-full min-w-[600px] text-center border-collapse text-xs md:text-sm">
          <thead className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
            <tr>
              <th
                className={`p-1 sticky left-0 z-20 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
              >
                <div className="w-16 md:w-24 h-8 flex items-center justify-center font-bold text-slate-500">
                  ATK \ DEF
                </div>
              </th>
              {ALL_TYPES.map((type) => (
                <th key={type} className="p-1 min-w-[3rem]">
                  <div className="flex justify-center transform -rotate-45 origin-bottom-left translate-x-4 md:transform-none md:translate-x-0">
                    <TypeBadge type={type} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-200'}`}>
            {ALL_TYPES.map((attacker) => (
              <tr key={attacker} className="hover:bg-white/5 transition-colors">
                <th
                  className={`p-1 sticky left-0 z-10 ${theme === 'dark' ? 'bg-slate-900 border-r border-white/10' : 'bg-white border-r border-slate-200'}`}
                >
                  <div className="flex justify-start">
                    <TypeBadge type={attacker} />
                  </div>
                </th>
                {ALL_TYPES.map((defender) => (
                  <td
                    key={`${attacker}-${defender}`}
                    className={`p-1 border-l ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}
                  >
                    {renderCell(attacker, defender)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default memo(TypeChart);
