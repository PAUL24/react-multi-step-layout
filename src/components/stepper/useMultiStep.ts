import { useContext } from 'react';
import { MultiStepContext } from './MultiStepContext';
import { MultiStepContextValue } from '../../types/stepper';

/**
 * Custom Hook to access Multi-Step controls, state, validation helpers,
 * and form data within any child step component.
 *
 * @template TData The shape of the shared multi-step form data.
 * @returns {MultiStepContextValue<TData>} Multi-step context controls & state.
 *
 * @example
 * ```tsx
 * const {
 *   currentStep,
 *   nextStep,
 *   prevStep,
 *   goToStep,
 *   formData,
 *   updateFormData,
 *   errors,
 *   setFieldError
 * } = useMultiStep<MyFormData>();
 * ```
 */
export function useMultiStep<TData = any>(): MultiStepContextValue<TData> {
  const context = useContext(MultiStepContext);
  if (!context) {
    throw new Error(
      'useMultiStep must be used within a <MultiStepProvider> or <MultiStepLayout> component.'
    );
  }
  return context as MultiStepContextValue<TData>;
}
