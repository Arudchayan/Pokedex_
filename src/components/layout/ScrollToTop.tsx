import React, { useState, useEffect } from 'react';
import { usePokemon } from '../../context/PokemonContext';

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = usePokemon();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-40 p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
        theme === 'dark'
          ? 'bg-primary-600 hover:bg-primary-500 text-white ring-1 ring-white/10'
          : 'bg-primary-500 hover:bg-primary-600 text-white ring-1 ring-black/10'
      }`}
      aria-label="Scroll to top"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
};

export default ScrollToTop;
