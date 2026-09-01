import { useMemo, useState } from 'react';
import { User, Layers, ShieldCheck, CheckSquare } from 'lucide-react';
import { StepDefinition } from './types/stepper';
import { MultiStepProvider } from './components/stepper/MultiStepContext';
import { MultiStepLayout } from './components/stepper/MultiStepLayout';
import { AccountInfoStep, AccountFormData } from './components/demo/steps/AccountInfoStep';
import { ProjectDetailsStep, ProjectFormData } from './components/demo/steps/ProjectDetailsStep';
import { SecurityConfigStep, SecurityFormData } from './components/demo/steps/SecurityConfigStep';
import { ReviewSubmitStep } from './components/demo/steps/ReviewSubmitStep';
import { SuccessView } from './components/demo/steps/SuccessView';
import { DemoControls } from './components/demo/DemoControls';

interface WizardFormData {
  account: AccountFormData;
  project: ProjectFormData;
  security: SecurityFormData;
  agreedToTerms: boolean;
}

const INITIAL_FORM_DATA: WizardFormData = {
  account: {
    fullName: 'Jane Doe',
    email: 'jane@enterprise.io',
    organization: 'Acme Cloud Labs',
    role: 'team_lead',
  },
  project: {
    projectName: 'core-platform-v1',
    environment: 'production',
    framework: 'react',
    enableCustomDomain: true,
    domainName: 'app.acmecloud.io',
  },
  security: {
    twoFactorAuth: true,
    apiKeyScopes: ['read', 'write', 'deploy'],
    sessionTimeoutMinutes: 60,
    auditLogging: true,
  },
  agreedToTerms: false,
};

export default function App() {
  const [completedData, setCompletedData] = useState<WizardFormData | null>(null);
  const [allowNonLinear, setAllowNonLinear] = useState(false);
  const [persistState, setPersistState] = useState(true);

  // Step definitions with conditional validation functions
  const steps = useMemo<StepDefinition<WizardFormData>[]>(() => [
    {
      id: 'account',
      title: 'Account & Organization',
      description: 'Provide your primary profile and organization credentials.',
      subLabel: 'Identity',
      icon: User,
      component: AccountInfoStep,
      validate: (data) => {
        const errors: Record<string, string> = {};
        const account = data.account;

        if (!account?.fullName || account.fullName.trim().length < 2) {
          errors.fullName = 'Full name must be at least 2 characters.';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!account?.email || !emailRegex.test(account.email.trim())) {
          errors.email = 'Please provide a valid email address.';
        }

        if (!account?.organization || account.organization.trim().length < 2) {
          errors.organization = 'Organization name is required.';
        }

        return Object.keys(errors).length > 0 ? errors : true;
      },
    },
    {
      id: 'project',
      title: 'Project Architecture',
      description: 'Configure runtime parameters, framework, and deployment target.',
      subLabel: 'Infrastructure',
      icon: Layers,
      component: ProjectDetailsStep,
      validate: (data) => {
        const errors: Record<string, string> = {};
        const project = data.project;

        if (!project?.projectName || project.projectName.trim().length < 3) {
          errors.projectName = 'Project name must be at least 3 characters.';
        }

        if (project?.enableCustomDomain) {
          if (!project.domainName || project.domainName.trim().length < 4) {
            errors.domainName = 'Please enter a valid domain name (e.g. app.domain.com).';
          }
        }

        return Object.keys(errors).length > 0 ? errors : true;
      },
    },
    {
      id: 'security',
      title: 'Security & Access',
      description: 'Define authentication policies, session timeouts, and API privileges.',
      subLabel: 'Governance',
      icon: ShieldCheck,
      component: SecurityConfigStep,
      // Non-production environments skip governance configuration entirely.
      isEnabled: (data) => data.project.environment === 'production',
      validate: (data) => {
        const errors: Record<string, string> = {};
        const security = data.security;

        if (!security?.apiKeyScopes || security.apiKeyScopes.length === 0) {
          errors.apiKeyScopes = 'You must select at least one API permission scope.';
        }

        return Object.keys(errors).length > 0 ? errors : true;
      },
    },
    {
      id: 'review',
      title: 'Review & Deployment',
      description: 'Verify your configuration and accept policies to finalize setup.',
      subLabel: 'Finalize',
      icon: CheckSquare,
      component: ReviewSubmitStep,
      validate: (data) => {
        const errors: Record<string, string> = {};
        if (!data.agreedToTerms) {
          errors.agreedToTerms = 'You must accept the terms to complete setup.';
        }
        return Object.keys(errors).length > 0 ? errors : true;
      },
    },
  ], []);

  const handleComplete = (finalData: WizardFormData) => {
    setCompletedData(finalData);
  };

  const handleRestart = () => {
    setCompletedData(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      {/* Top Application Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 h-16 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                MultiStep Component
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Enterprise React + TypeScript Wizard Engine
            </p>
          </div>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Production-ready engine</span>
            <span className="sm:hidden">Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Main Multi-Step Wizard or Success Screen */}
        {completedData ? (
          <SuccessView data={completedData} onRestart={handleRestart} />
        ) : (
          <MultiStepProvider<WizardFormData>
            steps={steps}
            initialData={INITIAL_FORM_DATA}
            storageKey="multistep_wizard_state"
            storageType="sessionStorage"
            persistState={persistState}
            allowNonLinearNavigation={allowNonLinear}
            syncWithUrl
            stepQueryParam="step"
            urlStepMode="id"
            onComplete={handleComplete}
          >
            <div className="space-y-6">
              <MultiStepLayout
                steps={steps}
                initialData={INITIAL_FORM_DATA}
                nextLabel="Continue"
                prevLabel="Back"
                submitLabel="Finish Setup"
              />

              {/* Live State & Developer Telemetry Inspector */}
              <DemoControls
                allowNonLinear={allowNonLinear}
                setAllowNonLinear={setAllowNonLinear}
                persistState={persistState}
                setPersistState={setPersistState}
              />
            </div>
          </MultiStepProvider>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        Typed multi-step layout with conditional navigation, validation, URL history, and session persistence.
      </footer>
    </div>
  );
}
