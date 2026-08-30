import { useState, useEffect, useCallback, useRef } from 'react';

interface StoragePayload<TData> {
  version: number;
  currentStep: number;
  completedSteps: number[];
  visitedSteps: number[];
  formData: TData;
  timestamp: number;
}

interface UseStepStorageOptions<TData> {
  key: string;
  version?: number;
  initialData: TData;
  initialStep?: number;
  enabled?: boolean;
}

export function useStepStorage<TData>({
  key,
  version = 1,
  initialData,
  initialStep = 0,
  enabled = true,
}: UseStepStorageOptions<TData>) {
  const [restored, setRestored] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const isFirstRun = useRef(true);

  // Read initial stored state synchronously or fallback
  const getInitialState = useCallback((): {
    step: number;
    completed: number[];
    visited: number[];
    data: TData;
    restoredFromStorage: boolean;
  } => {
    if (!enabled || typeof window === 'undefined') {
      return {
        step: initialStep,
        completed: [],
        visited: [initialStep],
        data: initialData,
        restoredFromStorage: false,
      };
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed: StoragePayload<TData> = JSON.parse(raw);
        if (parsed && parsed.version === version && parsed.formData) {
          return {
            step: typeof parsed.currentStep === 'number' ? parsed.currentStep : initialStep,
            completed: Array.isArray(parsed.completedSteps) ? parsed.completedSteps : [],
            visited: Array.isArray(parsed.visitedSteps) ? parsed.visitedSteps : [parsed.currentStep || 0],
            data: { ...initialData, ...parsed.formData },
            restoredFromStorage: true,
          };
        }
      }
    } catch (err) {
      console.warn(`[MultiStepLayout] Failed to read from localStorage (${key}):`, err);
    }

    return {
      step: initialStep,
      completed: [],
      visited: [initialStep],
      data: initialData,
      restoredFromStorage: false,
    };
  }, [key, version, initialData, initialStep, enabled]);

  // Persist state changes with error handling
  const persistState = useCallback(
    (step: number, completed: number[], visited: number[], data: TData) => {
      if (!enabled || typeof window === 'undefined') return;

      try {
        const now = Date.now();
        const payload: StoragePayload<TData> = {
          version,
          currentStep: step,
          completedSteps: completed,
          visitedSteps: visited,
          formData: data,
          timestamp: now,
        };
        window.localStorage.setItem(key, JSON.stringify(payload));
        setLastSavedAt(now);
      } catch (err) {
        console.warn(`[MultiStepLayout] Failed to write to localStorage (${key}):`, err);
      }
    },
    [key, version, enabled]
  );

  // Clear persisted data
  const clearStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
      setLastSavedAt(null);
    } catch (err) {
      console.warn(`[MultiStepLayout] Failed to clear localStorage (${key}):`, err);
    }
  }, [key]);

  return {
    getInitialState,
    persistState,
    clearStorage,
    lastSavedAt,
    restored,
    setRestored,
  };
}
