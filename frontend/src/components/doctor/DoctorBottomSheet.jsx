import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import FaIcon from '../FaIcon';
import DoctorAvatar from '../DoctorAvatar';
import DoctorProfileBanner from './DoctorProfileBanner';
import DoctorCredentialsSection from './DoctorCredentialsSection';
import DoctorAvailabilitySection from './DoctorAvailabilitySection';
import DoctorQuickActions from './DoctorQuickActions';
import { PreviewChip } from '../preview/PreviewModalShell';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { useDoctorPreview } from '../../hooks/useDoctorPreview';
import { bookDoctorUrl } from '../../utils/bookUrl';
import { doctorProfileUrl } from '../../utils/profileUrls';
import { doctorMinFee, formatReviewCount } from '../../utils/doctorProfileUtils';
import { setFloatingActionsHidden } from '../../utils/floatingActionsBus';

const SERVICE_META = {
  clinic: { icon: 'fa-hospital', label: 'Clinic visit', feeKey: 'consultation_fee' },
  online: { icon: 'fa-video', label: 'Online', feeKey: 'online_fee' },
  home_visit: { icon: 'fa-house-medical', label: 'Home visit', feeKey: 'home_visit_fee' },
};

const ALL_SERVICES = ['clinic', 'online', 'home_visit'];

function stopNav(e) {
  e.stopPropagation();
}

