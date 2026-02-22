import React, { useState, useEffect } from 'react';
import announcementData from '../../data/announcements.json';
import { usePokemon } from '../../context/PokemonContext';

const AnnouncementBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = usePokemon();

  useEffect(() => {
    const hiddenId = localStorage.getItem('hiddenAnnouncementId');
    if (hiddenId !== announcementData.id) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('hiddenAnnouncementId', announcementData.id);
  };

  // Hidden for now
  if (true) return null;

  if (!isVisible) return null;

  return (
    <div
      role="banner"
      aria-label="Site Announcement"
      className={`relative w-full z-50 py-3 px-4 flex items-center justify-between transition-colors ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-primary-600/30 to-primary-500/20 border-b border-primary-500/25 text-white'
          : 'bg-gradient-to-r from-primary-400/20 to-primary-300/10 border-b border-primary-500/25 text-slate-900'
      } backdrop-blur-md shadow-sm`}
    >
      <div className="flex-1 flex justify-center items-center gap-2 text-sm font-medium">
        <span className="inline-block p-1 bg-primary-500/20 rounded-full">
            <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
        </span>
        <p className="text-center">
            {announcementData.message}
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className={`ml-4 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            theme === 'dark' ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-black/5 text-primary-600 hover:text-primary-600'
        }`}
        aria-label="Dismiss announcement"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default AnnouncementBanner;
