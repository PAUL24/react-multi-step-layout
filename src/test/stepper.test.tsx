import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MultiStepLayout } from '../components/stepper/MultiStepLayout';
import { useMultiStep } from '../components/stepper/useMultiStep';
import type { MultiStepLayoutProps, StepDefinition } from '../types/stepper';

interface TestData {
  name: string;
  email: string;
  plan: 'free' | 'pro';
}

const INITIAL_DATA: TestData = { name: '', email: '', plan: 'free' };

function ProfileStep() {
  const { formData, updateFormData, errors } = useMultiStep<TestData>();
  return (
    <div>
      <label htmlFor="name">Name</label>
      <input
        id="name"
        data-testid="name-input"
        value={formData.name}
        onChange={(event) => updateFormData({ name: event.target.value })}
        aria-invalid={Boolean(errors.name)}
      />
      {errors.name && <span role="alert">{errors.name}</span>}
      <label htmlFor="plan">Plan</label>
      <select
        id="plan"
        data-testid="plan-input"
        value={formData.plan}
        onChange={(event) => updateFormData({ plan: event.target.value as TestData['plan'] })}
      >
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>
    </div>
  );
}

function ContactStep() {
  const { formData, updateFormData, errors } = useMultiStep<TestData>();
  return (
    <div>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        data-testid="email-input"
        value={formData.email}
        onChange={(event) => updateFormData({ email: event.target.value })}
        aria-invalid={Boolean(errors.email)}
      />
      {errors.email && <span role="alert">{errors.email}</span>}
    </div>
  );
}

function ReviewStep() {
  const { formData } = useMultiStep<TestData>();
  return <output data-testid="review-data">{formData.name}|{formData.email}</output>;
}

const STEPS: StepDefinition<TestData>[] = [
  {
    id: 'profile',
    title: 'Profile',
    component: ProfileStep,
    validate: (data) => data.name.trim().length >= 2
      ? true
      : { name: 'Name must be at least 2 characters' },
  },
  {
    id: 'contact',
    title: 'Contact',
    component: ContactStep,
    validate: (data) => data.email.includes('@')
      ? true
      : { email: 'Valid email required' },
  },
  { id: 'review', title: 'Review', component: ReviewStep },
];

function renderWizard(overrides: Partial<MultiStepLayoutProps<TestData>> = {}) {
  return render(
    <MultiStepLayout<TestData>
      steps={STEPS}
      initialData={INITIAL_DATA}
      persistState={false}
      syncWithUrl={false}
      {...overrides}
    />
  );
}

async function clickContinue() {
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
}

