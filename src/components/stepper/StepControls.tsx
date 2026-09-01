import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw } from 'lucide-react';
import { useMultiStep } from './useMultiStep';

interface StepControlsProps {
  nextLabel?: string;
  prevLabel?: string;
  submitLabel?: string;
  showReset?: boolean;
  className?: string;
}

export function StepControls({
  nextLabel = 'Continue',
  prevLabel = 'Back',
  submitLabel = 'Complete Setup',
  showReset = true,
  className = '',
}: StepControlsProps) {
  const {
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    resetProgress,
    isValidating,
    isSubmitting,
    hasSubmitted,
    errors,
  } = useMultiStep();
  const generalError = errors._form ?? errors._submit;
  const isBusy = isValidating || isSubmitting;

  return (
    <footer className={`mt-8 pt-6 border-t border-slate-200 ${className}`}>
      {generalError && (
        <div
          id="wizard-error-summary"
          role="alert"
          className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5"
        >
          <span className="font-semibold shrink-0">Unable to continue:</span>
          <span className="flex-1">{generalError}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!isFirstStep && (
            <button
              id="multistep-prev-btn"
              type="button"
              onClick={prevStep}
              disabled={isBusy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>{prevLabel}</span>
              <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded">
                Alt+←
              </kbd>
            </button>
          )}

          {showReset && !isFirstStep && (
            <button
              id="multistep-reset-btn"
              type="button"
              onClick={resetProgress}
              disabled={isBusy}
              title="Reset all form data and start over"
              className="inline-flex items-center justify-center p-2.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              aria-label="Reset progress"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          id="multistep-next-btn"
          type="button"
          onClick={() => void nextStep()}
          disabled={isBusy || hasSubmitted}
          aria-describedby={generalError ? 'wizard-error-summary' : undefined}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none"
        >
          {hasSubmitted ? (
            <>
              <span>Completed</span>
              <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </>
          ) : isBusy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>{isValidating ? 'Validating...' : 'Processing...'}</span>
            </>
          ) : isLastStep ? (
            <>
              <span>{submitLabel}</span>
              <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </>
          ) : (
            <>
              <span>{nextLabel}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-blue-200 bg-blue-700/80 border border-blue-500/50 rounded">
                Alt+→
              </kbd>
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
