import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { StepComponentProps } from '../../types/stepper';
import { useMultiStep } from './useMultiStep';

interface StepContentProps {
  className?: string;
  enableKeyboardNavigation?: boolean;
}

export function StepContent({
  className = '',
  enableKeyboardNavigation = true,
}: StepContentProps) {
  const context = useMultiStep();
  const {
    currentStep,
    currentStepPosition,
    currentStepConfig,
    activeStepCount,
    direction,
    nextStep,
    prevStep,
    isSubmitting,
    isValidating,
  } = context;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Moving focus makes the new context immediately discoverable to keyboard and
  // screen-reader users. The heading itself is not added to the normal tab order.
  useEffect(() => {
    headingRef.current?.focus();
  }, [currentStep]);

  useEffect(() => {
    if (!enableKeyboardNavigation) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSubmitting || isValidating) return;
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        void nextStep();
      } else if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        prevStep();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        void nextStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, isSubmitting, isValidating, nextStep, prevStep]);

  const StepComponent = currentStepConfig.component;
  const componentProps: StepComponentProps<unknown> = {
    data: context.formData,
    updateData: context.updateFormData,
    errors: context.errors,
    step: currentStepConfig,
    stepIndex: currentStep,
  };

  return (
    <div
      id={`step-panel-${currentStepConfig.id}`}
      role="tabpanel"
      aria-labelledby={`step-tab-${currentStepConfig.id}`}
      aria-busy={isValidating || isSubmitting}
      className={`relative w-full outline-none ${className}`}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Step {currentStepPosition + 1} of {activeStepCount}: {currentStepConfig.title}.
        {' '}{currentStepConfig.description ?? ''}
      </div>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={currentStepConfig.id}
          custom={direction}
          variants={{
            enter: (transitionDirection: number) => ({
              x: shouldReduceMotion ? 0 : transitionDirection > 0 ? 30 : -30,
              opacity: shouldReduceMotion ? 1 : 0,
            }),
            center: { x: 0, opacity: 1 },
            exit: (transitionDirection: number) => ({
              x: shouldReduceMotion ? 0 : transitionDirection > 0 ? -30 : 30,
              opacity: shouldReduceMotion ? 1 : 0,
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          onAnimationComplete={() => headingRef.current?.focus()}
          transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: 'easeOut' }}
          className="w-full"
        >
          <header className="mb-6">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
            >
              {currentStepConfig.title}
            </h2>
            {currentStepConfig.description && (
              <p className="mt-1 text-sm text-neutral-600 leading-relaxed max-w-2xl">
                {currentStepConfig.description}
              </p>
            )}
          </header>

          <div className="w-full">
            {typeof StepComponent === 'function'
              ? <StepComponent {...componentProps} />
              : StepComponent}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
