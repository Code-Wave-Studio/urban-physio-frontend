import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import FaIcon from '../../FaIcon';
import {
  formatDate,
  initials,
  maskName,
  maskPhone,
  patientDetailPath,
  statusMeta,
} from './patientDirectoryUtils';

/**
 * Cmd/Ctrl+K command palette for jumping to patients.
 */
export default function PatientCommandPalette({
  open,
  onClose,
  patients = [],
  privacy = false,
  onSelect,
  onNewPatient,
}) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setQ('');
    setIdx(0);
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return patients.slice(0, 8);
    return patients
      .filter((p) => {
        const hay = [
          p.patient_name,
          p.phone,
          p.email,
          p.patient_key,
          ...(p.tags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(needle);
      })
      .slice(0, 10);
  }, [patients, q]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && results[idx]) {
        e.preventDefault();
        onSelect?.(results[idx]);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onSelect, results, idx]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center px-3 pt-[12vh] sm:pt-[16vh]">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search patients"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-2xl shadow-slate-900/20 backdrop-blur-xl"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <FaIcon icon="fa-magnifying-glass" className="text-slate-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Jump to patient by name, phone, email, or ID…"
                className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <kbd className="hidden sm:inline rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                esc
              </kbd>
            </div>
            <ul className="max-h-[min(50vh,360px)] overflow-y-auto py-2">
              {results.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-slate-500">No matches</li>
              ) : (
                results.map((p, i) => {
                  const meta = statusMeta(p.portal_status);
                  return (
                    <li key={patientDetailPath(p)}>
                      <Link
                        to={patientDetailPath(p)}
                        onClick={() => {
                          onSelect?.(p);
                          onClose();
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 transition ${
                          i === idx ? 'bg-teal-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/15 to-cyan-500/10 text-xs font-bold text-teal-800">
                          {initials(p.patient_name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {maskName(p.patient_name, privacy)}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {maskPhone(p.phone, privacy)}
                            {p.last_visit ? ` · Last ${formatDate(p.last_visit)}` : ''}
                          </span>
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${meta.className}`}>
                          {meta.label}
                        </span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-[11px] text-slate-500">
              <span>↑↓ navigate · Enter open</span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 font-semibold text-teal-700 hover:text-teal-800"
                onClick={() => {
                  onNewPatient?.();
                  onClose();
                }}
              >
                <FaIcon icon="fa-user-plus" />
                New patient
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