export default function DoctorBottomSheet({ doctor: initialDoctor, open, onClose }) {
  const { doctor, loading, availableToday, packageFrom } = useDoctorPreview(initialDoctor, open);
  const d = doctor || initialDoctor;
  const dragControls = useDragControls();
  const sheetRef = useRef(null);
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 280], [1, 0.35]);

  useBodyScrollLock(open);

  useEffect(() => {
    if (open) y.set(0);
  }, [open, y]);

  useEffect(() => {
    if (!open) return undefined;
    setFloatingActionsHidden(true, 'sheet');
    return () => setFloatingActionsHidden(false, 'sheet');
  }, [open]);

  if (!initialDoctor) return null;

  const rating = Number(d.rating_avg) || 0;
  const reviewCount = Number(d.rating_count) || 0;
  const exp = Number(d.experience_years) || 0;
  const enabled = d.enabled_services?.length ? d.enabled_services : ALL_SERVICES;
  const languages = d.languages_list?.length ? d.languages_list : ['English', 'Hindi'];
  const clinics = d.clinics || [];
  const minFee = doctorMinFee(d, enabled);
  const startingPrice = packageFrom ?? minFee;
  const bio = d.bio?.trim();

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 110 || info.velocity.y > 450) {
      onClose();
      return;
    }
    y.set(0);
  };

  const sheet = (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close doctor preview"
            className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px]"
            style={{ opacity: backdropOpacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="doctor-sheet-title"
            className="fixed inset-x-0 bottom-0 z-[125] flex flex-col h-[min(96dvh,calc(100dvh-env(safe-area-inset-top,0px)-0.5rem))]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 320 }}
            dragElastic={{ top: 0, bottom: 0.12 }}
            style={{ y }}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col h-full bg-white rounded-t-[1.75rem] shadow-2xl shadow-slate-900/20 border border-slate-200/80 border-b-0 overflow-hidden pb-[env(safe-area-inset-bottom)]">
              <div
                className="shrink-0 pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto" />
              </div>

              <div className="relative h-36 sm:h-40 shrink-0">
                <DoctorProfileBanner className="absolute inset-0 h-full" specialization={d.specialization} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/25 to-transparent" />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center border border-white/20"
                  aria-label="Close"
                >
                  <FaIcon icon="fa-xmark" />
                </button>
                <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
                  <div className="shrink-0 ring-2 ring-white/90 shadow-lg rounded-2xl overflow-hidden">
                    <DoctorAvatar doctor={d} size="lg" className="!w-16 !h-16 sm:!w-[4.5rem] sm:!h-[4.5rem]" />
                  </div>
                  <div className="min-w-0 flex-1 pb-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200 mb-0.5">
                      Physiotherapist
                    </p>
                    <h2 id="doctor-sheet-title" className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2">
                      Dr. {d.first_name} {d.last_name}
                    </h2>
                    <p className="text-white/85 text-xs mt-0.5 line-clamp-1">{d.specialization || 'Physiotherapist'}</p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 px-4 py-3 border-b border-slate-100 space-y-2.5 bg-white/95">
                <div className="flex flex-wrap items-center gap-2">
                  {rating > 0 ? (
                    <PreviewChip tone="amber">
                      <FaIcon icon="fa-star" className="text-amber-500" />
                      {rating.toFixed(1)}
                      <span className="font-normal opacity-80">({formatReviewCount(reviewCount)})</span>
                    </PreviewChip>
                  ) : (
                    <PreviewChip>New on platform</PreviewChip>
                  )}
                  {exp > 0 && (
                    <PreviewChip tone="sky">
                      <FaIcon icon="fa-briefcase" />
                      {exp}+ years
                    </PreviewChip>
                  )}
                  {d.city_name && (
                    <PreviewChip>
                      <FaIcon icon="fa-location-dot" />
                      {d.city_name}
                    </PreviewChip>
                  )}
                  {availableToday === true && (
                    <PreviewChip tone="emerald">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Available today
                    </PreviewChip>
                  )}
                  {availableToday === false && !loading && <PreviewChip tone="slate">No slots today</PreviewChip>}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
                {loading && (
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <FaIcon icon="fa-spinner" className="fa-spin text-primary-500" />
                    Loading details…
                  </p>
                )}

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                    <FaIcon icon="fa-indian-rupee-sign" />
                    Consultation fees
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">Tap a fee to book with that consultation type</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_SERVICES.map((type) => {
                      const meta = SERVICE_META[type];
                      const active = enabled.includes(type);
                      const fee = Number(d[meta.feeKey]) || 0;
                      const cardClass = `rounded-xl border p-3 text-center transition ${
                        active
                          ? 'bg-white border-slate-200 shadow-sm active:scale-[0.98]'
                          : 'bg-slate-50/80 border-slate-100 opacity-60'
                      }`;

                      const inner = (
                        <>
                          <FaIcon icon={meta.icon} className={`text-sm mb-1.5 ${active ? 'text-primary-600' : 'text-slate-400'}`} />
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">{meta.label}</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">
                            {active && fee > 0 ? `₹${fee.toLocaleString('en-IN')}` : '—'}
                          </p>
                        </>
                      );

                      if (!active) {
                        return (
                          <div key={type} className={cardClass} aria-disabled>
                            {inner}
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={type}
                          to={bookDoctorUrl(d.id, { type })}
                          onClick={() => onClose()}
                          className={cardClass}
                          aria-label={`Book ${meta.label}${fee > 0 ? ` — ₹${fee.toLocaleString('en-IN')}` : ''}`}
                        >
                          {inner}
                        </Link>
                      );
                    })}
                  </div>
                  {startingPrice != null && (
                    <p className="text-xs text-slate-600 mt-3 flex items-center gap-1.5">
                      <FaIcon icon="fa-box-open" className="text-primary-500" />
                      Packages from{' '}
                      <strong className="text-slate-800">₹{Number(startingPrice).toLocaleString('en-IN')}</strong>
                    </p>
                  )}
                </section>

                {bio && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                      <FaIcon icon="fa-user-doctor" />
                      About
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-5">{bio}</p>
                  </section>
                )}

                <DoctorCredentialsSection doctor={d} variant="compact" />

                <DoctorAvailabilitySection doctor={d} onNavigate={onClose} variant="compact" />

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                    <FaIcon icon="fa-language" />
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <PreviewChip key={lang}>{lang}</PreviewChip>
                    ))}
                  </div>
                </section>

                {clinics.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                      <FaIcon icon="fa-hospital" />
                      Associated clinics
                    </h3>
                    <ul className="space-y-2">
                      {clinics.slice(0, 4).map((c) => (
                        <li
                          key={c.id}
                          className="flex items-start gap-2.5 text-sm text-slate-700 rounded-xl bg-slate-50/90 border border-slate-100 px-3 py-2.5"
                        >
                          <FaIcon icon="fa-hospital" className="text-emerald-600 mt-0.5 shrink-0" />
                          <span className="min-w-0">
                            <span className="font-semibold text-slate-900">{c.name}</span>
                            {c.is_primary ? (
                              <span className="ml-1.5 text-[10px] font-bold uppercase text-primary-600">Primary</span>
                            ) : null}
                            {(c.address || c.city_name) && (
                              <span className="block text-xs text-slate-500 mt-0.5 truncate">
                                {[c.address, c.city_name].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {d.distance_km != null && (
                  <PreviewChip tone="sky">
                    <FaIcon icon="fa-route" />
                    {Number(d.distance_km).toFixed(1)} km from you
                  </PreviewChip>
                )}

                <Link
                  to={doctorProfileUrl(d)}
                  onClick={(e) => {
                    stopNav(e);
                    onClose();
                  }}
                  className="block text-center text-sm font-semibold text-primary-700 py-2"
                >
                  View full profile →
                </Link>
              </div>

              <div className="shrink-0 z-20 border-t border-slate-100 bg-white px-3 sm:px-4 pt-3 pb-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
                <DoctorQuickActions doctor={d} onNavigate={onClose} variant="sheet" className="!pb-0" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return sheet;
  return createPortal(sheet, document.body);
}
