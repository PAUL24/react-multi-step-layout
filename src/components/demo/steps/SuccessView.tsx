import { useState } from 'react';
import { CheckCircle2, Copy, Check, RotateCcw, Download } from 'lucide-react';

interface SuccessViewProps<TData> {
  data: TData;
  onRestart: () => void;
}

export function SuccessView<TData>({ data, onRestart }: SuccessViewProps<TData>) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
        <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1.5">
        Workspace Configured Successfully!
      </h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
        Your multi-step form data has been validated and committed. The session draft has been cleared.
      </p>

      {/* JSON Output Payload */}
      <div className="text-left bg-slate-900 rounded-lg p-4 mb-6 border border-slate-800">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs text-slate-400">
          <span className="font-mono font-medium text-slate-300">persisted_payload.json</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
        <pre className="text-emerald-400 font-mono text-xs overflow-x-auto max-h-56 p-1">
          {jsonString}
        </pre>
      </div>

      {/* Action to restart */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm shadow-blue-500/20 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start New Wizard Flow</span>
        </button>
      </div>
    </div>
  );
}
