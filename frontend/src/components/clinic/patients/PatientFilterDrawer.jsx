import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import FaIcon from '../../FaIcon';
import { STATUS_PILLS } from './patientDirectoryUtils';

/**
 * Right-side advanced filter drawer (desktop) / bottom panel (mobile).
 */
export default function PatientFilterDrawer({
  open,
  onClose,
  filters,
  onChange,
  filterTags = [],
  onClear,
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9990] flex justify-end">
          <motion.button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="relative flex h-full w-full max-w-md flex-col border-l border-white/50 bg-white/95 shadow-2xl backdrop-blur-xl sm:rounded-l-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Advanced filters</h2>
                <p className="mt-0.5 text-xs text-slate-500">Narrow the directory without leaving this page</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <FaIcon icon="fa-xmark" />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Portal status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_PILLS.map((s) => {
                    const active = (filters.status || 'all') === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onChange({ ...filters, status: s.id })}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tag
                  </span>
                  <input
                    className="input-field w-full text-sm"
                    list="patient-dir-tags"
                    placeholder="e.g. Insurance, Corporate…"
                    value={filters.tag || ''}
                    onChange={(e) => onChange({ ...filters, tag: e.target.value })}
                  />
                  <datalist id="patient-dir-tags">
                    {filterTags.map((t) => (
                      <option key={t.tag || t} value={t.tag || t} />
                    ))}
                  </datalist>
                </label>
                {filterTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {filterTags.slice(0, 16).map((t) => {
                      const tag = t.tag || t;
                      const active = (filters.tag || '') === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => onChange({ ...filters, tag: active ? '' : tag })}
                          className={`rounded-lg px-2 py-1 text-[11px] font-medium ring-1 transition ${
                            active
                              ? 'bg-teal-50 text-teal-800 ring-teal-200'
                              : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {tag}
                          {t.cnt != null ? ` · ${t.cnt}` : ''}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <footer className="flex gap-2 border-t border-slate-100 px-5 py-4">
              <button type="button" className="btn-outline flex-1 text-sm" onClick={onClear}>
                Clear
              </button>
              <button type="button" className="btn-primary flex-1 text-sm" onClick={onClose}>
                Apply
              </button>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
