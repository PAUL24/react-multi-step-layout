import React from 'react';

/**
 * Validation result returned by step validation functions.
 * Can be a boolean, an error message string, an object map of field-level errors, or null/undefined.
 */
export type ValidationResult =
  | boolean
  | string
  | Record<string, string>
  | null
  | undefined;

export interface ValidationContext<TData = any> {
  stepIndex: number;
  totalSteps: number;
  allData: TData;
}

export type StepValidator<TData = any> = (
  data: TData,
  context: ValidationContext<TData>
) => ValidationResult | Promise<ValidationResult>;

export interface StepDefinition<TData = any> {
  /** Unique identifier for the step */
  id: string;
  /** Human-readable title */
  title: string;
  /** Optional subtitle or description */
  description?: string;
  /** Optional category or sub-label (e.g. "Security", "Phase 1") */
  subLabel?: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Component or render function to display for this step */
  component: React.ComponentType<any> | React.ReactNode;
  /** Optional validation function executed before advancing */
  validate?: StepValidator<TData>;
  /** Whether this step is optional */
  optional?: boolean;
}

export type StepStatus = 'upcoming' | 'current' | 'completed' | 'invalid';

export interface MultiStepState<TData = any> {
  currentStep: number;
  completedSteps: number[];
  visitedSteps: number[];
  formData: TData;
  errors: Record<string, string>;
  isValidating: boolean;
  isSubmitting: boolean;
  direction: 1 | -1;
  lastSavedAt: number | null;
}

export interface MultiStepContextValue<TData = any> {
  /** Current active step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Current step configuration */
  currentStepConfig: StepDefinition<TData>;
  /** Step array definition */
  steps: StepDefinition<TData>[];
  /** Progress percentage between 0 and 100 */
  progress: number;
  /** True if currently on the first step */
  isFirstStep: boolean;
  /** True if currently on the last step */
  isLastStep: boolean;
  /** True if all steps have been completed */
  isCompleted: boolean;
  /** Indices of completed steps */
  completedSteps: number[];
  /** Indices of visited steps */
  visitedSteps: number[];
  /** Current shared form data */
  formData: TData;
  /** Update partial form data */
  updateFormData: (
    updater: Partial<TData> | ((prev: TData) => Partial<TData>)
  ) => void;
  /** Reset form data and step index */
  resetProgress: () => void;
  /** Advance to the next step after running current step validation */
  nextStep: () => Promise<boolean>;
  /** Navigate back to the previous step */
  prevStep: () => void;
  /** Jump directly to a specific step index */
  goToStep: (
    targetIndex: number,
    options?: { skipValidation?: boolean }
  ) => Promise<boolean>;
  /** Field-level errors for the current step */
  errors: Record<string, string>;
  /** Set or update errors */
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** Set a single field error */
  setFieldError: (field: string, message: string) => void;
  /** Clear specific field errors */
  clearFieldError: (field: string) => void;
  /** Clear all current errors */
  clearErrors: () => void;
  /** True when async validation is running */
  isValidating: boolean;
  /** True when final form submission is in progress */
  isSubmitting: boolean;
  /** Set submission loading state */
  setIsSubmitting: (isSubmitting: boolean) => void;
  /** Transition direction: 1 (forward) or -1 (backward) */
  direction: 1 | -1;
  /** Timestamp when state was last persisted to localStorage */
  lastSavedAt: number | null;
  /** Clear persisted localStorage cache */
  clearPersistedStorage: () => void;
  /** Trigger validation on current step without advancing */
  validateCurrentStep: () => Promise<boolean>;
  /** Get status of a specific step index */
  getStepStatus: (index: number) => StepStatus;
  /** Orientation of the layout */
  orientation: 'horizontal' | 'vertical';
  /** Visual variant of step indicators */
  variant: 'pills' | 'numbered' | 'dots' | 'minimal';
}

export interface MultiStepLayoutProps<TData = any> {
  /** Array of step configurations */
  steps: StepDefinition<TData>[];
  /** Initial form data state */
  initialData: TData;
  /** Initial step index (defaults to 0) */
  initialStep?: number;
  /** Storage key for localStorage persistence */
  storageKey?: string;
  /** Schema version for cache invalidation */
  storageVersion?: number;
  /** Enable automatic persistence to localStorage (defaults to true) */
  persistState?: boolean;
  /** Allow clicking on future or unvisited steps without strict sequential validation */
  allowNonLinearNavigation?: boolean;
  /** Visual progress bar variant */
  variant?: 'pills' | 'numbered' | 'dots' | 'minimal';
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Callback fired whenever step changes */
  onStepChange?: (newStepIndex: number, currentData: TData) => void;
  /** Callback fired when final step is submitted successfully */
  onComplete?: (finalData: TData) => void | Promise<void>;
  /** Optional custom CSS classes */
  className?: string;
  /** Optional custom header above progress bar */
  header?: React.ReactNode;
  /** Optional custom footer below step content */
  footer?: React.ReactNode;
  /** Show top progress track bar (defaults to true) */
  showProgressTrack?: boolean;
  /** Show step indicator buttons (defaults to true) */
  showStepIndicators?: boolean;
  /** Show default next/prev buttons (defaults to true) */
  showControls?: boolean;
  /** Custom label for Next button */
  nextLabel?: string;
  /** Custom label for Previous button */
  prevLabel?: string;
  /** Custom label for Submit button */
  submitLabel?: string;
  /** Render children instead of default step component */
  children?: React.ReactNode;
}
