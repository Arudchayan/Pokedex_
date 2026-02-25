import React, { useState } from 'react';

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  theme: string;
  defaultOpen?: boolean;
}

const DetailSection: React.FC<DetailSectionProps> = ({ title, children, theme, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left sm:cursor-default group`}
        aria-expanded={isOpen}
      >
        <h3
          className={`text-lg sm:text-xl font-bold pb-1 ${
            theme === 'dark'
              ? 'text-primary-300'
              : 'text-primary-600'
          }`}
        >
          {title}
        </h3>
        <svg
          className={`w-4 h-4 sm:hidden transition-transform flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          } ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`border-b-2 mb-3 ${theme === 'dark' ? 'border-primary-300/20' : 'border-primary-600/20'}`} />
      <div className={`${isOpen ? 'block' : 'hidden sm:block'}`}>
        {children}
      </div>
    </div>
  );
};

export default DetailSection;