describe('MultiStepLayout', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.clearAllMocks();
  });

  it('renders an accessible initial step and progress indicator', () => {
    renderWizard();
    expect(screen.getByRole('heading', { name: 'Profile' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('blocks forward navigation, exposes field errors, and marks the indicator invalid', async () => {
    renderWizard();
    await clickContinue();

    expect(await screen.findByRole('alert')).toHaveTextContent('Name must be at least 2 characters');
    const profileIndicator = screen.getByRole('tab', { name: 'Profile' });
    expect(profileIndicator).toHaveAttribute('aria-invalid', 'true');
    expect(profileIndicator).toHaveAttribute('aria-current', 'step');
    expect(screen.queryByRole('heading', { name: 'Contact' })).not.toBeInTheDocument();
  });

  it('advances after validation, preserves shared data, updates focus, and goes back', async () => {
    renderWizard();
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Alice' } });
    await clickContinue();

    const contactHeading = await screen.findByRole('heading', { name: 'Contact' });
    await waitFor(() => expect(contactHeading).toHaveFocus());
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'alice@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(await screen.findByTestId('name-input')).toHaveValue('Alice');
  });

  it('skips disabled branches in both directions and disables their indicators', async () => {
    const branchingSteps: StepDefinition<TestData>[] = [
      STEPS[0],
      {
        ...STEPS[1],
        id: 'enterprise',
        title: 'Enterprise settings',
        shouldSkip: (data) => data.plan === 'free',
      },
      STEPS[2],
    ];
    renderWizard({
      steps: branchingSteps,
      initialData: { ...INITIAL_DATA, name: 'Alice' },
    });

    expect(screen.getByRole('tab', { name: /enterprise settings/i })).toBeDisabled();
    await clickContinue();
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
  });

  it('re-evaluates an isEnabled branch when shared data changes', async () => {
    const branchingSteps: StepDefinition<TestData>[] = [
      STEPS[0],
      { ...STEPS[1], isEnabled: (data) => data.plan === 'pro' },
      STEPS[2],
    ];
    renderWizard({ steps: branchingSteps, initialData: { ...INITIAL_DATA, name: 'Alice' } });
    const contactIndicator = screen.getByRole('tab', { name: 'Contact (not applicable)' });
    expect(contactIndicator).toBeDisabled();

    fireEvent.change(screen.getByTestId('plan-input'), { target: { value: 'pro' } });
    expect(screen.getByRole('tab', { name: 'Contact' })).not.toBeDisabled();
    await clickContinue();
    expect(await screen.findByRole('heading', { name: 'Contact' })).toBeInTheDocument();
  });

  it('validates intermediate steps when an indicator jumps forward', async () => {
    renderWizard({ initialData: { ...INITIAL_DATA, name: 'Alice' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Review' }));

    expect(await screen.findByRole('heading', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Valid email required');
    expect(screen.getByRole('tab', { name: 'Contact' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('restores data and the active step from sessionStorage', async () => {
    const storageKey = 'restore-test';
    window.sessionStorage.setItem(storageKey, JSON.stringify({
      version: 1,
      currentStep: 1,
      completedSteps: [0],
      visitedSteps: [0, 1],
      formData: { name: 'Bob', email: 'bob@example.com', plan: 'pro' },
      timestamp: Date.now(),
    }));

    renderWizard({ storageKey, persistState: true });
    expect(await screen.findByRole('heading', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toHaveValue('bob@example.com');
  });

  it('clears the session draft only after a successful final submission', async () => {
    const storageKey = 'completion-test';
    const onComplete = vi.fn();
    renderWizard({
      storageKey,
      persistState: true,
      initialData: { name: 'Alice', email: 'alice@example.com', plan: 'pro' },
      onComplete,
      submitLabel: 'Submit wizard',
    });

    await waitFor(() => expect(window.sessionStorage.getItem(storageKey)).not.toBeNull());
    await clickContinue();
    await screen.findByRole('heading', { name: 'Contact' });
    await clickContinue();
    await screen.findByRole('heading', { name: 'Review' });
    fireEvent.click(screen.getByRole('button', { name: /submit wizard/i }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({
      name: 'Alice', email: 'alice@example.com', plan: 'pro',
    }));
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
  });

  it('retains the draft and presents an error if submission fails', async () => {
    const storageKey = 'failed-completion-test';
    renderWizard({
      storageKey,
      persistState: true,
      initialStep: 2,
      initialData: { name: 'Alice', email: 'alice@example.com', plan: 'pro' },
      onComplete: () => { throw new Error('Server unavailable'); },
    });
    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
    expect(window.sessionStorage.getItem(storageKey)).not.toBeNull();
  });

  it('uses stable step IDs in the URL and responds to popstate', async () => {
    window.history.replaceState({}, '', '/?step=contact');
    renderWizard({
      syncWithUrl: true,
      initialData: { name: 'Alice', email: 'alice@example.com', plan: 'pro' },
    });
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument();

    await clickContinue();
    await screen.findByRole('heading', { name: 'Review' });
    expect(new URL(window.location.href).searchParams.get('step')).toBe('review');

    act(() => {
      window.history.replaceState({}, '', '/?step=profile');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
  });

  it('supports one-based URL indexes when configured', () => {
    window.history.replaceState({}, '', '/?stage=2');
    renderWizard({
      syncWithUrl: true,
      stepQueryParam: 'stage',
      urlStepMode: 'index',
    });
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument();
  });

  it('supports asynchronous step validators', async () => {
    const asyncSteps: StepDefinition<TestData>[] = [
      {
        ...STEPS[0],
        validate: async () => {
          await Promise.resolve();
          return { name: 'Async validation failed' };
        },
      },
      STEPS[2],
    ];
    renderWizard({ steps: asyncSteps });
    await clickContinue();
    expect(await screen.findByRole('alert')).toHaveTextContent('Async validation failed');
  });

  it('supports keyboard next/previous shortcuts across active steps', async () => {
    renderWizard({ initialData: { name: 'Alice', email: 'alice@example.com', plan: 'pro' } });
    fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true });
    expect(await screen.findByRole('heading', { name: 'Contact' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowLeft', altKey: true });
    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
  });

  it('resets form data, navigation, and persisted state', async () => {
    const storageKey = 'reset-test';
    renderWizard({
      storageKey,
      persistState: true,
      initialData: { name: 'Initial', email: 'initial@example.com', plan: 'free' },
    });
    await clickContinue();
    await screen.findByRole('heading', { name: 'Contact' });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'changed@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /reset progress/i }));

    expect(await screen.findByTestId('name-input')).toHaveValue('Initial');
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
  });
});
