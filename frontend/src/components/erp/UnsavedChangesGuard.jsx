import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Blocks navigation when there are unsaved changes.
 * Shows a confirm dialog on browser back/refresh.
 */
export default function UnsavedChangesGuard({ isDirty }) {
  // Block in-app navigation
  const blocker = useBlocker(isDirty);

  // Block browser back / refresh
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (blocker.state !== 'blocked') return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Unsaved Changes</h2>
        <p className="text-sm text-slate-600 mb-6">
          You have unsaved changes. If you leave now, your changes will be lost.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
            onClick={() => blocker.proceed()}
          >
            Discard Changes
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            onClick={() => blocker.reset()}
          >
            Keep Editing
          </button>
        </div>
      </div>
    </div>
  );
}
