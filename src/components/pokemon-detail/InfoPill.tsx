import React, { memo } from 'react';

interface InfoPillProps {
  label: string;
  value: React.ReactNode;
  theme: string;
}

const InfoPill: React.FC<InfoPillProps> = ({ label, value, theme }) => (
  <div
    className={`p-3 rounded-lg text-center h-full flex flex-col justify-center ${
      theme === 'dark' ? 'bg-black/10' : 'bg-slate-100'
    }`}
  >
    <p className={`text-xs capitalize ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
      {label}
    </p>
    <p
      className={`text-lg font-bold capitalize ${
        theme === 'dark' ? 'text-white' : 'text-slate-800'
      }`}
    >
      {value}
    </p>
  </div>
);

export default memo(InfoPill);
