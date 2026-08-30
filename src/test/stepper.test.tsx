import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MultiStepLayout } from '../components/stepper/MultiStepLayout';
import { MultiStepProvider } from '../components/stepper/MultiStepContext';
import { useMultiStep } from '../components/stepper/useMultiStep';
import { StepContent } from '../components/stepper/StepContent';
import { StepControls } from '../components/stepper/StepControls';
import { ProgressTrack } from '../components/stepper/ProgressTrack';
import { StepDefinition } from '../types/stepper';

// Test form schema
interface TestData {
  name: string;
  email: string;
  plan: string;
}

const initialTestData: TestData = {
  name: '',
  email: '',
  plan: 'free',
};

// Child step components
const StepOne: React.FC = () => {
  const { formData, updateFormData, errors } = useMultiStep<TestData>();
  return (
    <div>
      <h3 data-testid="step-1-title">Step 1: Profile</h3>
      <input
        data-testid="name-input"
        value={formData.name}
        onChange={(e) => updateFormData({ name: e.target.value })}
        placeholder="Enter name"
      />
      {errors.name && <span data-testid="name-error">{errors.name}</span>}
    </div>
  );
};

const StepTwo: React.FC = () => {
  const { formData, updateFormData, errors } = useMultiStep<TestData>();
  return (
    <div>
      <h3 data-testid="step-2-title">Step 2: Contact</h3>
      <input
        data-testid="email-input"
        value={formData.email}
        onChange={(e) => updateFormData({ email: e.target.value })}
        placeholder="Enter email"
      />
      {errors.email && <span data-testid="email-error">{errors.email}</span>}
    </div>
  );
};

const StepThree: React.FC = () => {
  const { formData, updateFormData } = useMultiStep<TestData>();
  return (
    <div>
      <h3 data-testid="step-3-title">Step 3: Review</h3>
      <p data-testid="summary-name">{formData.name}</p>
      <p data-testid="summary-email">{formData.email}</p>
    </div>
  );
};

const testSteps: StepDefinition<TestData>[] = [
  {
    id: 'profile',
    title: 'Profile Information',
    description: 'Enter your basic details',
    component: StepOne,
    validate: (data) => {
      if (!data.name || data.name.trim().length < 2) {
        return { name: 'Name must be at least 2 characters' };
      }
      return true;
    },
  },
  {
    id: 'contact',
    title: 'Contact Details',
    description: 'Enter your email address',
    component: StepTwo,
    validate: (data) => {
      if (!data.email || !data.email.includes('@')) {
        return { email: 'Valid email required' };
      }
      return true;
    },
  },
  {
    id: 'review',
    title: 'Final Review',
    description: 'Confirm all details',
    component: StepThree,
  },
];

