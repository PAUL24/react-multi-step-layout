import React from 'react';
import { User, Mail, Building, AlertCircle, Info } from 'lucide-react';
import { useMultiStep } from '../../stepper/useMultiStep';

export interface AccountFormData {
  fullName: string;
  email: string;
  organization: string;
  role: string;
}

export const AccountInfoStep: React.FC = () => {
  const { formData, updateFormData, errors } = useMultiStep<{
    account: AccountFormData;
  }>();

  const account = formData.account || {
    fullName: '',
    email: '',
    organization: '',
    role: 'developer',
  };

  const handleChange = (field: keyof AccountFormData, value: string) => {
    const current = formData.account || {
      fullName: '',
      email: '',
      organization: '',
      role: 'developer',
    };
    updateFormData({
      account: {
        ...current,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Personal & Organization Details
        </h2>
        <p className="text-sm text-slate-500">
          Complete your profile credentials to unlock all enterprise platform features.
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label
            htmlFor="account-fullName"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="account-fullName"
              type="text"
              value={account.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Alexander Hamilton"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              className={`w-full pl-9 pr-4 py-2.5 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                errors.fullName ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'
              }`}
            />
          </div>
          {errors.fullName && (
            <p id="fullName-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.fullName}</span>
            </p>
          )}
        </div>

        {/* Work Email */}
        <div className="space-y-1">
          <label
            htmlFor="account-email"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
          >
            Work Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="account-email"
              type="email"
              value={account.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="alex@enterprise.io"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full pl-9 pr-4 py-2.5 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                errors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'
              }`}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Organization Name */}
        <div className="space-y-1">
          <label
            htmlFor="account-organization"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
          >
            Organization / Company <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building className="w-4 h-4" />
            </div>
            <input
              id="account-organization"
              type="text"
              value={account.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
              placeholder="Acme Cloud Labs"
              aria-invalid={!!errors.organization}
              aria-describedby={errors.organization ? 'org-error' : undefined}
              className={`w-full pl-9 pr-4 py-2.5 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                errors.organization ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'
              }`}
            />
          </div>
          {errors.organization && (
            <p id="org-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.organization}</span>
            </p>
          )}
        </div>

        {/* Professional Polish Informative Callout */}
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-600 bg-blue-50/80 p-3 rounded-md border border-blue-100 mt-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Progress is synced to the URL and saved for this browser session.</span>
        </div>
      </div>
    </div>
  );
};
