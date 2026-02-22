import React from 'react';

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  theme: string;
}

const DetailSection: React.FC<DetailSectionProps> = ({ title, children, theme }) => (
  <div>
    <h3
      className={`text-xl font-bold mb-3 border-b-2 pb-1 ${
        theme === 'dark'
          ? 'text-primary-300 border-primary-300/20'
          : 'text-primary-600 border-primary-600/20'
      }`}
    >
      {title}
    </h3>
    {children}
  </div>
);

export default DetailSection;
