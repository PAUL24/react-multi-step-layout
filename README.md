# React + TypeScript Multi-Step Layout & Wizard Component

A production-ready, flexible, and accessible Multi-Step Layout architecture for React 18+ and TypeScript. Built with fluid animations powered by Motion, responsive progress tracking, conditional validation gating, full keyboard navigation, and automatic local storage state persistence.

------

## Features

- **Fluid Animated Progress Track**: Smooth, spring-animated completion track bar with dynamic percentage calculation and step indicator nodes.
- **Clean Hook-Based Control (`useMultiStep`)**: Exposes `nextStep()`, `prevStep()`, `goToStep(index)`, `resetProgress()`, `formData`, `updateFormData()`, and error dispatchers to any child step component.
- **Conditional Validation Engine**: Prevents step advancement if the step's data fails synchronous or asynchronous validation rules. Supports field-level error mapping with auto-clearing upon field modification.
- **Accessibility & Focus Management**: Full WCAG 2.1 AA compliance with ARIA landmarks (`role="progressbar"`, `role="tablist"`, `role="tabpanel"`), live region announcements (`aria-live="polite"`), and programmatic focus management.
- **Keyboard Navigation**:
  - `Alt + →` / `Ctrl + Enter`: Advance to the next step
  - `Alt + ←`: Return to the previous step
  - `ArrowLeft` / `ArrowRight` / `Home` / `End`: Navigate through progress track step tabs
- **Local Storage State Recovery**: Automatically persists form progress and current step state across browser refreshes with cache versioning and safe quota fallback.
- **Full TypeScript Generics**: Strictly typed data payloads and step validators.
- **Automated Test Suite**: Unit tests verifying progression, validation blocking, persistence, keyboard navigation, and edge cases.

---

## Installation & Setup

Ensure all peer dependencies are available in your project:

```bash
npm install react react-dom motion lucide-react
```

### Development Scripts

```bash
# Start development server
npm run dev

# Run unit tests
npm test

# Check TypeScript type safety
npm run lint

# Build for production
npm run build
```

---

## Quick Start Example

```tsx
import React from 'react';
import { MultiStepLayout, useMultiStep, StepDefinition } from './components/stepper';

interface UserOnboardingData {
  profile: {
    fullName: string;
    email: string;
  };
  preferences: {
    notifications: boolean;
  };
}

// 1. Define Step Components using useMultiStep
const ProfileStep: React.FC = () => {
  const { formData, updateFormData, errors } = useMultiStep<UserOnboardingData>();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Full Name</label>
        <input
          type="text"
          value={formData.profile.fullName}
          onChange={(e) =>
            updateFormData({
              profile: { ...formData.profile, fullName: e.target.value },
            })
          }
          className="w-full border rounded-lg p-2"
        />
        {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
      </div>
    </div>
  );
};

const PreferencesStep: React.FC = () => {
  const { formData, updateFormData } = useMultiStep<UserOnboardingData>();

  return (
    <div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.preferences.notifications}
          onChange={(e) =>
            updateFormData({
              preferences: { notifications: e.target.checked },
            })
          }
        />
        <span>Enable email notifications</span>
      </label>
    </div>
  );
};

// 2. Define Step Configurations & Validation
const steps: StepDefinition<UserOnboardingData>[] = [
  {
    id: 'profile',
    title: 'Personal Profile',
    description: 'Enter your basic details',
    component: ProfileStep,
    validate: (data) => {
      if (!data.profile?.fullName || data.profile.fullName.length < 2) {
        return { fullName: 'Full name must be at least 2 characters.' };
      }
      return true;
    },
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Set your notification options',
    component: PreferencesStep,
  },
];

// 3. Render the MultiStepLayout Component
export default function App() {
  const initialData: UserOnboardingData = {
    profile: { fullName: '', email: '' },
    preferences: { notifications: true },
  };

  const handleComplete = (finalData: UserOnboardingData) => {
    console.log('Wizard Completed:', finalData);
  };

  return (
    <MultiStepLayout<UserOnboardingData>
      steps={steps}
      initialData={initialData}
      storageKey="user_onboarding_draft"
      persistState={true}
      onComplete={handleComplete}
      nextLabel="Continue"
      prevLabel="Back"
      submitLabel="Complete Setup"
    />
  );
}
```

---

## API Reference

