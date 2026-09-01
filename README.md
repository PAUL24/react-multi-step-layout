# React Multi-Step Layout

A production-oriented React + TypeScript wizard engine with a centralized Context store, conditional branches, step validation, session persistence, URL history, accessible focus management, and Motion transitions.

## What is included

- One typed store shared by every step through `useMultiStep<TData>()`.
- Automatic `sessionStorage` persistence with schema versioning and safe recovery.
- Automatic draft cleanup after `onComplete` resolves successfully. Failed submissions retain the draft.
- `shouldSkip` and `isEnabled` predicates that are re-evaluated whenever form data changes.
- Next, previous, indicator, reset, deep-link, and browser-history navigation that all understand active steps.
- Synchronous or asynchronous step validators with field-level and form-level errors.
- Stable step-ID bookmarks such as `?step=security`, or optional 1-based indexes such as `?step=3`.
- `aria-current="step"`, invalid/disabled indicator state, live announcements, keyboard controls, and heading focus after transitions.
- Direction-aware Motion animations with `prefers-reduced-motion` support.
- Strict generic TypeScript contracts for data, step components, predicates, validators, and callbacks.

## Run the example

```bash
git clone https://github.com/PAUL24/react-multi-step-layout.git
cd react-multi-step-layout
npm install
npm run dev
```

Verification commands:

```bash
npm run typecheck
npm test
npm run build
```

## Typed example

```tsx
import type { StepComponentProps, StepDefinition } from './components/stepper';
import { MultiStepLayout } from './components/stepper';

interface OnboardingData {
  profile: {
    name: string;
    email: string;
  };
  plan: 'starter' | 'enterprise';
  security: {
    requireSso: boolean;
  };
}

function ProfileStep({
  data,
  updateData,
  errors,
}: StepComponentProps<OnboardingData>) {
  return (
    <div>
      <label htmlFor="name">Name</label>
      <input
        id="name"
        value={data.profile.name}
        aria-invalid={Boolean(errors.name)}
        aria-describedby={errors.name ? 'name-error' : undefined}
        onChange={(event) => updateData({
          profile: { ...data.profile, name: event.target.value },
        })}
      />
      {errors.name && <p id="name-error">{errors.name}</p>}
    </div>
  );
}

function SecurityStep({ data, updateData }: StepComponentProps<OnboardingData>) {
  return (
    <label>
      <input
        type="checkbox"
        checked={data.security.requireSso}
        onChange={(event) => updateData({
          security: { requireSso: event.target.checked },
        })}
      />
      Require single sign-on
    </label>
  );
}

function ReviewStep({ data }: StepComponentProps<OnboardingData>) {
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

const steps: StepDefinition<OnboardingData>[] = [
  {
    id: 'profile',
    title: 'Profile',
    component: ProfileStep,
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (data.profile.name.trim().length < 2) {
        errors.name = 'Enter at least two characters.';
      }
      if (!data.profile.email.includes('@')) {
        errors.email = 'Enter a valid email address.';
      }
      return Object.keys(errors).length === 0 ? true : errors;
    },
  },
  {
    id: 'security',
    title: 'Enterprise security',
    component: SecurityStep,
    // This branch disappears from Next/Previous navigation for starter plans.
    isEnabled: (data) => data.plan === 'enterprise',
  },
  {
    id: 'review',
    title: 'Review',
    component: ReviewStep,
  },
];

const initialData: OnboardingData = {
  profile: { name: '', email: '' },
  plan: 'starter',
  security: { requireSso: false },
};

async function submitOnboarding(data: OnboardingData) {
  const response = await fetch('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Could not save onboarding data.');
}

export default function App() {
  return (
    <MultiStepLayout<OnboardingData>
      steps={steps}
      initialData={initialData}
      storageKey="onboarding-draft-v1"
      storageVersion={1}
      persistState
      storageType="sessionStorage"
      syncWithUrl
      stepQueryParam="step"
      urlStepMode="id"
      onComplete={async (data) => {
        await submitOnboarding(data);
        // The draft is cleared only after this promise resolves.
      }}
    />
  );
}
```

Step components can receive strongly typed props as above or call the store directly:

```tsx
const { formData, updateFormData, errors, nextStep } =
  useMultiStep<OnboardingData>();
```

## Step contract

