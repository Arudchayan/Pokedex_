import { useEffect, useState } from 'react';
import { useWalkthrough } from '../../context/WalkthroughContext';
import SpotlightOverlay from './SpotlightOverlay';
import WalkthroughTooltip from './WalkthroughTooltip';
import WalkthroughModal from './WalkthroughModal';

export default function WalkthroughManager() {
  const {
    isActive,
    currentTour,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    nextStep,
    prevStep,
    skipTour,
    markFirstVisitComplete,
    reopenWelcome,
  } = useWalkthrough();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-open welcome modal on first visit
  useEffect(() => {
    if (progress.isFirstVisit && !progress.hasSkippedOnboarding) {
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 1000); // Slight delay to let the app load
      return () => clearTimeout(timer);
    }
  }, [progress.isFirstVisit, progress.hasSkippedOnboarding]);

  // Handle welcome reopen request from badge
  const handleOpenWelcome = () => {
    reopenWelcome();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // If first visit and they close without starting, mark as handled
    if (progress.isFirstVisit) {
      markFirstVisitComplete();
    }
  };

  // Handle click outside spotlight
  const handleSpotlightClick = () => {
    // Optionally warn or just ignore
    // For now, we'll just continue - user can use skip button
  };

  // Expose handleOpenWelcome globally for badge access
  useEffect(() => {
    // Store reference for badge to access
    (window as any).__openWalkthroughModal = handleOpenWelcome;
    return () => {
      delete (window as any).__openWalkthroughModal;
    };
  }, []);

  return (
    <>
      {/* Welcome / Tour List Modal */}
      <WalkthroughModal isOpen={isModalOpen} onClose={handleCloseModal} />

      {/* Active Tour Overlay */}
      {isActive && currentStep && (
        <>
          <SpotlightOverlay
            targetSelector={currentStep.target}
            isActive={isActive}
            onClickOutside={handleSpotlightClick}
            padding={12}
            borderRadius={8}
          />
          <WalkthroughTooltip
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={totalSteps}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipTour}
          />
        </>
      )}
    </>
  );
}

// Export helper for badge
export function openWalkthroughModal() {
  if ((window as any).__openWalkthroughModal) {
    (window as any).__openWalkthroughModal();
  }
}
