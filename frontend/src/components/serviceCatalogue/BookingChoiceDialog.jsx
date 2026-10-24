import { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FaIcon from '../FaIcon';
import { bookingChoiceSummary } from './serviceCatalogueModel';

/**
 * “How would you like to book?” choice dialog.
 * Options, prices, and destinations come from the caller’s catalogue config.
 */
const BookingChoiceDialog = forwardRef(function BookingChoiceDialog(
  { titleId = 'booking-choice-title', item, options = [], onClose, onChoose },
  ref
) {
  const panelRef = useRef(null);

  function setPanel(node) {
    panelRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      event.preventDefault();
      onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus?.({ preventScroll: true });
  }, []);

  const summary = bookingChoiceSummary(item);

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/50 p-4"
      onClick={onClose}
    >
      <div
        ref={setPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-summary`}
        tabIndex={-1}
        className="w-full max-w-[28rem] max-h-[min(92dvh,40rem)] overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.28)] outline-none sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-[#1d1d1f]">
            How would you like to book?
          </h2>
          <button type="button" className="svc-sheet-close" aria-label="Close booking options" onClick={onClose}>
            ×
          </button>
        </div>
        <p id={`${titleId}-summary`} className="mt-1 text-sm text-[#6e6e73]">
          {summary}
        </p>
        <div className="mt-4 space-y-3">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#e5e5ea] bg-white px-4 py-3.5 text-left transition hover:border-[#c5c5cc] hover:bg-[#f7f7f8]"
              onClick={() => onChoose?.(option)}
            >
              <span className="min-w-0 text-[15px] font-semibold text-[#1d1d1f]">{option.label}</span>
              <FaIcon icon="fa-chevron-right" className="shrink-0 text-sm text-[#1d1d1f]" />
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#6e6e73]">Payments are only made through The Urban Physio.</p>
      </div>
    </div>,
    document.body
  );
});

export default BookingChoiceDialog;
