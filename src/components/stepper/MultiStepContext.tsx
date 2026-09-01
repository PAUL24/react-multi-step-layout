import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  GoToStepOptions,
  HistoryMode,
  MultiStepContextValue,
  MultiStepProviderProps,
  StepDefinition,
  StepStatus,
  UrlStepMode,
  ValidationErrors,
  ValidationResult,
} from '../../types/stepper';
import { useStepStorage } from './useStepStorage';

// The context is type-erased here and restored by useMultiStep<TData>(). This is
// the only cast boundary required to offer a generic React Context API.
export const MultiStepContext = createContext<unknown>(null);

function getActiveStepIndices<TData>(
  steps: readonly StepDefinition<TData>[],
  data: TData
): number[] {
  return steps.reduce<number[]>((active, step, stepIndex) => {
    const context = { stepIndex, step, steps };
    const enabled = step.isEnabled?.(data, context) ?? true;
    const skipped = step.shouldSkip?.(data, context) ?? false;
    if (enabled && !skipped) active.push(stepIndex);
    return active;
  }, []);
}

function closestActiveIndex(preferred: number, activeIndices: readonly number[]): number {
  if (activeIndices.includes(preferred)) return preferred;
  return activeIndices.find((index) => index > preferred)
    ?? activeIndices[activeIndices.length - 1];
}

function urlStepIndex<TData>(
  steps: readonly StepDefinition<TData>[],
  queryParam: string,
  mode: UrlStepMode
): number | null {
  if (typeof window === 'undefined') return null;
  const value = new URL(window.location.href).searchParams.get(queryParam);
  if (!value) return null;

  const byId = steps.findIndex((step) => step.id === value);
  const numeric = Number(value);
  const byOneBasedIndex = Number.isInteger(numeric) ? numeric - 1 : -1;
  const primary = mode === 'id' ? byId : byOneBasedIndex;
  const fallback = mode === 'id' ? byOneBasedIndex : byId;
  const resolved = primary >= 0 ? primary : fallback;
  return resolved >= 0 && resolved < steps.length ? resolved : null;
}

