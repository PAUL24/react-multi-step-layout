import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMultiStep } from './useMultiStep';

interface StepContentProps {
  className?: string;
  enableKeyboardNavigation?: boolean;
}

export const StepContent: React.FC<StepContentProps> = ({
  className = '',
  enableKeyboardNavigation = true,
}) => {
  const {
    currentStep,
    currentStepConfig,
    totalSteps,
    direction,
    nextStep,
    prevStep,
    isSubmitting,
    isValidating,
  } = useMultiStep();

  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus heading or container when step changes for accessibility
  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    } else if (containerRef.current) {
      containerRef.current.focus();
    }
  }, [currentStep]);

  // Global keyboard shortcuts within the wizard container
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Alt + ArrowRight -> Next step
      if (e.altKey && e.key === 'ArrowRight' && !isSubmitting && !isValidating) {
        e.preventDefault();
        nextStep();
      }
      // Alt + ArrowLeft -> Previous step
      else if (e.altKey && e.key === 'ArrowLeft' && !isSubmitting && !isValidating) {
        e.preventDefault();
        prevStep();
      }
      // Ctrl/Cmd + Enter -> Advance/Submit if in an input
      else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting && !isValidating) {
        e.preventDefault();
        nextStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, isSubmitting, isValidating, nextStep, prevStep]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -30 : 30,
      opacity: 0,
    }),
  };

  const StepComponent = currentStepConfig.component;

  return (
    <div
      ref={containerRef}
      id={`step-panel-${currentStepConfig.id || currentStep}`}
      role="tabpanel"
      aria-labelledby={`step-tab-${currentStepConfig.id || currentStep}`}
      tabIndex={-1}
      className={`relative w-full outline-none focus:outline-none ${className}`}
    >
      {/* Screen Reader Live Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Step {currentStep + 1} of {totalSteps}: {currentStepConfig.title}.{' '}
        {currentStepConfig.description || ''}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStepConfig.id || currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full"
        >
          {/* Step Header */}
          <div className="mb-6">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 rounded-md"
            >
              {currentStepConfig.title}
            </h2>
            {currentStepConfig.description && (
              <p className="mt-1 text-sm text-neutral-600 leading-relaxed max-w-2xl">
                {currentStepConfig.description}
              </p>
            )}
          </div>

          {/* Step Body */}
          <div className="w-full">
            {typeof StepComponent === 'function' ? (
              <StepComponent />
            ) : React.isValidElement(StepComponent) ? (
              StepComponent
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
