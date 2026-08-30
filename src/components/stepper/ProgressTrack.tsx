import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Check, AlertCircle } from 'lucide-react';
import { useMultiStep } from './useMultiStep';

interface ProgressTrackProps {
  className?: string;
  showIndicators?: boolean;
}

export const ProgressTrack: React.FC<ProgressTrackProps> = ({
  className = '',
  showIndicators = true,
}) => {
  const {
    steps,
    currentStep,
    totalSteps,
    progress,
    goToStep,
    getStepStatus,
    variant,
    orientation,
  } = useMultiStep();

  const tabListRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation across step indicator tabs
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      targetIndex = (index + 1) % totalSteps;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      targetIndex = (index - 1 + totalSteps) % totalSteps;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = totalSteps - 1;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToStep(index);
      return;
    } else {
      return;
    }

    goToStep(targetIndex);
    // Focus the target tab button
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
    if (buttons && buttons[targetIndex]) {
      buttons[targetIndex].focus();
    }
  };

  const isVertical = orientation === 'vertical';

  return (
    <div
      id="multistep-progress-container"
      className={`w-full ${className}`}
      aria-label="Form completion progress"
    >
      {/* Top Header & Percentage Indicator */}
      <div className="flex items-end justify-between gap-4 mb-2.5">
        <div>
          <span className="block text-xs font-bold tracking-wider uppercase text-slate-500 mb-0.5">
            Current Progress
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-900">
            Step {currentStep + 1}: {steps[currentStep]?.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-mono font-bold text-blue-600">
            {progress}% Complete
          </span>
        </div>
      </div>

      {/* Fluid Animated Progress Track Bar */}
      <div
        id="multistep-progressbar"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`Step ${currentStep + 1} of ${totalSteps}: ${steps[currentStep]?.title} (${progress}% completed)`}
        className="relative w-full h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden mb-6 border border-slate-200/60"
      >
        <motion.div
          id="multistep-progress-fill"
          className="absolute top-0 bottom-0 left-0 bg-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Step Indicators */}
      {showIndicators && (
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Multi-step navigation"
          aria-orientation={isVertical ? 'vertical' : 'horizontal'}
          className={`grid gap-2 sm:gap-3 ${
            isVertical
              ? 'grid-cols-1'
              : totalSteps <= 4
              ? `grid-cols-${totalSteps} sm:grid-cols-${totalSteps}`
              : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'
          }`}
          style={{
            gridTemplateColumns: !isVertical && totalSteps > 0
              ? `repeat(${Math.min(totalSteps, 6)}, minmax(0, 1fr))`
              : undefined,
          }}
        >
          {steps.map((step, idx) => {
            const status = getStepStatus(idx);
            const isCurrent = idx === currentStep;
            const isCompleted = status === 'completed';
            const isInvalid = status === 'invalid';
            const StepIcon = step.icon;

            return (
              <button
                key={step.id || idx}
                id={`step-tab-${step.id || idx}`}
                role="tab"
                type="button"
                aria-selected={isCurrent}
                aria-controls={`step-panel-${step.id || idx}`}
                tabIndex={isCurrent ? 0 : -1}
                onClick={() => goToStep(idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`group relative flex items-center gap-3 p-2.5 sm:p-3 text-left rounded-lg transition-all duration-150 border cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : isCompleted
                    ? 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    : isInvalid
                    ? 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100/80'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                {/* Node Badge / Number / Icon */}
                <div
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-white text-blue-600 shadow-xs'
                      : isCompleted
                      ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-600'
                      : isInvalid
                      ? 'bg-red-600 text-white'
                      : 'border-2 border-slate-200 bg-slate-50 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                  ) : isInvalid ? (
                    <AlertCircle className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Labels */}
                <div className="min-w-0 flex-1 hidden sm:block">
                  {step.subLabel && (
                    <p
                      className={`text-[10px] font-bold tracking-wider uppercase truncate ${
                        isCurrent ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {step.subLabel}
                    </p>
                  )}
                  <p
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