```ts
interface StepDefinition<TData> {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<StepComponentProps<TData>> | React.ReactNode;
  validate?: (data: TData, context: ValidationContext<TData>) =>
    | ValidationResult
    | Promise<ValidationResult>;
  shouldSkip?: (data: TData, context: StepEvaluationContext<TData>) => boolean;
  isEnabled?: (data: TData, context: StepEvaluationContext<TData>) => boolean;
  optional?: boolean;
}
```

`shouldSkip` and `isEnabled` are synchronous because they define the render-time navigation graph. Validators may be asynchronous. A validator can return:

- `true`, `null`, or `undefined` for success;
- `false` for the default form-level error;
- a string for a custom form-level error; or
- a `Record<string, string>` for field errors.

## Main component API

| Prop | Default | Purpose |
| --- | --- | --- |
| `steps` | required | Strictly typed step configuration array. |
| `initialData` | required | Complete initial wizard data object. |
| `initialStep` | `0` | Initial configuration-array index when no stored or URL step exists. |
| `persistState` | `true` | Enables automatic draft persistence. |
| `storageType` | `sessionStorage` | May be changed to `localStorage` for an explicitly long-lived draft. |
| `storageKey` | `multistep_wizard_state` | Storage namespace for this wizard. |
| `storageVersion` | `1` | Invalidates incompatible stored payloads. |
| `syncWithUrl` | `true` | Reads/writes the active step query parameter and listens for `popstate`. |
| `stepQueryParam` | `step` | Query parameter name. Existing query parameters are preserved. |
| `urlStepMode` | `id` | Uses stable IDs; `index` writes and reads 1-based indexes. |
| `allowNonLinearNavigation` | `false` | Allows forward indicator jumps without validating intermediate steps. |
| `onStepChange` | — | Receives the configuration index and current typed data. |
| `onComplete` | — | Runs after final validation; draft cleanup follows successful resolution. |
| `showProgressTrack` | `true` | Shows progress and step indicators. |
| `showControls` | `true` | Shows the default navigation footer. |

URL navigation represents user intent and therefore bypasses forward validation; the current step still validates when the user presses Next or submits. A URL that targets a disabled branch resolves to the nearest active step.

## Store API

`useMultiStep<TData>()` exposes:

- Navigation: `nextStep`, `prevStep`, `goToStep`, `resetProgress`.
- Data: `formData`, `updateFormData`.
- Graph: `steps`, `activeSteps`, `activeStepIndices`, `isStepEnabled`.
- Position: `currentStep`, `currentStepPosition`, `activeStepCount`, `progress`.
- Validation: `errors`, `invalidSteps`, `validateCurrentStep`, field-error helpers.
- Lifecycle: `isValidating`, `isSubmitting`, `hasSubmitted`, `clearPersistedStorage`.

`currentStep` and the arrays of completed/visited/invalid steps use indexes from the original configuration. `currentStepPosition` is the position within the currently active branch.

## Accessibility and keyboard behavior

- Active indicators use `aria-current="step"` and tab relationships.
- Skipped indicators use native `disabled` plus `aria-disabled`.
- Failed steps expose `aria-invalid` and a persistent visual error state.
- New step headings receive focus after the entering animation finishes.
- A polite live region announces the active position, title, and description.
- `Alt + ArrowRight` validates and advances; `Alt + ArrowLeft` goes back.
- `Ctrl/Cmd + Enter` validates and advances/submits.
- Indicator tabs support arrows, Home, End, Enter, and Space.
- Motion is reduced to zero-duration transitions when requested by the OS.

## Architecture

```text
src/
├── types/stepper.ts
├── components/stepper/
│   ├── MultiStepContext.tsx   # Store, validation, active graph, history engine
│   ├── useStepStorage.ts      # SSR-safe session/local persistence adapter
│   ├── useMultiStep.ts        # Typed store hook
│   ├── MultiStepLayout.tsx    # Provider-aware layout shell
│   ├── ProgressTrack.tsx      # Accessible active/invalid/disabled indicators
│   ├── StepContent.tsx        # Focus management and reduced-motion transitions
│   ├── StepControls.tsx       # Validation-gated previous/next/submit controls
│   └── StorageBadge.tsx       # Autosave status and draft reset
├── components/demo/           # Full example implementation
└── test/stepper.test.tsx      # 14 behavior-focused integration tests
```

The storage adapter catches unavailable/quota errors, stored payloads are versioned, duplicate async navigation is locked, and a successful submission prevents the persistence effect from recreating the cleared draft.
