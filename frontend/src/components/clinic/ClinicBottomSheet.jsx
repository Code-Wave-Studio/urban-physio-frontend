import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import FaIcon from '../FaIcon';
import BadgeList from '../platform/BadgeList';
import PartnerClinicBadge from '../PartnerClinicBadge';
import DoctorAvatar from '../DoctorAvatar';
import ClinicQuickActions from './ClinicQuickActions';
import ClinicMiniStats from './ClinicMiniStats';
import ClinicSocialLinks from './ClinicSocialLinks';
import ClinicStatusBadge, { ClinicStatusDetail } from './ClinicStatusBadge';
import ClinicTodaySlotsRow from './ClinicTodaySlotsRow';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { useClinicPreview } from '../../hooks/useClinicPreview';
import { showPartnerClinicBadge } from '../../utils/clinicBadges';
import { formatOpeningHoursRows, resolveClinicHours, getTodayDayKey } from '../../utils/clinicProfileUtils';
import { clinicProfileUrl, doctorProfileUrl } from '../../utils/profileUrls';
import ClinicCoverImage from './ClinicCoverImage';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { setFloatingActionsHidden } from '../../utils/floatingActionsBus';

function stopNav(e) {
  e.stopPropagation();
}

function clinicCover(clinic) {
  return resolveMediaUrl(clinic.cover_image) || resolveMediaUrl(clinic.logo) || null;
}

function locationLine(c) {
  const parts = [];
  if (c.address) parts.push(c.address);
  const cityState = [c.city_name, c.state_name].filter(Boolean).join(', ');
  if (cityState) parts.push(cityState);
  return parts.join(' · ') || c.city_name || 'India';
}

export default function ClinicBottomSheet({ clinic: initialClinic, open, onClose }) {
  const { clinic, loading } = useClinicPreview(initialClinic, open);
  const c = clinic || initialClinic;
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

  if (!initialClinic) return null;

  const hours = resolveClinicHours(c);
  const hoursRows = formatOpeningHoursRows(hours).slice(0, 7);
  const todayKey = getTodayDayKey();
  const doctors = c.doctors || [];
  const services = c.services_list?.length ? c.services_list : [];
  const facilities = c.facilities_list?.length ? c.facilities_list : [];
  const combined = [...services, ...facilities].slice(0, 12);
  const cover = clinicCover(c);
  const doctorCount = c.statistics?.doctor_count ?? c.doctor_count ?? doctors.length;

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
            aria-label="Close clinic preview"
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
            aria-labelledby="clinic-sheet-title"
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

              <div className="relative h-36 sm:h-40 md:h-44 shrink-0">
                {cover ? (
                  <ClinicCoverImage src={cover} alt={c.name} variant="sheet" eager />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-300">
                    <FaIcon icon="fa-hospital" className="text-5xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/25 to-transparent" />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center border border-white/20"
                  aria-label="Close"
                >
                  <FaIcon icon="fa-xmark" />
                </button>
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-0.5">
                    Partner clinic
                  </p>
                  <h2 id="clinic-sheet-title" className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2">
                    {c.name}
                  </h2>
                  <p className="text-white/85 text-xs mt-1 line-clamp-1">{locationLine(c)}</p>
                </div>
              </div>

              <div className="shrink-0 px-4 py-3 border-b border-slate-100 space-y-2.5 bg-white/95">
                <div className="flex flex-wrap items-center gap-2">
                  {showPartnerClinicBadge(c) && <PartnerClinicBadge />}
                  <BadgeList badges={c.badges} compact className="!mt-0" />
                  <ClinicStatusBadge hours={hours} />
                  {doctorCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 text-[11px] font-semibold border border-slate-200">
                      <FaIcon icon="fa-user-doctor" className="text-[10px]" />
                      {doctorCount} doctor{doctorCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <ClinicMiniStats clinic={c} hideDoctorCount />
                <ClinicStatusDetail hours={hours} />
                <ClinicSocialLinks clinic={c} />
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
                {loading && (
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <FaIcon icon="fa-spinner" className="fa-spin text-emerald-500" />
                    Loading details…
                  </p>
                )}

                <ClinicTodaySlotsRow clinicId={c.id} />

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                    <FaIcon icon="fa-location-dot" />
                    Address & contact
                  </h3>
                  <div className="text-sm text-slate-700 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                    {c.address && <p>{c.address}</p>}
                    <div className="flex flex-wrap gap-3 text-sm">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} onClick={stopNav} className="text-emerald-700 font-semibold">
                          <FaIcon icon="fa-phone" className="mr-1" />
                          {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} onClick={stopNav} className="text-slate-600">
                          {c.email}
                        </a>
                      )}
                    </div>
                  </div>
                </section>

                {hoursRows.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                      <FaIcon icon="fa-clock" />
                      Opening hours
                    </h3>
                    <ul className="rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100 text-sm">
                      {hoursRows.map((row) => (
                        <li
                          key={row.key}
                          className={`flex justify-between gap-2 px-3 py-2 ${
                            row.key === todayKey ? 'bg-emerald-50 font-medium' : 'bg-white'
                          }`}
                        >
                          <span>{row.label}</span>
                          <span className={row.closed ? 'text-slate-400' : 'text-slate-600'}>{row.text}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {combined.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Services & facilities</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {combined.map((item) => (
                        <span
                          key={item}
                          className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {c.description?.trim() && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">About</h3>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-5">{c.description}</p>
                  </section>
                )}

                {doctors.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Physiotherapists</h3>
                    <ul className="space-y-2">
                      {doctors.slice(0, 5).map((doc) => (
                        <li key={doc.id}>
                          <Link
                            to={doctorProfileUrl(doc)}
                            onClick={(e) => {
                              stopNav(e);
                              onClose();
                            }}
                            className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 hover:border-emerald-200 hover:bg-emerald-50/40 transition"
                          >
                            <DoctorAvatar doctor={doc} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-slate-900 truncate">
                                Dr. {doc.first_name} {doc.last_name}
                              </p>
                              <p className="text-xs text-slate-500">{doc.specialization || 'Physiotherapist'}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <Link
                  to={clinicProfileUrl(c)}
                  onClick={() => onClose()}
                  className="block text-center text-sm font-semibold text-emerald-700 py-2"
                >
                  View full clinic profile →
                </Link>
              </div>

              <div className="shrink-0 z-20 border-t border-slate-100 bg-white px-3 sm:px-4 pt-3 pb-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
                <ClinicQuickActions clinic={c} onNavigate={onClose} variant="sheet" className="!pb-0" />
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
