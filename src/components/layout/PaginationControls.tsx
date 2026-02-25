import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  theme: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  theme,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 py-6 sm:py-8">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg font-bold transition-all ${
            theme === 'dark'
              ? 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800'
              : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white'
          }`}
          aria-label="Previous Page"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>

        <span
          className={`font-mono font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
        >
          Page{' '}
          <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{currentPage}</span>{' '}
          of{' '}
          <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{totalPages}</span>
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg font-bold transition-all ${
            theme === 'dark'
              ? 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800'
              : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white'
          }`}
          aria-label="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Quick Jump Buttons (First/Last) if many pages */}
      {totalPages > 2 && (
        <div className="flex gap-2">
          {currentPage > 2 && (
            <button
              onClick={() => onPageChange(1)}
              className={`min-h-[44px] min-w-[44px] px-3 py-2 text-xs underline ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
            >
              First Page
            </button>
          )}
          {currentPage < totalPages - 1 && (
            <button
              onClick={() => onPageChange(totalPages)}
              className={`min-h-[44px] min-w-[44px] px-3 py-2 text-xs underline ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Last Page
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PaginationControls;
