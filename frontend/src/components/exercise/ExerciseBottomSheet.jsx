import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FaIcon from '../FaIcon';

export default function ExerciseBottomSheet({
  open,
  onClose,
  title,
  subtitle,
  icon = 'fa-dumbbell',
  headerGradient,
  children,
  footer,
  className = '',
  maxHeight = 'max-h-[90vh]',
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      setIsExpanded(false);
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleDragEnd = (event, info) => {
    if (info.offset.y > 110 || info.velocity.y > 550) {
      onClose();
    } else if (info.offset.y < -60 || info.velocity.y < -400) {
      setIsExpanded(true);
    } else if (info.offset.y > 40) {
      setIsExpanded(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4">
          {/* Backdrop — background page remains visible behind sheet */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Bottom Sheet Container */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.9 }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative z-10 w-full bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden transition-all duration-300 md:max-w-xl md:max-h-[85vh] ${
              isExpanded ? 'h-[95vh]' : maxHeight
            } ${className}`}
          >
            {/* Mobile Drag Handle Bar */}
            <div className="w-full pt-2.5 pb-1 flex flex-col items-center justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none select-none md:hidden bg-slate-100/70 border-b border-slate-200/50">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Swipe down to close
              </span>
            </div>

            {/* Header */}
            {(title || subtitle || headerGradient) && (
              <div
                className={`p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0 ${
                  headerGradient || 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {icon && (
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                      <FaIcon icon={icon} className="text-base" />
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && <h2 className="font-bold text-slate-800 text-lg md:text-xl truncate">{title}</h2>}
                    {subtitle && <p className="text-xs text-slate-600 font-medium truncate mt-0.5">{subtitle}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center shrink-0 transition"
                  aria-label="Close"
                >
                  <FaIcon icon="fa-xmark" className="text-sm" />
                </button>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div ref={contentRef} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 touch-pan-y">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/90 shrink-0 flex flex-wrap items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