describe('MultiStepLayout & useMultiStep Hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders initial step, title, and 0% progress track bar correctly', () => {
    render(
      <MultiStepLayout
        steps={testSteps}
        initialData={initialTestData}
        storageKey="test_wizard"
        persistState={false}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Profile Information' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('step-1-title')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('blocks navigation when step validation fails and displays error message', async () => {
    render(
      <MultiStepLayout
        steps={testSteps}
        initialData={initialTestData}
        storageKey="test_wizard"
        persistState={false}
      />
    );

    const nextBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextBtn);

    // Validation error should show
    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toHaveTextContent(
        'Name must be at least 2 characters'
      );
    });

    // Should stay on Step 1
    expect(screen.getByTestId('step-1-title')).toBeInTheDocument();
    expect(screen.queryByTestId('step-2-title')).not.toBeInTheDocument();
  });

  it('advances to next step when valid data is provided and clears errors', async () => {
    render(
      <MultiStepLayout
        steps={testSteps}
        initialData={initialTestData}
        storageKey="test_wizard"
        persistState={false}
      />
    );

    const nameInput = screen.getByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    const nextBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextBtn);

    // Should advance to step 2
    await waitFor(() => {
      expect(screen.getByTestId('step-2-title')).toBeInTheDocument();
    });

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
  });

  it('allows navigating backward with previous button without losing entered data', async () => {
    render(
      <MultiStepLayout
        steps={testSteps}
        initialData={{ name: 'Alice', email: '', plan: 'free' }}
        storageKey="test_wizard"
        persistState={false}
      />
    );

    // Advance to Step 2
    const nextBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByTestId('step-2-title')).toBeInTheDocument();
    });

    // Click Back
    const backBtn = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backBtn);

    // Should be back on Step 1 with value preserved
    await waitFor(() => {
      expect(screen.getByTestId('step-1-title')).toBeInTheDocument();
      expect(screen.getByTestId('name-input')).toHaveValue('Alice');
    });
  });

  it('handles completion callback on the final step submission', async () => {
    const handleComplete = vi.fn();

    render(
      <MultiStepLayout
        steps={testSteps}
        initialData={{ name: 'Alice', email: 'alice@example.com', plan: 'free' }}
        storageKey="test_wizard"
        persistState={false}
        onComplete={handleComplete}
        submitLabel="Submit Wizard"
      />
    );

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByTestId('step-2-title')).toBeInTheDocument());

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByTestId('step-3-title')).toBeInTheDocument());

    // Submit on final step
    const submitBtn = screen.getByRole('button', { name: /submit wizard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledTimes(1);
      expect(handleComplete).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@example.com',
        plan: 'free',
      });
    });
  });

  it('persists progress to localStorage and restores on page reload', async () => {
    const storageKey = 'custom_storage_test';
    const payload = {
      version: 1,
      currentStep: 1,
      completedSteps: [0],
      visitedSteps: [0, 1],
      formData: { name: 'Bob Dylan', email: 'bob@music.org', plan: 'pro' },
      timestamp: Date.now(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));

    render(
      <MultiStepLayout
        steps={testSteps}
        initialData={initialTestData}
        storageKey={storageKey}
        persistState={true}
      />
    );

    // Should restore to Step 2 with restored email
    await waitFor(() => {
      expect(screen.getByTestId('step-2-title')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toHaveValue('bob@music.org');
    });
  });

  it('supports keyboard navigation shortcut Alt+ArrowRight and Alt+ArrowLeft', async () => {
    render(
      <MultiStepLayout
        steps={testSteps}
        initialData={{ name: 'Charlie', email: 'charlie@test.com', plan: 'free' }}
        storageKey="test_wizard"
        persistState={false}
      />
    );

    // Advance with Alt + ArrowRight
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true, code: 'ArrowRight' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('step-2-title')).toBeInTheDocument();
    });

    // Go back with Alt + ArrowLeft
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft', altKey: true, code: 'ArrowLeft' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('step-1-title')).toBeInTheDocument();
    });
  });

  it('supports async validation functions', async () => {
    const AsyncStepComponent = () => {
      const { errors } = useMultiStep<TestData>();
      return (
        <div>
          <h3>Async Step</h3>
          {errors.name && <span data-testid="async-error">{errors.name}</span>}
        </div>
      );
    };

    const asyncSteps: StepDefinition<TestData>[] = [
      {
        id: 'async-step',
        title: 'Async Check',
        component: AsyncStepComponent,
        validate: async (data) => {
          await new Promise((res) => setTimeout(res, 20));
          if (!data.name) {
            return { name: 'Async validation failed' };
          }
          return true;
        },
      },
      {
        id: 'step-2',
        title: 'Next Step',
        component: () => <div>Step 2 Content</div>,
      },
    ];

    render(
      <MultiStepLayout
        steps={asyncSteps}
        initialData={initialTestData}
        storageKey="async_test"
        persistState={false}
      />
    );

    const nextBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByTestId('async-error')).toHaveTextContent('Async validation failed');
    });
  });

  it('clears field-specific errors automatically when input changes', async () => {
    render(
      <MultiStepLayout
        steps={testSteps}
        initialData={initialTestData}
        storageKey="clear_error_test"
        persistState={false}
      />
    );

    // Trigger validation error
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toBeInTheDocument();
    });

    // Type in the name field
    const nameInput = screen.getByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    // Error should disappear immediately
    await waitFor(() => {
      expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
    });
  });

  it('resets progress, form state, and local storage on reset button click', async () => {
    const storageKey = 'reset_test_key';
    render(
      <MultiStepLayout
        steps={testSteps}
        initialData={{ name: 'Initial Bob', email: 'bob@test.com', plan: 'free' }}
        storageKey={storageKey}
        persistState={true}
      />
    );

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByTestId('step-2-title')).toBeInTheDocument());

    // Click Reset button
    const resetBtn = screen.getByRole('button', { name: /reset progress/i });
    fireEvent.click(resetBtn);

    // Should return to step 1
    await waitFor(() => {
      expect(screen.getByTestId('step-1-title')).toBeInTheDocument();
    });
  });
});
