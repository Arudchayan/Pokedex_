import { useEffect, useRef, useCallback, useId } from 'react';
import ReactDOM from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw]',
};

function Modal({
  isOpen,
  onClose,
  title,
  size = 'lg',
  children,
  headerActions,
  className = '',
}: ModalProps) {
  const titleId = useId();
  const previousFocusRef = useRef<Element | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Capture the previously-focused element when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      // Restore body scroll
      document.body.style.overflow = originalOverflow;

      // Restore focus
      const el = previousFocusRef.current;
      if (el && el instanceof HTMLElement) {
        el.focus();
      }
    };
  }, [isOpen]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Focus trap: keep Tab / Shift+Tab cycling within the modal
  useEffect(() => {
    if (!isOpen) return;

    const modal = contentRef.current;
    if (!modal) return;

    const focusableSelectors =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modal.querySelectorAll(focusableSelectors);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);

    // Auto-focus the first focusable element (typically the close button)
    const firstFocusable = modal.querySelector(focusableSelectors) as HTMLElement;
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 50);
    }

    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      ref={contentRef}
      className="fixed inset-0 z-[1050] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div
        className={[
          'relative w-full',
          sizeClasses[size],
          'bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto',
          'animate-modal-enter',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-t-2xl">
          <h2
            id={titleId}
            className="text-lg font-semibold text-slate-900 dark:text-white truncate flex-1"
          >
            {title}
          </h2>

          <div className="flex items-center gap-2">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4">{children}</div>
      </div>

      {/* Inline keyframes for the enter animation */}
      <style>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.2s ease-out;
        }
      `}</style>
    </div>,
    document.body
  );
}

export default Modal;
