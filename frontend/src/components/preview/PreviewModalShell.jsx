import { AnimatePresence, motion } from 'framer-motion';
import GlassModal, { GlassModalBody, GlassModalFooter } from '../GlassModal';
import FaIcon from '../FaIcon';

/**
 * Premium preview modal shell with motion + glass styling.
 */
export default function PreviewModalShell({
  open,
  onClose,
  titleId,
  size = 'lg',
  accent = 'primary',
  header,
  footer,
  children,
  panelClassName = '',
  bodyClassName = '',
}) {
  const accentRing = accent === 'emerald' ? 'ring-emerald-200/60' : 'ring-primary-200/60';

  return (
    <AnimatePresence>
      {open ? (
        <GlassModal
          open={open}
          onClose={onClose}
          size={size}
          titleId={titleId}
          panelClassName={`!p-0 !overflow-hidden ${accentRing} ring-2 ${panelClassName}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="flex flex-col min-h-0 flex-1 max-h-[inherit]"
          >
            {header}
            <GlassModalBody className={`!px-0 !py-0 ${bodyClassName}`}>{children}</GlassModalBody>
            {footer && <GlassModalFooter>{footer}</GlassModalFooter>}
          </motion.div>
        </GlassModal>
      ) : null}
    </AnimatePresence>
  );
}

export function PreviewSection({ title, icon, children, className = '' }) {
  return (
    <section className={`px-5 sm:px-6 py-4 border-t border-slate-100/90 first:border-t-0 ${className}`}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
        {icon && <FaIcon icon={icon} className="text-slate-400 text-xs" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function PreviewChip({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    primary: 'bg-primary-50 text-primary-800 border-primary-100',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    sky: 'bg-sky-50 text-sky-800 border-sky-100',
    amber: 'bg-amber-50 text-amber-900 border-amber-100',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${tones[tone] || tones.slate}`}
    >
      {children}
    </span>
  );
}
