import React, { useContext } from 'react';
import { MultiStepLayoutProps } from '../../types/stepper';
import { MultiStepContext, MultiStepProvider } from './MultiStepContext';
import { ProgressTrack } from './ProgressTrack';
import { StepContent } from './StepContent';
import { StepControls } from './StepControls';
import { StorageBadge } from './StorageBadge';

export function MultiStepLayout<TData = any>(props: MultiStepLayoutProps<TData>) {
  const existingContext = useContext(MultiStepContext);

  if (existingContext) {
    return <MultiStepLayoutInner {...props} />;
  }

  const {
    steps,
    initialData,
    initialStep = 0,
    storageKey = 'multistep_wizard_state',
    storageVersion = 1,
    persistState = true,
    allowNonLinearNavigation = false,
    variant = 'pills',
    orientation = 'horizontal',
    onStepChange,
    onComplete,
    ...restProps
  } = props;

  return (
    <MultiStepProvider
      steps={steps}
      initialData={initialData}
      initialStep={initialStep}
      storageKey={storageKey}
      storageVersion={storageVersion}
      persistState={persistState}
      allowNonLinearNavigation={allowNonLinearNavigation}
      variant={variant}
      orientation={orientation}
      onStepChange={onStepChange}
      onComplete={onComplete}
    >
      <MultiStepLayoutInner {...restProps} />
    </MultiStepProvider>
  );
}

function MultiStepLayoutInner<TData = any>({
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
}: Partial<MultiStepLayoutProps<TData>>) {
  const context = useContext(MultiStepContext);

  return (
    <div
      id="multistep-layout-root"
      className={`w-full max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 md:p-9 ${className}`}
    >
      {/* Custom or Default Header with Storage Badge */}
      {header !== undefined ? (
        header
      ) : (
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Interactive Setup Wizard
          </div>
          <StorageBadge />
        </div>
      )}

      {/* Fluid Animated Progress Track */}
      {showProgressTrack && (
        <ProgressTrack
          className="mb-8"
          showIndicators={showStepIndicators}
        />
      )}

      {/* Active Step Content */}
      {children ? (
        children
      ) : (
        <StepContent className="min-h-[280px]" />
      )}

      {/* Footer Navigation Controls */}
      {showControls && (
        footer !== undefined ? (
          footer
        ) : (
          <StepControls
            nextLabel={nextLabel}
            prevLabel={prevLabel}
            submitLabel={submitLabel}
          />
        )
      )}
    </div>
  );
}

