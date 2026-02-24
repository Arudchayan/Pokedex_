import React, { memo } from 'react';
import { TYPE_COLORS_HEX } from '../../constants';

interface StatBarProps {
  name: string;
  value: number;
  theme?: 'dark' | 'light';
}

const StatBar: React.FC<StatBarProps> = ({ name, value, theme = 'dark' }) => {
  const maxStat = 255;
  const percentage = (value / maxStat) * 100;

  // A mapping to give stats distinct, vibrant colors for the new UI
  const statToTypeColorMap: { [key: string]: string } = {
    hp: 'grass',
    attack: 'fire',
    defense: 'electric',
    'special-attack': 'psychic',
    'special-defense': 'water',
    speed: 'ice',
  };

  const statColorHex = TYPE_COLORS_HEX[statToTypeColorMap[name] || 'normal'];

  return (
    <div className="flex items-center gap-2 w-full">
      <span
        className={`w-1/3 text-sm font-semibold capitalize text-right ${theme === 'dark' ? 'text-slate-200' : 'text-slate-600'}`}
      >
        {name.replace('-', ' ')}
      </span>
      <div className="w-2/3 flex items-center gap-2">
        <span className={`font-bold w-8 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          {value}
        </span>
        <div
          className={`w-full h-2.5 rounded-full ${theme === 'dark' ? 'bg-black/20' : 'bg-slate-200'}`}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: statColorHex,
              boxShadow: `0 0 8px ${statColorHex}`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default memo(StatBar);
