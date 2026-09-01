import type React from 'react';

export type ValidationErrors = Record<string, string>;

/** A validator may return a field map, a form-level message, or a truthy result. */
export type ValidationResult =
  | boolean
  | string
  | ValidationErrors
  | null
  | undefined;

export type StepStatus =
  | 'upcoming'
  | 'current'
  | 'completed'
  | 'invalid'
  | 'disabled';

export type WizardOrientation = 'horizontal' | 'vertical';
export type WizardVariant = 'pills' | 'numbered' | 'dots' | 'minimal';
export type WizardStorageType = 'sessionStorage' | 'localStorage';
export type UrlStepMode = 'id' | 'index';
export type HistoryMode = 'push' | 'replace' | 'none';

export type DataUpdater<TData> = (
  updater: Partial<TData> | ((previous: TData) => Partial<TData>)
) => void;

export interface StepEvaluationContext<TData> {
  stepIndex: number;
  step: StepDefinition<TData>;
  steps: readonly StepDefinition<TData>[];
}

export interface ValidationContext<TData>
  extends StepEvaluationContext<TData> {
  totalSteps: number;
  activeStepIndices: readonly number[];
  allData: TData;
}

export interface StepComponentProps<TData> {
  data: TData;
  updateData: DataUpdater<TData>;
  errors: ValidationErrors;
  step: StepDefinition<TData>;
  stepIndex: number;
}

export type StepValidator<TData> = (
  data: TData,
  context: ValidationContext<TData>
) => ValidationResult | Promise<ValidationResult>;

export type StepAvailabilityPredicate<TData> = (
  data: TData,
  context: StepEvaluationContext<TData>
) => boolean;

export interface StepDefinition<TData = unknown> {
  /** Stable ID used by persistence, DOM relationships, and URL bookmarks. */
  id: string;
  title: string;
  description?: string;
  subLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Steps can consume these props or call useMultiStep<TData>(). */
  component: React.ComponentType<StepComponentProps<TData>> | React.ReactNode;
  /** Runs before leaving this step in the forward direction or submitting. */
  validate?: StepValidator<TData>;
  /** A skipped step remains visible as unavailable in the progress indicator. */
  shouldSkip?: StepAvailabilityPredicate<TData>;
  /** Equivalent positive-form predicate for conditional branching. */
  isEnabled?: StepAvailabilityPredicate<TData>;
  optional?: boolean;
}

export interface GoToStepOptions {
  /** Intended for trusted flows such as restoring application-controlled state. */
  skipValidation?: boolean;
  history?: HistoryMode;
}

export interface MultiStepContextValue<TData = unknown> {
  /** Index in the original step configuration array. */
  currentStep: number;
  /** Zero-based position among currently active steps. */
  currentStepPosition: number;
  /** Total number of configured steps, including conditionally disabled steps. */
  totalSteps: number;
  activeStepCount: number;
  currentStepConfig: StepDefinition<TData>;
  steps: readonly StepDefinition<TData>[];
  activeSteps: readonly StepDefinition<TData>[];
  activeStepIndices: readonly number[];
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isCompleted: boolean;
  hasSubmitted: boolean;
  completedSteps: readonly number[];
  visitedSteps: readonly number[];
  invalidSteps: readonly number[];
  formData: TData;
  updateFormData: DataUpdater<TData>;
  resetProgress: () => void;
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  goToStep: (
    targetIndex: number,
    options?: GoToStepOptions
  ) => Promise<boolean>;
  errors: ValidationErrors;
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
  setFieldError: (field: string, message: string) => void;
  clearFieldError: (field: string) => void;
  clearErrors: () => void;
  isValidating: boolean;
  isSubmitting: boolean;
  direction: 1 | -1;
  lastSavedAt: number | null;
  clearPersistedStorage: () => void;
  validateCurrentStep: () => Promise<boolean>;
  getStepStatus: (index: number) => StepStatus;
  isStepEnabled: (index: number) => boolean;
  orientation: WizardOrientation;
  variant: WizardVariant;
}

export interface MultiStepProviderProps<TData = unknown> {
  steps: readonly StepDefinition<TData>[];
  initialData: TData;
  initialStep?: number;
  storageKey?: string;
  storageVersion?: number;
  /** Defaults to sessionStorage to retain refreshes without leaking across sessions. */
  storageType?: WizardStorageType;
  persistState?: boolean;
  allowNonLinearNavigation?: boolean;
  variant?: WizardVariant;
  orientation?: WizardOrientation;
  /** Synchronize the active step with a query parameter and popstate. */
  syncWithUrl?: boolean;
  stepQueryParam?: string;
  /** ID mode is resilient to reordered or newly inserted steps. */
  urlStepMode?: UrlStepMode;
  onStepChange?: (newStepIndex: number, currentData: TData) => void;
  onComplete?: (finalData: TData) => void | Promise<void>;
  children: React.ReactNode;
}

export interface MultiStepLayoutProps<TData = unknown>
  extends Omit<MultiStepProviderProps<TData>, 'children'> {
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  showProgressTrack?: boolean;
  showStepIndicators?: boolean;
  showControls?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  submitLabel?: string;
  /** Replaces the default StepContent while retaining the layout shell. */
  children?: React.ReactNode;
}
