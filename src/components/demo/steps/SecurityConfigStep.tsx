import React from 'react';
import { ShieldCheck, Key, Lock, BellRing, AlertCircle } from 'lucide-react';
import { useMultiStep } from '../../stepper/useMultiStep';

export interface SecurityFormData {
  twoFactorAuth: boolean;
  apiKeyScopes: string[];
  sessionTimeoutMinutes: number;
  auditLogging: boolean;
}

export const SecurityConfigStep: React.FC = () => {
  const { formData, updateFormData, errors } = useMultiStep<{
    security: SecurityFormData;
  }>();

  const security = formData.security || {
    twoFactorAuth: true,
    apiKeyScopes: ['read', 'write'],
    sessionTimeoutMinutes: 60,
    auditLogging: true,
  };

  const handleChange = (field: keyof SecurityFormData, value: any) => {
    const current = formData.security || {
      twoFactorAuth: true,
      apiKeyScopes: ['read', 'write'],
      sessionTimeoutMinutes: 60,
      auditLogging: true,
    };
    updateFormData({
      security: {
        ...current,
        [field]: value,
      },
    });
  };

  const toggleScope = (scope: string) => {
    const current = security.apiKeyScopes || [];
    const next = current.includes(scope)
      ? current.filter((s) => s !== scope)
      : [...current, scope];
    handleChange('apiKeyScopes', next);
  };

  const availableScopes = [
    { id: 'read', label: 'Read Access', desc: 'Query and view resources' },
    { id: 'write', label: 'Write Access', desc: 'Create and update resources' },
    { id: 'admin', label: 'Admin Access', desc: 'Manage member roles and secrets' },
    { id: 'deploy', label: 'Deploy Triggers', desc: 'Execute container rebuilds' },
  ];

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Security & Access Controls
        </h2>
        <p className="text-sm text-slate-500">
          Configure authentication enforcement, token lifetimes, and RBAC API scopes.
        </p>
      </div>

      {/* 2FA Toggle */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-blue-50 text-blue-600 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Enforce Two-Factor Authentication (2FA)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Requires all team members to provide a TOTP code during sign in.
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={security.twoFactorAuth}
          onChange={(e) => handleChange('twoFactorAuth', e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 mt-1"
        />
      </div>

      {/* API Scopes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Default API Key Scopes <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {availableScopes.map((scope) => {
            const isChecked = (security.apiKeyScopes || []).includes(scope.id);
            return (
              <button
                key={scope.id}
                type="button"
                onClick={() => toggleScope(scope.id)}
                className={`p-3 text-left rounded-md border transition-all cursor-pointer flex items-start gap-3 ${
                  isChecked
                    ? 'border-blue-600 bg-blue-50/70 text-slate-900 ring-1 ring-blue-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                    isChecked
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-400 bg-transparent'
                  }`}
                >
                  {isChecked && <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <p className="text-xs font-semibold">{scope.label}</p>
                  <p
                    className={`text-[11px] ${
                      isChecked ? 'text-slate-600' : 'text-slate-500'
                    }`}
                  >
                    {scope.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {errors.apiKeyScopes && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.apiKeyScopes}</span>
          </p>
        )}
      </div>

      {/* Session Timeout */}
      <div className="space-y-1">
        <label
          htmlFor="session-timeout"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
        >
          Session Expiration (Minutes)
        </label>
        <select
          id="session-timeout"
          value={security.sessionTimeoutMinutes}
          onChange={(e) => handleChange('sessionTimeoutMinutes', Number(e.target.value))}
          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
        >
          <option value={15}>15 minutes (High security)</option>
          <option value={30}>30 minutes</option>
          <option value={60}>60 minutes (Standard)</option>
          <option value={120}>2 hours</option>
          <option value={1440}>24 hours</option>
        </select>
      </div>
    </div>
  );
};
