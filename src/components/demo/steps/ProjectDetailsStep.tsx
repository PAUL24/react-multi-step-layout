import React from 'react';
import { Globe, Sparkles, AlertCircle } from 'lucide-react';
import { useMultiStep } from '../../stepper/useMultiStep';

export interface ProjectFormData {
  projectName: string;
  environment: 'development' | 'staging' | 'production';
  framework: 'react' | 'vue' | 'nextjs' | 'node';
  enableCustomDomain: boolean;
  domainName: string;
}

export const ProjectDetailsStep: React.FC = () => {
  const { formData, updateFormData, errors } = useMultiStep<{
    project: ProjectFormData;
  }>();

  const project = formData.project || {
    projectName: '',
    environment: 'development',
    framework: 'react',
    enableCustomDomain: false,
    domainName: '',
  };

  const handleChange = <K extends keyof ProjectFormData>(
    field: K,
    value: ProjectFormData[K]
  ) => {
    const current = formData.project || {
      projectName: '',
      environment: 'development',
      framework: 'react',
      enableCustomDomain: false,
      domainName: '',
    };
    updateFormData({
      project: {
        ...current,
        [field]: value,
      },
    });
  };

  const frameworks: Array<{
    id: ProjectFormData['framework'];
    name: string;
    desc: string;
  }> = [
    { id: 'react', name: 'React SPA', desc: 'Vite + React with motion animations' },
    { id: 'nextjs', name: 'Next.js App', desc: 'Full-stack React with SSR' },
    { id: 'node', name: 'Express API', desc: 'Lightweight Node.js backend' },
    { id: 'vue', name: 'Vue.js App', desc: 'Progressive JavaScript framework' },
  ];

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Project Architecture & Target
        </h2>
        <p className="text-sm text-slate-500">
          Configure runtime environment parameters, stack template, and DNS endpoints.
        </p>
      </div>

      {/* Project Name */}
      <div className="space-y-1">
        <label
          htmlFor="project-name"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
        >
          Project Identifier <span className="text-red-500">*</span>
        </label>
        <input
          id="project-name"
          type="text"
          value={project.projectName}
          onChange={(e) => handleChange('projectName', e.target.value)}
          placeholder="e.g. core-platform-v1"
          aria-invalid={!!errors.projectName}
          aria-describedby={errors.projectName ? 'projectName-error' : undefined}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
            errors.projectName ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'
          }`}
        />
        {errors.projectName && (
          <p id="projectName-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.projectName}</span>
          </p>
        )}
      </div>

      {/* Framework Selection Cards */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Architecture / Framework Stack
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {frameworks.map((fw) => {
            const isSelected = project.framework === fw.id;
            return (
              <button
                key={fw.id}
                type="button"
                onClick={() => handleChange('framework', fw.id)}
                className={`p-3 text-left rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 text-slate-900 ring-1 ring-blue-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{fw.name}</span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p
                  className={`text-xs ${
                    isSelected ? 'text-slate-600' : 'text-slate-500'
                  }`}
                >
                  {fw.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Environment */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Deployment Target Environment
        </label>
        <div className="flex items-center gap-3">
          {(['development', 'staging', 'production'] as const).map((env) => (
            <label
              key={env}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md border text-xs font-semibold capitalize cursor-pointer transition-all ${
                project.environment === env
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="environment"
                value={env}
                checked={project.environment === env}
                onChange={() => handleChange('environment', env)}
                className="sr-only"
              />
              <span>{env}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Domain Toggle */}
      <div className="pt-3 border-t border-slate-200">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-800">
              Configure Custom Domain DNS
            </span>
          </div>
          <input
            type="checkbox"
            checked={project.enableCustomDomain}
            onChange={(e) => handleChange('enableCustomDomain', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </label>

        {project.enableCustomDomain && (
          <div className="mt-3 pl-6">
            <input
              type="text"
              value={project.domainName}
              onChange={(e) => handleChange('domainName', e.target.value)}
              placeholder="e.g. app.acmecloud.io"
              aria-invalid={!!errors.domainName}
              className={`w-full px-3 py-2 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                errors.domainName ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            {errors.domainName && (
              <p className="mt-1 text-xs text-red-600">{errors.domainName}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
