import React, { createContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  MultiStepContextValue,
  StepDefinition,
  StepStatus,
  ValidationResult,
} from '../../types/stepper';
import { useStepStorage } from './useStepStorage';

export const MultiStepContext = createContext<MultiStepContextValue<any> | null>(null);

export interface MultiStepProviderProps<TData = any> {
  steps: StepDefinition<TData>[];
  initialData: TData;
  initialStep?: number;
  storageKey?: string;
  storageVersion?: number;
  persistState?: boolean;
  allowNonLinearNavigation?: boolean;
  variant?: 'pills' | 'numbered' | 'dots' | 'minimal';
  orientation?: 'horizontal' | 'vertical';
  onStepChange?: (newStepIndex: number, currentData: TData) => void;
  onComplete?: (finalData: TData) => void | Promise<void>;
  children: React.ReactNode;
}

export function MultiStepProvider<TData = any>({
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
  children,
}: MultiStepProviderProps<TData>) {
  const totalSteps = steps.length;

  const {
    getInitialState,
    persistState: saveToStorage,
    clearStorage,
    lastSavedAt,
    restored,
    setRestored,
  } = useStepStorage<TData>({
    key: storageKey,
    version: storageVersion,
    initialData,
    initialStep,
    enabled: persistState,
  });

  const [initialLoaded, setInitialLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [visitedSteps, setVisitedSteps] = useState<number[]>([initialStep]);
  const [formData, setFormData] = useState<TData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Initialize from storage on mount
  useEffect(() => {
    const loaded = getInitialState();
    const validStep = Math.min(Math.max(0, loaded.step), totalSteps - 1);
    setCurrentStep(validStep);
    setCompletedSteps(loaded.completed);
    setVisitedSteps(loaded.visited);
    setFormData(loaded.data);
    if (loaded.restoredFromStorage) {
      setRestored(true);
    }
    setInitialLoaded(true);
  }, [getInitialState, setRestored, totalSteps]);

  // Sync state changes with localStorage
  useEffect(() => {
    if (!initialLoaded) return;
    saveToStorage(currentStep, completedSteps, visitedSteps, formData);
  }, [currentStep, completedSteps, visitedSteps, formData, initialLoaded, saveToStorage]);

  const currentStepConfig = steps[currentStep] || steps[0];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isCompleted = completedSteps.length === totalSteps;

  const progress = useMemo(() => {
    if (totalSteps <= 1) return 100;
    // Step completion percentage
    return Math.round((currentStep / (totalSteps - 1)) * 100);
  }, [currentStep, totalSteps]);

  // Set single field error
  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  // Clear single field error
  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Update form data and automatically clear field errors for updated fields
  const updateFormData = useCallback(
    (updater: Partial<TData> | ((prev: TData) => Partial<TData>)) => {
      setFormData((prev) => {
        const patch = typeof updater === 'function' ? updater(prev) : updater;
        const next = { ...prev, ...patch };

        // Clear errors corresponding to edited keys
        setErrors((prevErrors) => {
          if (Object.keys(prevErrors).length === 0) return prevErrors;
          const updatedErrorKeys = Object.keys(patch);
          const nextErrors = { ...prevErrors };
          let changed = false;
          updatedErrorKeys.forEach((key) => {
            if (key in nextErrors) {
              delete nextErrors[key];
              changed = true;
            }
          });
          return changed ? nextErrors : prevErrors;
        });

        return next;
      });
    },
    []
  );

  // Validate a specific step given its index
  const validateStep = useCallback(
    async (stepIndex: number, data: TData): Promise<{ isValid: boolean; newErrors: Record<string, string> }> => {
      const stepDef = steps[stepIndex];
      if (!stepDef || !stepDef.validate) {
        return { isValid: true, newErrors: {} };
      }

      try {
        setIsValidating(true);
        const result: ValidationResult = await stepDef.validate(data, {
          stepIndex,
          totalSteps,
          allData: data,
        });

        if (result === true || result === null || result === undefined) {
          return { isValid: true, newErrors: {} };
        }

        if (typeof result === 'string') {
          return {
            isValid: false,
            newErrors: { _form: result },
          };
        }

        if (typeof result === 'object') {
          const hasKeys = Object.keys(result).length > 0;
          return {
            isValid: !hasKeys,
            newErrors: result,
          };
        }

        if (result === false) {
          return {
            isValid: false,
            newErrors: { _form: 'Please complete all required fields correctly.' },
          };
        }

        return { isValid: true, newErrors: {} };
      } catch (err: any) {
        return {
          isValid: false,
          newErrors: { _form: err?.message || 'An unexpected error occurred during validation.' },
        };
      } finally {
        setIsValidating(false);
      }
    },
    [steps, totalSteps]
  );

  // Validate the current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const { isValid, newErrors } = await validateStep(currentStep, formData);
    setErrors(newErrors);
    return isValid;
  }, [currentStep, formData, validateStep]);

  // Navigate to next step
  const nextStep = useCallback(async (): Promise<boolean> => {
    const { isValid, newErrors } = await validateStep(currentStep, formData);
    if (!isValid) {
      setErrors(newErrors);
      return false;
    }

    setErrors({});

    // Mark current step as completed
    setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));

    if (isLastStep) {
      // Form complete!
      setIsSubmitting(true);
      try {
        if (onComplete) {
          await onComplete(formData);
        }
      } catch (err: any) {
        setErrors({ _submit: err?.message || 'Submission failed. Please try again.' });
        setIsSubmitting(false);
        return false;
      } finally {
        setIsSubmitting(false);
      }
      return true;
    }

    const nextIndex = currentStep + 1;
    setDirection(1);
    setCurrentStep(nextIndex);
    setVisitedSteps((prev) => (prev.includes(nextIndex) ? prev : [...prev, nextIndex]));
    onStepChange?.(nextIndex, formData);
    return true;
  }, [currentStep, formData, isLastStep, onComplete, onStepChange, validateStep]);

  // Navigate to previous step
  const prevStep = useCallback(() => {
    if (currentStep <= 0) return;
    const prevIndex = currentStep - 1;
    setDirection(-1);
    setErrors({});
    setCurrentStep(prevIndex);
    onStepChange?.(prevIndex, formData);
  }, [currentStep, formData, onStepChange]);

  // Direct step jump
  const goToStep = useCallback(
    async (targetIndex: number, options?: { skipValidation?: boolean }): Promise<boolean> => {
      if (targetIndex < 0 || targetIndex >= totalSteps || targetIndex === currentStep) {
        return false;
      }

      // If jumping forward and validation is not skipped
      if (targetIndex > currentStep && !options?.skipValidation && !allowNonLinearNavigation) {
        // Validate current step first
        const { isValid, newErrors } = await validateStep(currentStep, formData);
        if (!isValid) {
          setErrors(newErrors);
          return false;
        }
      }

      setDirection(targetIndex > currentStep ? 1 : -1);
      setErrors({});
      setCurrentStep(targetIndex);
      setVisitedSteps((prev) => (prev.includes(targetIndex) ? prev : [...prev, targetIndex]));
      onStepChange?.(targetIndex, formData);
      return true;
    },
    [allowNonLinearNavigation, currentStep, formData, onStepChange, totalSteps, validateStep]
  );

  // Reset entire progress
  const resetProgress = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setVisitedSteps([0]);
    setFormData(initialData);
    setErrors({});
    clearStorage();
    onStepChange?.(0, initialData);
  }, [clearStorage, initialData, onStepChange]);

  // Determine step status
  const getStepStatus = useCallback(
    (index: number): StepStatus => {
      if (index === currentStep) {
        return Object.keys(errors).length > 0 ? 'invalid' : 'current';
      }
      if (completedSteps.includes(index)) {
        return 'completed';
      }
      return 'upcoming';
    },
    [completedSteps, currentStep, errors]
  );

  const value: MultiStepContextValue<TData> = {
    currentStep,
    totalSteps,
    currentStepConfig,
    steps,
    progress,
    isFirstStep,
    isLastStep,
    isCompleted,
    completedSteps,
    visitedSteps,
    formData,
    updateFormData,
    resetProgress,
    nextStep,
    prevStep,
    goToStep,
    errors,
    setErrors,
    setFieldError,
    clearFieldError,
    clearErrors,
    isValidating,
    isSubmitting,
    setIsSubmitting,
    direction,
    lastSavedAt,
    clearPersistedStorage: clearStorage,
    validateCurrentStep,
    getStepStatus,
    orientation,
    variant,
  };

  return <MultiStepContext.Provider value={value}>{children}</MultiStepContext.Provider>;
}
