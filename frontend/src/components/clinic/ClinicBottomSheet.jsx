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
import { formatOpeningHoursRows, resolveClinicHours, getTodayDayKey, isClinicOpenNow } from '../../utils/clinicProfileUtils';
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

  const isOfflineOrClosed = Boolean(
    c.is_closed || (c.profile_public !== undefined && Number(c.profile_public) === 0)
  );

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
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Close clinic preview"
            className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm"
            style={{ opacity: backdropOpacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container — Centered Desktop Card / Sliding Mobile Sheet */}
          <div className="fixed inset-0 z-[125] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="clinic-sheet-title"
              className="pointer-events-auto w-full sm:max-w-2xl h-[min(92dvh,760px)] sm:h-[min(88dvh,740px)] flex flex-col bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl shadow-slate-900/30 border border-slate-200/80 overflow-hidden"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 320 }}
              dragElastic={{ top: 0, bottom: 0.12 }}
              style={{ y }}
              onDragEnd={handleDragEnd}
            >
              {/* Drag Handle Bar for Mobile */}
              <div
                className="shrink-0 pt-2.5 pb-1 sm:hidden cursor-grab active:cursor-grabbing touch-none bg-white"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto" />
              </div>

              {/* Cover Banner Header */}
              <div className="relative h-40 sm:h-48 shrink-0 bg-slate-900 overflow-hidden">
                {cover ? (
                  <ClinicCoverImage src={cover} alt={c.name} variant="sheet" eager />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 flex items-center justify-center text-emerald-200/40">
                    <FaIcon icon="fa-hospital" className="text-6xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Floating Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 shadow-md backdrop-blur-md transition active:scale-95 z-10"
                  aria-label="Close"
                >
                  <FaIcon icon="fa-xmark" className="text-sm" />
                </button>

                {/* Header Text Overlay */}
                <div className="absolute bottom-3.5 left-4 right-4 z-10">
                  <div className="flex items-center gap-2 mb-1">
                    {showPartnerClinicBadge(c) && <PartnerClinicBadge />}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-slate-900/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      Physiotherapy Clinic
                    </span>
                  </div>
                  <h2 id="clinic-sheet-title" className="text-xl sm:text-2xl font-bold text-white leading-tight drop-shadow-sm line-clamp-1">
                    {c.name}
                  </h2>
                  <p className="text-slate-200 text-xs sm:text-sm mt-0.5 line-clamp-1 flex items-center gap-1.5 opacity-90">
                    <FaIcon icon="fa-location-dot" className="text-emerald-400 shrink-0" />
                    <span>{locationLine(c)}</span>
                  </p>
                </div>
              </div>

              {/* Status & Mini Stats Strip */}
              <div className="shrink-0 px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <ClinicStatusBadge hours={hours} />
                  {doctorCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-slate-700 text-xs font-medium border border-slate-200 shadow-xs">
                      <FaIcon icon="fa-user-doctor" className="text-teal-600 text-xs" />
                      {doctorCount} doctor{doctorCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  <BadgeList badges={c.badges} compact className="!mt-0" />
                </div>
                <ClinicSocialLinks clinic={c} />
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
                {/* Stats Bar */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
                  <ClinicMiniStats clinic={c} hideDoctorCount />
                </div>

                {loading && (
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <FaIcon icon="fa-spinner" className="fa-spin text-emerald-500" />
                    Loading latest schedule…
                  </p>
                )}

                {/* Availability / Closed Banner */}
                {isOfflineOrClosed ? (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200/80 p-3.5 flex items-start gap-3 text-rose-800">
                    <FaIcon icon="fa-circle-exclamation" className="text-rose-600 mt-0.5 shrink-0 text-base" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-rose-900">Clinic Offline / Closed Today</p>
                      <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                        This clinic is currently unavailable for new bookings. Check back during active operating hours or explore open doctors.
                      </p>
                    </div>
                  </div>
                ) : (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <FaIcon icon="fa-calendar-day" className="text-teal-600" />
                      Today&apos;s Availability
                    </h3>
                    <ClinicTodaySlotsRow clinicId={c.id} variant="modal" />
                  </section>
                )}

                {/* Address & Contact */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <FaIcon icon="fa-location-dot" className="text-teal-600" />
                    Address & Contact
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-700 space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                    {c.address && <p className="font-medium text-slate-800 leading-relaxed">{c.address}</p>}
                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/60 text-xs">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} onClick={stopNav} className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1.5">
                          <FaIcon icon="fa-phone" />
                          {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} onClick={stopNav} className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
                          <FaIcon icon="fa-envelope" />
                          {c.email}
                        </a>
                      )}
                    </div>
                  </div>
                </section>

                {/* Opening Hours */}
                {hoursRows.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <FaIcon icon="fa-clock" className="text-teal-600" />
                      Operating Hours
                    </h3>
                    <ul className="rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 text-xs sm:text-sm">
                      {hoursRows.map((row) => (
                        <li
                          key={row.key}
                          className={`flex justify-between gap-2 px-3.5 py-2.5 ${
                            row.key === todayKey ? 'bg-teal-50/80 font-semibold text-teal-900' : 'bg-white'
                          }`}
                        >
                          <span>{row.label}</span>
                          <span className={row.closed ? 'text-slate-400 font-normal' : 'text-slate-700 font-medium'}>
                            {row.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Services & Facilities */}
                {combined.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <FaIcon icon="fa-kit-medical" className="text-teal-600" />
                      Services & Facilities
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {combined.map((item) => (
                        <span
                          key={item}
                          className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100/80"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* About */}
                {c.description?.trim() && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">About Clinic</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{c.description}</p>
                  </section>
                )}

                {/* Doctors List */}
                {doctors.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <FaIcon icon="fa-user-doctor" className="text-teal-600" />
                      Associated Physiotherapists
                    </h3>
                    <ul className="space-y-2">
                      {doctors.slice(0, 5).map((doc) => (
                        <li key={doc.id}>
                          <Link
                            to={doctorProfileUrl(doc)}
                            onClick={(e) => {
                              stopNav(e);
                              onClose();
                            }}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 p-3 hover:border-teal-300 hover:bg-teal-50/40 transition group"
                          >
                            <DoctorAvatar doctor={doc} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-teal-700 truncate">
                                Dr. {doc.first_name} {doc.last_name}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{doc.specialization || 'Physiotherapist'}</p>
                            </div>
                            <FaIcon icon="fa-chevron-right" className="text-xs text-slate-400 group-hover:text-teal-600" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <Link
                  to={clinicProfileUrl(c)}
                  onClick={() => onClose()}
                  className="block text-center text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-800 py-2 border-t border-slate-100"
                >
                  View full clinic profile & reviews →
                </Link>
              </div>

              {/* Fixed Bottom Action Bar — Zero Cut-off */}
              <div className="shrink-0 z-20 border-t border-slate-200/80 bg-white px-4 pt-3 pb-4 sm:pb-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
                <ClinicQuickActions clinic={c} onNavigate={onClose} variant="sheet" />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return sheet;
  return createPortal(sheet, document.body);
}
