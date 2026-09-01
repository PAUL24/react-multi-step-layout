import { useContext } from 'react';
import type { MultiStepContextValue } from '../../types/stepper';
import { MultiStepContext } from './MultiStepContext';

/** Access the typed wizard store from a step, custom footer, or nested component. */
export function useMultiStep<TData = unknown>(): MultiStepContextValue<TData> {
  const context = useContext(MultiStepContext);
  if (!context) {
    throw new Error(
      'useMultiStep must be used within a <MultiStepProvider> or <MultiStepLayout>.'
    );
  }
  return context as MultiStepContextValue<TData>;
}
