import React, { useState } from 'react';
import {
  Code,
  Keyboard,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useMultiStep } from '../stepper/useMultiStep';

interface DemoControlsProps {
  allowNonLinear: boolean;
  setAllowNonLinear: (val: boolean) => void;
  persistState: boolean;
  setPersistState: (val: boolean) => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  allowNonLinear,
  setAllowNonLinear,
  persistState,
  setPersistState,
}) => {
  const {
    currentStep,
    totalSteps,
    activeStepCount,
    progress,
    completedSteps,
    formData,
    errors,
    resetProgress,
  } = useMultiStep();

  const [activeTab, setActiveTab] = useState<'state' | 'config' | 'shortcuts'>('state');

  return (
    <div className="w-full max-w-3xl mx-auto mt-6 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('state')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'state'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>State Inspector</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'config'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Props & Options</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'shortcuts'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Step {currentStep} | {progress}%
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5">
        {activeTab === 'state' && (
          <div className="space-y-4">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Active Index</span>
                <span className="text-sm font-mono font-bold text-slate-900">{currentStep} ({activeStepCount}/{totalSteps} active)</span>
              </div>
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Track Progress</span>
                <span className="text-sm font-mono font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Completed Steps</span>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {completedSteps.length > 0 ? `[${completedSteps.join(', ')}]` : 'None'}
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Validation Errors</span>
                <span className={`text-sm font-mono font-bold ${Object.keys(errors).length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {Object.keys(errors).length} active
                </span>
              </div>
            </div>

            {/* Live Data Inspector */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Live `formData` JSON:</span>
                <span className="text-[11px] font-mono">useMultiStep().formData</span>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 text-xs font-mono rounded-lg overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>

            {/* Error Map */}
            {Object.keys(errors).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs text-red-600 font-semibold">
                  <span>Current Validation Errors:</span>
                </div>
                <pre className="p-3 bg-red-950/20 border border-red-200 text-red-900 text-xs font-mono rounded-md overflow-x-auto">
                  {JSON.stringify(errors, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Toggle Non-linear Navigation */}
              <label className="p-3 rounded-md border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-900 block">Allow Free Step Jumping</span>
                  <span className="text-slate-500 text-[11px]">Bypasses sequential step locking</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowNonLinear}
                  onChange={(e) => setAllowNonLinear(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              {/* Toggle session persistence */}
              <label className="p-3 rounded-md border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-900 block">Session Autosave</span>
                  <span className="text-slate-500 text-[11px]">Restores step and inputs after refresh</span>
                </div>
                <input
                  type="checkbox"
                  checked={persistState}
                  onChange={(e) => setPersistState(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Storage key: <code className="font-mono text-slate-700">multistep_wizard_state</code></span>
              <button
                type="button"
                onClick={resetProgress}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset All Progress</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'shortcuts' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-600 mb-2">
              The multi-step layout includes built-in keyboard navigation shortcuts and full WCAG accessibility support:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-md border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Advance to Next Step</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-bold text-[11px]">
                  Alt + →
                </kbd>
              </div>
              <div className="p-2.5 rounded-md border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Go to Previous Step</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-bold text-[11px]">
                  Alt + ←
                </kbd>
              </div>
              <div className="p-2.5 rounded-md border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Form Input Quick Submit</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-bold text-[11px]">
                  Ctrl/Cmd + Enter
                </kbd>
              </div>
              <div className="p-2.5 rounded-md border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Progress Bar Tab Navigation</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-bold text-[11px]">
                  Arrow Keys / Home / End
                </kbd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
