import React from 'react';
import { Check, Edit2, AlertCircle, Shield, Layers, User } from 'lucide-react';
import { useMultiStep } from '../../stepper/useMultiStep';

export const ReviewSubmitStep: React.FC = () => {
  const { formData, updateFormData, goToStep, errors } = useMultiStep<{
    account?: { fullName: string; email: string; organization: string };
    project?: { projectName: string; framework: string; environment: string; enableCustomDomain?: boolean; domainName?: string };
    security?: { twoFactorAuth: boolean; apiKeyScopes: string[]; sessionTimeoutMinutes: number };
    agreedToTerms?: boolean;
  }>();

  const agreed = !!formData.agreedToTerms;

  const handleAgreeChange = (checked: boolean) => {
    updateFormData({ agreedToTerms: checked });
  };

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Final Configuration Review
        </h2>
        <p className="text-sm text-slate-500">
          Verify your deployment architecture, organization identity, and security parameters.
        </p>
      </div>

      <div className="p-3 bg-blue-50/70 rounded-md border border-blue-100 text-xs text-slate-600">
        Please review your configuration details below before completing setup. You can click <strong className="text-blue-700">"Edit"</strong> on any section to jump directly back to that step.
      </div>

      {/* Account Summary */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <User className="w-4 h-4 text-blue-600" />
            <span>Account & Organization</span>
          </div>
          <button
            type="button"
            onClick={() => goToStep(0)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-slate-500 font-medium">Full Name</dt>
            <dd className="font-semibold text-slate-900">{formData.account?.fullName || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Work Email</dt>
            <dd className="font-semibold text-slate-900">{formData.account?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Organization</dt>
            <dd className="font-semibold text-slate-900">{formData.account?.organization || '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Project Summary */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Project Architecture</span>
          </div>
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-slate-500 font-medium">Project Identifier</dt>
            <dd className="font-semibold text-slate-900">{formData.project?.projectName || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Stack Template</dt>
            <dd className="font-semibold text-slate-900 uppercase">{formData.project?.framework || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Environment</dt>
            <dd className="font-semibold text-slate-900 capitalize">{formData.project?.environment || '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Security Summary */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Security Governance</span>
          </div>
          <button
            type="button"
            onClick={() => goToStep(2)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-slate-500 font-medium">2FA Enforced</dt>
            <dd className="font-semibold text-slate-900">
              {formData.security?.twoFactorAuth ? 'Enabled' : 'Disabled'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">API Scopes</dt>
            <dd className="font-semibold text-slate-900">
              {formData.security?.apiKeyScopes?.join(', ') || 'None'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Idle Timeout</dt>
            <dd className="font-semibold text-slate-900">
              {formData.security?.sessionTimeoutMinutes} min
            </dd>
          </div>
        </dl>
      </div>

      {/* Agreement Checkbox */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            id="terms-checkbox"
            type="checkbox"
            checked={agreed}
            onChange={(e) => handleAgreeChange(e.target.checked)}
            aria-invalid={!!errors.agreedToTerms}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
          />
          <span className="text-xs text-slate-700 leading-relaxed">
            I confirm that the configuration above is accurate and agree to the platform security policies and workspace deployment terms.
          </span>
        </label>
        {errors.agreedToTerms && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.agreedToTerms}</span>
          </p>
        )}
      </div>
    </div>
  );
};
