import { useCallback, useState } from 'react';
import type { WizardStorageType } from '../../types/stepper';

export interface StoragePayload<TData> {
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
  storageType?: WizardStorageType;
}

export interface RestoredWizardState<TData> {
  step: number;
  completed: number[];
  visited: number[];
  data: TData;
  restoredFromStorage: boolean;
}

function mergeRestoredData<TData>(initialData: TData, restoredData: TData): TData {
  const canMerge =
    typeof initialData === 'object' &&
    initialData !== null &&
    !Array.isArray(initialData) &&
    typeof restoredData === 'object' &&
    restoredData !== null &&
    !Array.isArray(restoredData);

  return canMerge
    ? ({ ...initialData, ...restoredData } as TData)
    : restoredData;
}

function getBrowserStorage(storageType: WizardStorageType): Storage | null {
  if (typeof window === 'undefined') return null;
  return window[storageType];
}

/**
 * Small, SSR-safe persistence adapter. sessionStorage is the default because a
 * wizard draft should survive refreshes but normally not outlive the tab session.
 */
export function useStepStorage<TData>({
  key,
  version = 1,
  initialData,
  initialStep = 0,
  enabled = true,
  storageType = 'sessionStorage',
}: UseStepStorageOptions<TData>) {
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const getInitialState = useCallback((): RestoredWizardState<TData> => {
    const fallback: RestoredWizardState<TData> = {
      step: initialStep,
      completed: [],
      visited: [initialStep],
      data: initialData,
      restoredFromStorage: false,
    };

    if (!enabled) return fallback;

    try {
      const raw = getBrowserStorage(storageType)?.getItem(key);
      if (!raw) return fallback;

      const parsed = JSON.parse(raw) as Partial<StoragePayload<TData>>;
      if (parsed.version !== version || parsed.formData === undefined) {
        return fallback;
      }

      const step = typeof parsed.currentStep === 'number'
        ? parsed.currentStep
        : initialStep;

      return {
        step,
        completed: Array.isArray(parsed.completedSteps)
          ? parsed.completedSteps.filter(Number.isInteger)
          : [],
        visited: Array.isArray(parsed.visitedSteps)
          ? parsed.visitedSteps.filter(Number.isInteger)
          : [step],
        data: mergeRestoredData(initialData, parsed.formData),
        restoredFromStorage: true,
      };
    } catch (error: unknown) {
      console.warn(
        `[MultiStepLayout] Failed to read ${storageType} key "${key}".`,
        error
      );
      return fallback;
    }
  }, [enabled, initialData, initialStep, key, storageType, version]);

  const persistState = useCallback(
    (step: number, completed: readonly number[], visited: readonly number[], data: TData) => {
      if (!enabled) return;

      try {
        const timestamp = Date.now();
        const payload: StoragePayload<TData> = {
          version,
          currentStep: step,
          completedSteps: [...completed],
          visitedSteps: [...visited],
          formData: data,
          timestamp,
        };
        getBrowserStorage(storageType)?.setItem(key, JSON.stringify(payload));
        setLastSavedAt(timestamp);
      } catch (error: unknown) {
        console.warn(
          `[MultiStepLayout] Failed to write ${storageType} key "${key}".`,
          error
        );
      }
    },
    [enabled, key, storageType, version]
  );

  const clearStorage = useCallback(() => {
    try {
      getBrowserStorage(storageType)?.removeItem(key);
      setLastSavedAt(null);
    } catch (error: unknown) {
      console.warn(
        `[MultiStepLayout] Failed to clear ${storageType} key "${key}".`,
        error
      );
    }
  }, [key, storageType]);

  return { getInitialState, persistState, clearStorage, lastSavedAt };
}
