import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FaIcon from './FaIcon';
import { hapticClose, hapticOpen } from '../utils/haptics';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Site-wide glass-white modal shell (portal + light backdrop).
 */
export default function GlassModal({
  open,
  onClose,
  children,
  size = 'md',
  titleId,
  closeOnBackdrop = true,
  preventClose = false,
  zIndex = 9999,
  className = '',
  panelClassName = '',
}) {
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) hapticOpen();
    if (!open && wasOpen.current) hapticClose();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !preventClose) onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, preventClose, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      {...(titleId ? { 'aria-labelledby': titleId } : {})}
    >
      <button
        type="button"
        className="glass-modal-backdrop fixed inset-0 w-full h-full cursor-default animate-fade-in"
        aria-label="Close dialog"
        onClick={() => closeOnBackdrop && !preventClose && onClose()}
      />

      <div className="fixed inset-0 overflow-y-auto overscroll-contain pointer-events-none p-4 sm:p-6 md:p-8">
        <div className={`flex min-h-full w-full items-start justify-center sm:items-center ${className}`}>
          <div
            className={`glass-modal-panel relative w-full my-auto sm:my-4 max-h-[calc(100dvh-2rem)] sm:max-h-[min(calc(100dvh-4rem),920px)] ${SIZES[size] || SIZES.md} pointer-events-auto flex flex-col ${panelClassName}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const ACCENT_ICON = {
  primary: 'bg-primary-100 text-primary-700 border-primary-200/60',
  violet: 'bg-violet-100 text-violet-700 border-violet-200/60',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200/60',
};

const ACCENT_PROGRESS_TRACK = {
  primary: 'bg-primary-100',
  violet: 'bg-violet-100',
  cyan: 'bg-cyan-100',
};

const ACCENT_PROGRESS_FILL = {
  primary: 'bg-primary-500',
  violet: 'bg-violet-500',
  cyan: 'bg-cyan-500',
};

export function GlassModalHeader({
  title,
  subtitle,
  titleId,
  icon = 'fa-circle-info',
  onClose,
  disabledClose = false,
  accent = 'primary',
  children,
}) {
  return (
    <div className="glass-modal-header shrink-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${ACCENT_ICON[accent] || ACCENT_ICON.primary}`}
          >
            <FaIcon icon={icon} className="text-lg" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="font-bold text-lg md:text-xl text-slate-800 truncate">
              {title}
            </h2>
            {subtitle && <p className="text-slate-500 text-xs md:text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={disabledClose}
            className="glass-modal-close shrink-0"
            aria-label="Close"
          >
            <FaIcon icon="fa-xmark" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function GlassModalProgress({ step, total, accent = 'primary' }) {
  return (
    <div className="mt-4 flex items-center gap-2">
      <div
        className={`flex-1 h-1.5 rounded-full overflow-hidden ${ACCENT_PROGRESS_TRACK[accent] || ACCENT_PROGRESS_TRACK.primary}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${ACCENT_PROGRESS_FILL[accent] || ACCENT_PROGRESS_FILL.primary}`}
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap font-medium">
        Step {step} of {total}
      </span>
    </div>
  );
}

export function GlassModalFooter({ children }) {
  return <div className="glass-modal-footer shrink-0">{children}</div>;
}

/** Scrollable modal body — use between header and footer for long forms */
export function GlassModalBody({ children, className = '' }) {
  return (
    <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 md:px-6 md:py-5 ${className}`}>
      {children}
    </div>
  );
}
