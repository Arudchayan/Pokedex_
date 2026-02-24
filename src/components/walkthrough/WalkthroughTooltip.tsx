import { useEffect, useRef, useState, useCallback } from 'react';
import { usePokemonStore } from '../../store/usePokemonStore';
import Button from '../base/Button';
import type { TourStep } from '../../context/WalkthroughContext';

interface WalkthroughTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface Position {
  top: number;
  left: number;
}

type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export default function WalkthroughTooltip({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: WalkthroughTooltipProps) {
  const theme = usePokemonStore((s) => s.theme);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<Placement>(step.position);
  const isDark = theme === 'dark';
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  const calculatePosition = useCallback(() => {
    if (step.position === 'center') {
      setPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
      });
      setPlacement('center');
      return;
    }

    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      // Target not found, center the tooltip
      setPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
      });
      setPlacement('center');
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth || 320;
    const tooltipHeight = tooltipEl?.offsetHeight || 200;

    const gap = 16;
    let newPlacement: Placement = step.position;
    let top = 0;
    let left = 0;

    // Calculate preferred position
    switch (step.position) {
      case 'top':
        top = targetRect.top - tooltipHeight - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        // Flip to bottom if not enough space
        if (top < gap) {
          top = targetRect.bottom + gap;
          newPlacement = 'bottom';
        }
        break;
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        // Flip to top if not enough space
        if (top + tooltipHeight > window.innerHeight - gap) {
          top = targetRect.top - tooltipHeight - gap;
          newPlacement = 'top';
        }
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - gap;
        // Flip to right if not enough space
        if (left < gap) {
          left = targetRect.right + gap;
          newPlacement = 'right';
        }
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + gap;
        // Flip to left if not enough space
        if (left + tooltipWidth > window.innerWidth - gap) {
          left = targetRect.left - tooltipWidth - gap;
          newPlacement = 'left';
        }
        break;
    }

    // Clamp to viewport
    const padding = 16;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    setPosition({ top, left });
    setPlacement(newPlacement);
  }, [step.target, step.position]);

  useEffect(() => {
    calculatePosition();

    const handleResize = () => {
      requestAnimationFrame(calculatePosition);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [calculatePosition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onSkip]);

  const getArrowStyles = (): React.CSSProperties => {
    const arrowSize = 8;
    const base: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
    };

    switch (placement) {
      case 'top':
        return {
          ...base,
          bottom: -arrowSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid ${isDark ? '#1e293b' : '#ffffff'}`,
        };
      case 'bottom':
        return {
          ...base,
          top: -arrowSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid ${isDark ? '#1e293b' : '#ffffff'}`,
        };
      case 'left':
        return {
          ...base,
          right: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid ${isDark ? '#1e293b' : '#ffffff'}`,
        };
      case 'right':
        return {
          ...base,
          left: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid ${isDark ? '#1e293b' : '#ffffff'}`,
        };
      default:
        return base;
    }
  };

  const tooltipStyles: React.CSSProperties =
    placement === 'center'
      ? {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          maxWidth: 420,
          width: '90vw',
        }
      : {
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: 10000,
          maxWidth: 360,
          width: '90vw',
        };

  return (
    <div
      ref={tooltipRef}
      style={tooltipStyles}
      className={`rounded-xl shadow-2xl border-2 ${
        isDark
          ? 'bg-slate-900 border-primary-500 text-white'
          : 'bg-white border-primary-500 text-slate-900'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      {/* Arrow */}
      {placement !== 'center' && <div style={getArrowStyles()} aria-hidden="true" />}

      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isDark ? 'border-slate-700' : 'border-slate-200'
        }`}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
          Tour {stepIndex + 1} of {totalSteps}
        </span>
        <button
          onClick={onSkip}
          className={`text-xs hover:underline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          aria-label="Skip tour"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 id="tour-title" className="text-lg font-bold mb-2">
          {step.title}
        </h3>
        <div className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {step.content}
        </div>
      </div>

      {/* Footer */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-t ${
          isDark ? 'border-slate-700' : 'border-slate-200'
        }`}
      >
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === stepIndex
                  ? 'bg-primary-500'
                  : i < stepIndex
                    ? isDark
                      ? 'bg-slate-600'
                      : 'bg-slate-300'
                    : isDark
                      ? 'bg-slate-700'
                      : 'bg-slate-200'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="flex gap-2">
          {step.showPrevButton !== false && !isFirstStep && (
            <Button variant="secondary" size="sm" onClick={onPrev}>
              Back
            </Button>
          )}
          {step.showNextButton !== false && (
            <Button variant="primary" size="sm" onClick={onNext}>
              {isLastStep ? 'Finish' : 'Next'}
            </Button>
          )}
        </div>
      </div>

      {/* Keyboard hints */}
      <div
        className={`px-4 py-2 text-xs text-center border-t rounded-b-xl ${
          isDark
            ? 'border-slate-700 text-slate-500 bg-slate-800/50'
            : 'border-slate-200 text-slate-400 bg-slate-50'
        }`}
      >
        Press{' '}
        <kbd className={`px-1.5 py-0.5 rounded font-mono text-xs ${isDark ? 'bg-slate-700' : 'bg-white border'}`}>→</kbd>{' '}
        to continue,{' '}
        <kbd className={`px-1.5 py-0.5 rounded font-mono text-xs ${isDark ? 'bg-slate-700' : 'bg-white border'}`}>Esc</kbd>{' '}
        to skip
      </div>
    </div>
  );
}
