import { useEffect } from 'react';

/**
 * Warns on browser refresh/close when there are unsaved changes.
 *
 * Note: in-app navigation blocking via `useBlocker` requires a data router
 * (`createBrowserRouter`). This app uses `BrowserRouter`, so we only use
 * the native `beforeunload` hook — calling `useBlocker` here would crash
 * the patient detail page with a blank screen.
 */
export default function UnsavedChangesGuard({ isDirty }) {
  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  return null;
}
