import { useContext } from 'react';
import type { ReactNode } from 'react';
import type { MultiStepLayoutProps } from '../../types/stepper';
import { MultiStepContext, MultiStepProvider } from './MultiStepContext';
import { ProgressTrack } from './ProgressTrack';
import { StepContent } from './StepContent';
import { StepControls } from './StepControls';
import { StorageBadge } from './StorageBadge';

interface LayoutViewProps {
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  showProgressTrack?: boolean;
  showStepIndicators?: boolean;
  showControls?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  submitLabel?: string;
  children?: ReactNode;
}

/** Main wizard shell. It creates a provider unless already composed inside one. */
export function MultiStepLayout<TData>(props: MultiStepLayoutProps<TData>) {
  const existingContext = useContext(MultiStepContext);

  if (existingContext) {
    return <MultiStepLayoutInner {...props} />;
  }

  const {
    steps,
    initialData,
    initialStep,
    storageKey,
    storageVersion,
    storageType,
    persistState,
    allowNonLinearNavigation,
    variant,
    orientation,
    syncWithUrl,
    stepQueryParam,
    urlStepMode,
    onStepChange,
    onComplete,
    ...viewProps
  } = props;

  return (
    <MultiStepProvider<TData>
      steps={steps}
      initialData={initialData}
      initialStep={initialStep}
      storageKey={storageKey}
      storageVersion={storageVersion}
      storageType={storageType}
      persistState={persistState}
      allowNonLinearNavigation={allowNonLinearNavigation}
      variant={variant}
      orientation={orientation}
      syncWithUrl={syncWithUrl}
      stepQueryParam={stepQueryParam}
      urlStepMode={urlStepMode}
      onStepChange={onStepChange}
      onComplete={onComplete}
    >
      <MultiStepLayoutInner {...viewProps} />
    </MultiStepProvider>
  );
}

function MultiStepLayoutInner({
  className = '',
  header,
  footer,
  showProgressTrack = true,
  showStepIndicators = true,
  showControls = true,
  nextLabel,
  prevLabel,
  submitLabel,
  children,
}: LayoutViewProps) {
  return (
    <section
      id="multistep-layout-root"
      aria-label="Multi-step form"
      className={`w-full max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 md:p-9 ${className}`}
    >
      {header !== undefined ? header : (
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Interactive Setup Wizard
          </div>
          <StorageBadge />
        </div>
      )}

      {showProgressTrack && (
        <ProgressTrack className="mb-8" showIndicators={showStepIndicators} />
      )}

      {children ?? <StepContent className="min-h-[280px]" />}

      {showControls && (
        footer !== undefined ? footer : (
          <StepControls
            nextLabel={nextLabel}
            prevLabel={prevLabel}
            submitLabel={submitLabel}
          />
        )
      )}
    </section>
  );
}
