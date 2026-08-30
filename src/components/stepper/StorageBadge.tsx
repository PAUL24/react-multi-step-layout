import React, { useState } from 'react';
import { Save, RefreshCw, X } from 'lucide-react';
import { useMultiStep } from './useMultiStep';

export const StorageBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lastSavedAt, clearPersistedStorage, resetProgress } = useMultiStep();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!lastSavedAt) return null;

  const formattedTime = new Date(lastSavedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50/80 border border-blue-100 text-slate-700 text-xs ${className}`}
    >
      <Save className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      <span className="hidden sm:inline font-medium">Autosaved</span>
      <span className="font-mono text-[11px] text-slate-500">{formattedTime}</span>

      {showClearConfirm ? (
        <span className="inline-flex items-center gap-1 ml-1 text-[11px]">
          <span>Clear draft?</span>
          <button
            type="button"
            onClick={() => {
              resetProgress();
              setShowClearConfirm(false);
            }}
            className="text-red-600 font-semibold hover:underline cursor-pointer"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setShowClearConfirm(false)}
            className="text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="text-slate-500 hover:text-slate-900 hover:underline text-[11px] ml-1 cursor-pointer font-medium"
          title="Clear local storage cache"
        >
          Clear
        </button>
      )}
    </div>
  );
};