### `<MultiStepLayout<TData> />` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `steps` | `StepDefinition<TData>[]` | **Required** | Array of step configurations and validation rules. |
| `initialData` | `TData` | **Required** | Initial state structure for the multi-step form. |
| `initialStep` | `number` | `0` | Default active step index on initial mount. |
| `storageKey` | `string` | `'multistep_wizard_state'` | LocalStorage key used to persist state. |
| `storageVersion` | `number` | `1` | Incrementing version to invalidate outdated caches. |
| `persistState` | `boolean` | `true` | Toggle automatic draft saving to LocalStorage. |
| `allowNonLinearNavigation` | `boolean` | `false` | Allow freely jumping to unvisited steps without strict sequential validation. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout orientation for progress indicators. |
| `onStepChange` | `(step: number, data: TData) => void` | `undefined` | Callback fired on step transition. |
| `onComplete` | `(data: TData) => void \| Promise<void>` | `undefined` | Callback executed on final step submission. |
| `showProgressTrack` | `boolean` | `true` | Show or hide the top progress track bar. |
| `showControls` | `boolean` | `true` | Show or hide the default navigation controls footer. |
| `nextLabel` | `string` | `'Continue'` | Custom label for Next button. |
| `prevLabel` | `string` | `'Back'` | Custom label for Previous button. |
| `submitLabel` | `string` | `'Finish Setup'` | Custom label for final Submit button. |

---

### `useMultiStep<TData>()` Hook Return Values

Child views and custom control components can access the wizard state via `useMultiStep()`:

```typescript
const {
  currentStep,           // number: 0-indexed active step
  totalSteps,            // number: total count of steps
  currentStepConfig,     // StepDefinition<TData>: current step metadata
  progress,              // number: 0 - 100 percentage
  isFirstStep,           // boolean: true if on step 0
  isLastStep,            // boolean: true if on final step
  isCompleted,           // boolean: true if all steps validated
  completedSteps,        // number[]: list of completed step indices
  visitedSteps,          // number[]: list of visited step indices
  formData,              // TData: reactive form data state
  updateFormData,        // (patch: Partial<TData>) => void
  resetProgress,         // () => void: reset form state and clear storage
  nextStep,              // () => Promise<boolean>: validate and advance
  prevStep,              // () => void: navigate to previous step
  goToStep,              // (index: number) => Promise<boolean>: jump to step
  errors,                // Record<string, string>: current validation errors
  setFieldError,         // (field: string, msg: string) => void
  clearFieldError,       // (field: string) => void
  clearErrors,           // () => void
  isValidating,          // boolean: true during async validation
  isSubmitting,          // boolean: true during final submission
  direction,             // 1 | -1: slide transition direction
  lastSavedAt,           // number | null: last localStorage save timestamp
  clearPersistedStorage, // () => void: clear cached storage
} = useMultiStep<TData>();
```

---

## Step Validation Recipes

### 1. Synchronous Validation with Field Mapping

Return an object with field names and error messages:

```typescript
validate: (data) => {
  const errors: Record<string, string> = {};
  if (!data.email.includes('@')) {
    errors.email = 'Please provide a valid email.';
  }
  return Object.keys(errors).length > 0 ? errors : true;
}
```

### 2. Async API Validation

Return a Promise resolving to `true` or an error object:

```typescript
validate: async (data) => {
  const isAvailable = await checkUsernameAvailability(data.username);
  if (!isAvailable) {
    return { username: 'This username is already taken.' };
  }
  return true;
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + →` | Validate and advance to the next step. |
| `Alt + ←` | Go back to the previous step. |
| `Ctrl + Enter` / `Cmd + Enter` | Quick submit / advance while focused inside input fields. |
| `ArrowLeft` / `ArrowRight` | Move focus between step indicators in the progress bar. |
| `Home` / `End` | Focus the first or last step indicator in the progress bar. |

---

## Architecture & File Structure

```
src/
├── types/
│   └── stepper.ts            # TypeScript interfaces & types
├── components/
│   ├── stepper/
│   │   ├── MultiStepContext.tsx  # React Context & Provider
│   │   ├── useMultiStep.ts       # Custom Hook for child views
│   │   ├── MultiStepLayout.tsx   # Master Layout wrapper
│   │   ├── ProgressTrack.tsx     # Fluid animated progress track bar
│   │   ├── StepContent.tsx       # Motion slide/fade transition container
│   │   ├── StepControls.tsx      # Navigation buttons & keyboard cues
│   │   ├── StorageBadge.tsx      # Autosave indicator & draft recovery
│   │   └── useStepStorage.ts     # LocalStorage synchronization utility
│   └── demo/
│       ├── steps/                # Realistic multi-step demo forms
│       └── DemoControls.tsx      # Interactive state inspector & config
├── test/
│   ├── setup.ts              # Testing library setup
│   └── stepper.test.tsx      # Unit test suite (10 test cases)
└── App.tsx                   # Main demo application
```

---

## Unit Testing

Run the automated test suite with Vitest:

```bash
npm test
```

The test suite covers:
- Initial render & progress track bar calculation.
- Conditional validation blocking invalid advance.
- Forward & backward navigation with state preservation.
- Direct step jumping and navigation guards.
- Local storage persistence & automatic draft recovery.
- Global keyboard navigation shortcuts (`Alt+ArrowRight`, `Alt+ArrowLeft`).
- Asynchronous validation handling.
- Automatic field error clearing on input change.
- Form reset and cache cleanup.