function normalizeValidation(result: ValidationResult): {
  isValid: boolean;
  errors: ValidationErrors;
} {
  if (result === true || result === null || result === undefined) {
    return { isValid: true, errors: {} };
  }
  if (result === false) {
    return {
      isValid: false,
      errors: { _form: 'Please complete all required fields correctly.' },
    };
  }
  if (typeof result === 'string') {
    return { isValid: false, errors: { _form: result } };
  }
  return { isValid: Object.keys(result).length === 0, errors: result };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function MultiStepProvider<TData>({
  steps,
  initialData,
  initialStep = 0,
  storageKey = 'multistep_wizard_state',
  storageVersion = 1,
  storageType = 'sessionStorage',
  persistState = true,
  allowNonLinearNavigation = false,
  variant = 'pills',
  orientation = 'horizontal',
  syncWithUrl = true,
  stepQueryParam = 'step',
  urlStepMode = 'id',
  onStepChange,
  onComplete,
  children,
}: MultiStepProviderProps<TData>) {
  if (steps.length === 0) {
    throw new Error('MultiStepProvider requires at least one step.');
  }

  const {
    getInitialState,
    persistState: saveToStorage,
    clearStorage,
    lastSavedAt,
  } = useStepStorage<TData>({
    key: storageKey,
    version: storageVersion,
    initialData,
    initialStep,
    enabled: persistState,
    storageType,
  });

  const [initialSnapshot] = useState(() => {
    const restored = getInitialState();
    const active = getActiveStepIndices(steps, restored.data);
    if (active.length === 0) {
      throw new Error('MultiStepProvider requires at least one enabled step.');
    }
    const fromUrl = syncWithUrl
      ? urlStepIndex(steps, stepQueryParam, urlStepMode)
      : null;
    const requested = fromUrl ?? restored.step;
    const current = closestActiveIndex(requested, active);
    return { ...restored, current };
  });

  const [currentStep, setCurrentStep] = useState(initialSnapshot.current);
  const [completedSteps, setCompletedSteps] = useState<number[]>(
    initialSnapshot.completed.filter((index) => index >= 0 && index < steps.length)
  );
  const [visitedSteps, setVisitedSteps] = useState<number[]>(() =>
    Array.from(new Set([...initialSnapshot.visited, initialSnapshot.current]))
  );
  const [invalidSteps, setInvalidSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<TData>(initialSnapshot.data);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const navigationRun = useRef(0);
  const busy = useRef(false);
  const submitted = useRef(false);
  const skipNextPersistence = useRef(false);

  const totalSteps = steps.length;
  const activeStepIndices = useMemo(
    () => getActiveStepIndices(steps, formData),
    [formData, steps]
  );

  if (activeStepIndices.length === 0) {
    throw new Error('MultiStepProvider requires at least one enabled step.');
  }

  const activeSteps = useMemo(
    () => activeStepIndices.map((index) => steps[index]),
    [activeStepIndices, steps]
  );
  const currentStepPosition = activeStepIndices.indexOf(currentStep);
  const safePosition = currentStepPosition >= 0 ? currentStepPosition : 0;
  const currentStepConfig = steps[currentStep] ?? activeSteps[0];
  const activeStepCount = activeStepIndices.length;
  const isFirstStep = safePosition === 0;
  const isLastStep = safePosition === activeStepCount - 1;
  const isCompleted = activeStepIndices.every((index) => completedSteps.includes(index));
  const progress = activeStepCount <= 1
    ? 100
    : Math.round((safePosition / (activeStepCount - 1)) * 100);

  const updateUrl = useCallback((index: number, historyMode: HistoryMode) => {
    if (!syncWithUrl || historyMode === 'none' || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const value = urlStepMode === 'id' ? steps[index].id : String(index + 1);
    if (url.searchParams.get(stepQueryParam) === value) return;
    url.searchParams.set(stepQueryParam, value);
    const method = historyMode === 'replace' ? 'replaceState' : 'pushState';
    window.history[method](window.history.state, '', url);
  }, [stepQueryParam, steps, syncWithUrl, urlStepMode]);

  const commitStep = useCallback((
    targetIndex: number,
    historyMode: HistoryMode = 'push',
    callbackData: TData = formData
  ) => {
    setDirection(targetIndex >= currentStep ? 1 : -1);
    setErrors({});
    setCurrentStep(targetIndex);
    setVisitedSteps((previous) =>
      previous.includes(targetIndex) ? previous : [...previous, targetIndex]
    );
    updateUrl(targetIndex, historyMode);
    onStepChange?.(targetIndex, callbackData);
  }, [currentStep, formData, onStepChange, updateUrl]);

  // Keep the current step valid when a data change enables/disables branches.
  useEffect(() => {
    if (activeStepIndices.includes(currentStep)) return;
    navigationRun.current += 1;
    busy.current = false;
    setIsValidating(false);
    const target = closestActiveIndex(currentStep, activeStepIndices);
    commitStep(target, 'replace');
  }, [activeStepIndices, commitStep, currentStep]);

  // Make the initial URL canonical without adding an extra browser history entry.
  useEffect(() => {
    updateUrl(currentStep, 'replace');
    // This effect intentionally runs once; later changes go through commitStep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Native browser back/forward navigation intentionally bypasses validation.
  useEffect(() => {
    if (!syncWithUrl || typeof window === 'undefined') return;
    const handlePopState = () => {
      const requested = urlStepIndex(steps, stepQueryParam, urlStepMode);
      if (requested === null) return;
      const target = closestActiveIndex(requested, activeStepIndices);
      navigationRun.current += 1;
      busy.current = false;
      setIsValidating(false);
      setIsSubmitting(false);
      if (target !== currentStep) commitStep(target, 'none');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeStepIndices, commitStep, currentStep, stepQueryParam, steps, syncWithUrl, urlStepMode]);

  useEffect(() => {
    if (submitted.current) return;
    if (skipNextPersistence.current) {
      skipNextPersistence.current = false;
      return;
    }
    saveToStorage(currentStep, completedSteps, visitedSteps, formData);
  }, [completedSteps, currentStep, formData, saveToStorage, visitedSteps]);

  const isStepEnabled = useCallback(
    (index: number) => activeStepIndices.includes(index),
    [activeStepIndices]
  );

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((previous) => ({ ...previous, [field]: message }));
    setInvalidSteps((previous) =>
      previous.includes(currentStep) ? previous : [...previous, currentStep]
    );
  }, [currentStep]);

  const clearFieldError = useCallback((field: string) => {
    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setInvalidSteps((previous) => previous.filter((index) => index !== currentStep));
  }, [currentStep]);

  const updateFormData = useCallback(
    (updater: Partial<TData> | ((previous: TData) => Partial<TData>)) => {
      setFormData((previous) => {
        const patch = typeof updater === 'function' ? updater(previous) : updater;
        return Object.assign({}, previous, patch) as TData;
      });
      // Nested patches cannot be mapped reliably to field-level keys, so edits
      // clear the current step's stale validation presentation.
      setErrors({});
      setInvalidSteps((previous) => previous.filter((index) => index !== currentStep));
    },
    [currentStep]
  );

  const validateStep = useCallback(async (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step?.validate) return { isValid: true, errors: {} };
    try {
      const result = await step.validate(formData, {
        stepIndex,
        step,
        steps,
        totalSteps,
        activeStepIndices,
        allData: formData,
      });
      return normalizeValidation(result);
    } catch (error: unknown) {
      return {
        isValid: false,
        errors: {
          _form: errorMessage(error, 'An unexpected validation error occurred.'),
        },
      };
    }
  }, [activeStepIndices, formData, steps, totalSteps]);

  const applyValidation = useCallback((stepIndex: number, result: {
    isValid: boolean;
    errors: ValidationErrors;
  }) => {
    setErrors(result.errors);
    setInvalidSteps((previous) => result.isValid
      ? previous.filter((index) => index !== stepIndex)
      : previous.includes(stepIndex) ? previous : [...previous, stepIndex]
    );
  }, []);

  const validateCurrentStep = useCallback(async () => {
    const run = ++navigationRun.current;
    setIsValidating(true);
    const result = await validateStep(currentStep);
    if (run !== navigationRun.current) return false;
    setIsValidating(false);
    applyValidation(currentStep, result);
    return result.isValid;
  }, [applyValidation, currentStep, validateStep]);

  const nextStep = useCallback(async (): Promise<boolean> => {
    if (busy.current || submitted.current) return false;
    busy.current = true;
    const run = ++navigationRun.current;
    setIsValidating(true);
    const result = await validateStep(currentStep);
    if (run !== navigationRun.current) return false;
    setIsValidating(false);
    applyValidation(currentStep, result);
    if (!result.isValid) {
      busy.current = false;
      return false;
    }

    if (!isLastStep) {
      setCompletedSteps((previous) =>
        previous.includes(currentStep) ? previous : [...previous, currentStep]
      );
      commitStep(activeStepIndices[safePosition + 1], 'push');
      busy.current = false;
      return true;
    }

    setIsSubmitting(true);
    try {
      await onComplete?.(formData);
      if (run !== navigationRun.current) return false;
      submitted.current = true;
      setHasSubmitted(true);
      setCompletedSteps((previous) =>
        previous.includes(currentStep) ? previous : [...previous, currentStep]
      );
      clearStorage();
      return true;
    } catch (error: unknown) {
      setErrors({ _submit: errorMessage(error, 'Submission failed. Please try again.') });
      return false;
    } finally {
      setIsSubmitting(false);
      busy.current = false;
    }
  }, [activeStepIndices, applyValidation, clearStorage, commitStep, currentStep, formData, isLastStep, onComplete, safePosition, validateStep]);

  const prevStep = useCallback(() => {
    if (busy.current || isFirstStep) return;
    commitStep(activeStepIndices[safePosition - 1], 'push');
  }, [activeStepIndices, commitStep, isFirstStep, safePosition]);

  const goToStep = useCallback(async (
    targetIndex: number,
    options: GoToStepOptions = {}
  ): Promise<boolean> => {
    if (
      busy.current ||
      targetIndex === currentStep ||
      !activeStepIndices.includes(targetIndex)
    ) return false;

    const targetPosition = activeStepIndices.indexOf(targetIndex);
    const movesForward = targetPosition > safePosition;
    const mustValidate = movesForward
      && !options.skipValidation
      && !allowNonLinearNavigation;

    if (mustValidate) {
      busy.current = true;
      const run = ++navigationRun.current;
      setIsValidating(true);
      const newlyCompleted: number[] = [];

      for (let position = safePosition; position < targetPosition; position += 1) {
        const stepIndex = activeStepIndices[position];
        const result = await validateStep(stepIndex);
        if (run !== navigationRun.current) return false;
        applyValidation(stepIndex, result);
        if (!result.isValid) {
          setIsValidating(false);
          if (stepIndex !== currentStep) {
            commitStep(stepIndex, options.history ?? 'push');
            setErrors(result.errors);
          }
          busy.current = false;
          return false;
        }
        newlyCompleted.push(stepIndex);
      }

      setCompletedSteps((previous) => Array.from(new Set([...previous, ...newlyCompleted])));
      setIsValidating(false);
      busy.current = false;
    }

    setErrors({});
    commitStep(targetIndex, options.history ?? 'push');
    return true;
  }, [activeStepIndices, allowNonLinearNavigation, applyValidation, commitStep, currentStep, safePosition, validateStep]);

  const resetProgress = useCallback(() => {
    navigationRun.current += 1;
    busy.current = false;
    submitted.current = false;
    skipNextPersistence.current = true;
    const initialActive = getActiveStepIndices(steps, initialData);
    if (initialActive.length === 0) {
      throw new Error('MultiStepProvider requires at least one enabled initial step.');
    }
    const target = closestActiveIndex(initialStep, initialActive);
    setFormData(initialData);
    setCompletedSteps([]);
    setVisitedSteps([target]);
    setInvalidSteps([]);
    setErrors({});
    setHasSubmitted(false);
    setIsSubmitting(false);
    setIsValidating(false);
    clearStorage();
    commitStep(target, 'replace', initialData);
  }, [clearStorage, commitStep, initialData, initialStep, steps]);

  const getStepStatus = useCallback((index: number): StepStatus => {
    if (!activeStepIndices.includes(index)) return 'disabled';
    if (invalidSteps.includes(index)) return 'invalid';
    if (index === currentStep) return 'current';
    if (completedSteps.includes(index)) return 'completed';
    return 'upcoming';
  }, [activeStepIndices, completedSteps, currentStep, invalidSteps]);

  const value: MultiStepContextValue<TData> = {
    currentStep,
    currentStepPosition: safePosition,
    totalSteps,
    activeStepCount,
    currentStepConfig,
    steps,
    activeSteps,
    activeStepIndices,
    progress,
    isFirstStep,
    isLastStep,
    isCompleted,
    hasSubmitted,
    completedSteps,
    visitedSteps,
    invalidSteps,
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
    direction,
    lastSavedAt,
    clearPersistedStorage: clearStorage,
    validateCurrentStep,
    getStepStatus,
    isStepEnabled,
    orientation,
    variant,
  };

  return (
    <MultiStepContext.Provider value={value}>
      {children}
    </MultiStepContext.Provider>
  );
}
