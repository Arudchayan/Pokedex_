import React from 'react';
import { usePokemon } from '../../context/PokemonContext';
import Modal from '../base/Modal';

interface NatureChartProps {
  onClose: () => void;
}

const NATURES = [
  { name: 'Hardy', up: 'None', down: 'None' },
  { name: 'Lonely', up: 'Attack', down: 'Defense' },
  { name: 'Brave', up: 'Attack', down: 'Speed' },
  { name: 'Adamant', up: 'Attack', down: 'Sp. Atk' },
  { name: 'Naughty', up: 'Attack', down: 'Sp. Def' },
  { name: 'Bold', up: 'Defense', down: 'Attack' },
  { name: 'Docile', up: 'None', down: 'None' },
  { name: 'Relaxed', up: 'Defense', down: 'Speed' },
  { name: 'Impish', up: 'Defense', down: 'Sp. Atk' },
  { name: 'Lax', up: 'Defense', down: 'Sp. Def' },
  { name: 'Timid', up: 'Speed', down: 'Attack' },
  { name: 'Hasty', up: 'Speed', down: 'Defense' },
  { name: 'Serious', up: 'None', down: 'None' },
  { name: 'Jolly', up: 'Speed', down: 'Sp. Atk' },
  { name: 'Naive', up: 'Speed', down: 'Sp. Def' },
  { name: 'Modest', up: 'Sp. Atk', down: 'Attack' },
  { name: 'Mild', up: 'Sp. Atk', down: 'Defense' },
  { name: 'Quiet', up: 'Sp. Atk', down: 'Speed' },
  { name: 'Bashful', up: 'None', down: 'None' },
  { name: 'Rash', up: 'Sp. Atk', down: 'Sp. Def' },
  { name: 'Calm', up: 'Sp. Def', down: 'Attack' },
  { name: 'Gentle', up: 'Sp. Def', down: 'Defense' },
  { name: 'Sassy', up: 'Sp. Def', down: 'Speed' },
  { name: 'Careful', up: 'Sp. Def', down: 'Sp. Atk' },
  { name: 'Quirky', up: 'None', down: 'None' },
];

const NatureChart: React.FC<NatureChartProps> = ({ onClose }) => {
  const { theme } = usePokemon();

  return (
    <Modal isOpen={true} onClose={onClose} title="Nature Chart" size="lg">
      <div className="overflow-y-auto pr-2 scrollbar-thin max-h-[70vh]">
        <table className="w-full text-left border-collapse">
          <thead className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
            <tr
              className={`border-b ${theme === 'dark' ? 'border-white/20 text-slate-400' : 'border-slate-300 text-slate-600'}`}
            >
              <th className="p-3">Nature</th>
              <th className="p-3 text-green-500">Increases (+10%)</th>
              <th className="p-3 text-red-500">Decreases (-10%)</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-slate-200'}`}
          >
            {NATURES.map((nature, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td
                  className={`p-3 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                >
                  {nature.name}
                </td>
                <td className="p-3 text-green-500 font-semibold">
                  {nature.up === 'None' ? '—' : nature.up}
                </td>
                <td className="p-3 text-red-500 font-semibold">
                  {nature.down === 'None' ? '—' : nature.down}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default NatureChart;
