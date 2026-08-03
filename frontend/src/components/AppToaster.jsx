import { Toaster, ToastBar, toast, resolveValue } from 'react-hot-toast';
import FaIcon from './FaIcon';

/**
 * Global toast host — every notification gets a dismiss (×) control and sits
 * below the site header so stacked toasts do not cover the menu toggle.
 */
export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      containerClassName="app-toaster"
      gutter={8}
      toastOptions={{
        className:
          'app-toast glass-card !bg-white/95 !backdrop-blur-xl !border-slate-200/80 !text-slate-800 !shadow-lg !rounded-xl',
        style: {
          padding: '10px 12px',
          maxWidth: 'min(22rem, calc(100vw - 1.5rem))',
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div className="flex items-start gap-2.5 w-full min-w-0">
              {icon && <span className="shrink-0 mt-0.5 leading-none">{icon}</span>}
              <span className="flex-1 min-w-0 text-sm leading-snug break-words">
                {resolveValue(message, t)}
              </span>
              {t.type !== 'loading' && (
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="app-toast-dismiss shrink-0 -mr-0.5 -mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                  aria-label="Dismiss notification"
                >
                  <FaIcon icon="fa-xmark" className="text-xs" />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
