import { useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AlertCircle, Check, Minus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useMultiStep } from './useMultiStep';

interface ProgressTrackProps {
  className?: string;
  showIndicators?: boolean;
}

export function ProgressTrack({
  className = '',
  showIndicators = true,
}: ProgressTrackProps) {
  const {
    steps,
    currentStep,
    currentStepPosition,
    activeStepCount,
    activeStepIndices,
    progress,
    goToStep,
    getStepStatus,
    orientation,
  } = useMultiStep();
  const shouldReduceMotion = useReducedMotion();
  const tabListRef = useRef<HTMLDivElement>(null);

  const focusIndicator = (index: number) => {
    tabListRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-step-index="${index}"]`)
      ?.focus();
  };

  const handleKeyDown = async (event: ReactKeyboardEvent, index: number) => {
    const position = activeStepIndices.indexOf(index);
    let targetPosition = position;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      targetPosition = (position + 1) % activeStepCount;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      targetPosition = (position - 1 + activeStepCount) % activeStepCount;
    } else if (event.key === 'Home') {
      targetPosition = 0;
    } else if (event.key === 'End') {
      targetPosition = activeStepCount - 1;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      await goToStep(index);
      return;
    } else {
      return;
    }

    event.preventDefault();
    const targetIndex = activeStepIndices[targetPosition];
    const navigated = await goToStep(targetIndex);
    if (navigated || targetIndex === currentStep) focusIndicator(targetIndex);
  };

  const isVertical = orientation === 'vertical';

  return (
    <div className={`w-full ${className}`} aria-label="Form completion progress">
      <div className="flex items-end justify-between gap-4 mb-2.5">
        <div>
          <span className="block text-xs font-bold tracking-wider uppercase text-slate-500 mb-0.5">
            Current Progress
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-900">
            Step {currentStepPosition + 1}: {steps[currentStep]?.title}
          </p>
        </div>
        <span className="text-xs sm:text-sm font-mono font-bold text-blue-600">
          {progress}% Complete
        </span>
      </div>

      <div
        id="multistep-progressbar"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`Step ${currentStepPosition + 1} of ${activeStepCount}: ${steps[currentStep]?.title}`}
        className="relative w-full h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden mb-6 border border-slate-200/60"
      >
        <motion.div
          className="absolute inset-y-0 left-0 bg-blue-600 rounded-full"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {showIndicators && (
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Multi-step navigation"
          aria-orientation={isVertical ? 'vertical' : 'horizontal'}
          className={`grid gap-2 sm:gap-3 ${isVertical ? 'grid-cols-1' : ''}`}
          style={{
            gridTemplateColumns: !isVertical
              ? `repeat(${Math.min(steps.length, 6)}, minmax(0, 1fr))`
              : undefined,
          }}
        >
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isCurrent = index === currentStep;
            const isCompleted = status === 'completed';
            const isInvalid = status === 'invalid';
            const isDisabled = status === 'disabled';
            const activePosition = activeStepIndices.indexOf(index);

            return (
              <button
                key={step.id}
                id={`step-tab-${step.id}`}
                data-step-index={index}
                role="tab"
                type="button"
                aria-label={`${step.title}${isDisabled ? ' (not applicable)' : ''}`}
                aria-selected={isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                aria-controls={`step-panel-${step.id}`}
                aria-invalid={isInvalid || undefined}
                aria-disabled={isDisabled || undefined}
                disabled={isDisabled}
                tabIndex={isCurrent ? 0 : -1}
                onClick={() => void goToStep(index)}
                onKeyDown={(event) => void handleKeyDown(event, index)}
                className={`group relative flex items-center gap-3 p-2.5 sm:p-3 text-left rounded-lg transition-all duration-150 border outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isInvalid
                    ? 'bg-red-50 text-red-900 border-red-300'
                    : isCurrent
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : isCompleted
                        ? 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        : isDisabled
                          ? 'bg-slate-50 text-slate-400 border-dashed border-slate-200 opacity-65 cursor-not-allowed'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold shrink-0 ${
                    isInvalid
                      ? 'bg-red-600 text-white'
                      : isCurrent
                        ? 'bg-white text-blue-600'
                        : isCompleted
                          ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-600'
                          : 'border-2 border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  {isInvalid ? <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    : isCompleted ? <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                      : isDisabled ? <Minus className="w-4 h-4" aria-hidden="true" />
                        : activePosition + 1}
                </span>

                <span className="min-w-0 flex-1 hidden sm:block">
                  {step.subLabel && (
                    <span className={`block text-[10px] font-bold tracking-wider uppercase truncate ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                      {step.subLabel}
                    </span>
                  )}
                  <span className={`block text-xs font-semibold truncate ${isCurrent && !isInvalid ? 'text-white' : ''}`}>
                    {step.title}{isDisabled ? ' (not applicable)' : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
