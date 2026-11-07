import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import FaIcon from '../FaIcon';
import BadgeList from '../platform/BadgeList';
import PartnerClinicBadge from '../PartnerClinicBadge';
import DoctorAvatar from '../DoctorAvatar';
import ClinicQuickActions from './ClinicQuickActions';
import ClinicSocialLinks from './ClinicSocialLinks';
import ClinicTodaySlotsRow from './ClinicTodaySlotsRow';
import ClinicCoverImage from './ClinicCoverImage';
import { PreviewChip } from '../preview/PreviewModalShell';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { useClinicPreview } from '../../hooks/useClinicPreview';
import { showPartnerClinicBadge } from '../../utils/clinicBadges';
import { clinicProfileUrl, doctorProfileUrl } from '../../utils/profileUrls';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { setFloatingActionsHidden } from '../../utils/floatingActionsBus';
import { clinicMapsUrl } from '../../utils/locationHelpers';
import {
  formatOpeningHoursRows,
  resolveClinicHours,
  getTodayDayKey,
  todayOpenStatus,
} from '../../utils/clinicProfileUtils';

function stopNav(e) {
  e.stopPropagation();
}

function clinicCover(clinic) {
  return resolveMediaUrl(clinic.cover_image) || resolveMediaUrl(clinic.logo) || null;
}

/**
 * Phone clinic preview — same size, layout and styling as the doctor preview sheet
 * (DoctorBottomSheet): 90% height, banner with logo + name, chip row, sections, quick-action bar.
 * Tablet & desktop use ClinicPreviewModal instead.
 */
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
  const isOpenNow = todayOpenStatus(hours, new Date(), Boolean(Number(c.is_closed ?? 0))).open;
  const doctors = c.doctors || [];
  const services = c.services_list?.length ? c.services_list : [];
  const facilities = c.facilities_list?.length ? c.facilities_list : [];
  const combined = [...services, ...facilities].slice(0, 12);
  const cover = clinicCover(c);
  const doctorCount = c.statistics?.doctor_count ?? c.doctor_count ?? doctors.length;
  const logoUrl = resolveMediaUrl(c.logo);
  const rating = Number(c.rating_avg ?? c.statistics?.avg_rating) || 0;
  const reviewCount = Number(c.rating_count ?? c.statistics?.rating_count) || 0;
  const patients = Number(c.statistics?.patients_treated) || 0;
  const about = c.description?.trim();

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

  const mapUrl = clinicMapsUrl(c);

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
            className="fixed inset-x-0 bottom-0 z-[125] flex flex-col h-[min(90dvh,calc(100dvh-5rem))]"
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

              <div className="relative h-36 sm:h-40 shrink-0 overflow-hidden bg-slate-900">
                {cover ? (
                  <ClinicCoverImage src={cover} alt={c.name} variant="sheet" eager />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900" />
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
                <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
                  <div className="shrink-0 ring-2 ring-white/90 shadow-lg rounded-2xl overflow-hidden bg-white w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="" className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <span className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                        {c.name ? c.name.charAt(0) : 'C'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-0.5 flex items-center gap-2">
                      Physiotherapy clinic
                      {showPartnerClinicBadge(c) && <PartnerClinicBadge />}
                    </p>
                    <h2 id="clinic-sheet-title" className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2">
                      {c.name}
                    </h2>
                    <p className="text-white/85 text-xs mt-0.5 line-clamp-1">
                      {[c.city_name, c.state_name].filter(Boolean).join(', ') || 'India'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 px-4 py-3 border-b border-slate-100 space-y-2.5 bg-white/95">
                <div className="flex flex-wrap items-center gap-2">
                  {rating > 0 ? (
                    <PreviewChip tone="amber">
                      <FaIcon icon="fa-star" className="text-amber-500" />
                      {rating.toFixed(1)}
                      <span className="font-normal opacity-80">({reviewCount.toLocaleString('en-IN')})</span>
                    </PreviewChip>
                  ) : (
                    <PreviewChip>New on platform</PreviewChip>
                  )}
                  {doctorCount > 0 && (
                    <PreviewChip tone="sky">
                      <FaIcon icon="fa-user-doctor" />
                      {doctorCount} physio{doctorCount !== 1 ? 's' : ''}
                    </PreviewChip>
                  )}
                  {patients > 0 && (
                    <PreviewChip>
                      <FaIcon icon="fa-users" />
                      {patients.toLocaleString('en-IN')}+ patients
                    </PreviewChip>
                  )}
                  {isOfflineOrClosed || !isOpenNow ? (
                    <PreviewChip tone="slate">Closed now</PreviewChip>
                  ) : (
                    <PreviewChip tone="emerald">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Open now
                    </PreviewChip>
                  )}
                </div>
                {c.badges?.length > 0 && <BadgeList badges={c.badges} compact className="!mt-0" />}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
                {loading && (
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <FaIcon icon="fa-spinner" className="fa-spin text-primary-500" />
                    Loading details…
                  </p>
                )}

                {isOfflineOrClosed ? (
                  <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5 flex items-start gap-2.5 text-rose-800">
                    <FaIcon icon="fa-circle-exclamation" className="text-rose-600 mt-0.5 shrink-0" />
                    <p className="text-xs leading-relaxed">
                      This clinic isn&apos;t taking new bookings right now. Check its hours below or browse other clinics.
                    </p>
                  </div>
                ) : (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                      <FaIcon icon="fa-calendar-day" />
                      Today&apos;s availability
                    </h3>
                    <ClinicTodaySlotsRow clinicId={c.id} variant="modal" />
                  </section>
                )}

                {(c.address || c.phone || c.email) && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                      <FaIcon icon="fa-location-dot" />
                      Address & contact
                    </h3>
                    <div className="rounded-xl bg-slate-50/90 border border-slate-100 px-3 py-2.5 text-sm text-slate-700 space-y-2">
                      {c.address && <p className="leading-relaxed">{c.address}</p>}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                        {c.phone && (
                          <a href={`tel:${c.phone}`} onClick={stopNav} className="text-primary-700 font-semibold flex items-center gap-1.5">
                            <FaIcon icon="fa-phone" />
                            {c.phone}
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} onClick={stopNav} className="text-slate-600 flex items-center gap-1.5 min-w-0">
                            <FaIcon icon="fa-envelope" />
                            <span className="truncate">{c.email}</span>
                          </a>
                        )}
                        {mapUrl && (
                          <a href={mapUrl} target="_blank" rel="noopener noreferrer" onClick={stopNav} className="text-primary-700 font-semibold flex items-center gap-1.5">
                            <FaIcon icon="fa-diamond-turn-right" />
                            Directions
                          </a>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {doctors.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                      <FaIcon icon="fa-user-doctor" />
                      Physiotherapists ({doctors.length})
                    </h3>
                    <ul className="space-y-2">
                      {doctors.slice(0, 4).map((doc) => (
                        <li key={doc.id}>
                          <Link
                            to={doctorProfileUrl(doc)}
                            onClick={(e) => {
                              stopNav(e);
                              onClose();
                            }}
                            className="flex items-center gap-2.5 rounded-xl bg-slate-50/90 border border-slate-100 px-3 py-2.5 active:scale-[0.99] transition"
                          >
                            <DoctorAvatar doctor={doc} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-slate-900 truncate">
                                Dr. {doc.first_name} {doc.last_name}
                              </span>
                              <span className="block text-xs text-slate-500 truncate">{doc.specialization || 'Physiotherapist'}</span>
                            </span>
                            <FaIcon icon="fa-chevron-right" className="text-xs text-slate-400" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {hoursRows.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                      <FaIcon icon="fa-clock" />
                      Opening hours
                    </h3>
                    <ul className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100 text-xs">
                      {hoursRows.map((row) => (
                        <li
                          key={row.key}
                          className={`flex justify-between gap-2 px-3 py-2 ${
                            row.key === todayKey ? 'bg-primary-50/70 font-semibold text-slate-900' : 'bg-slate-50/60 text-slate-700'
                          }`}
                        >
                          <span>{row.label}</span>
                          <span className={row.closed ? 'text-slate-400 font-normal' : 'font-medium'}>{row.text}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {combined.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                      <FaIcon icon="fa-kit-medical" />
                      Services & facilities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {combined.map((item) => (
                        <PreviewChip key={item}>{item}</PreviewChip>
                      ))}
                    </div>
                  </section>
                )}

                {about && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                      <FaIcon icon="fa-circle-info" />
                      About
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-5">{about}</p>
                  </section>
                )}

                <ClinicSocialLinks clinic={c} />

                {c.distance_km != null && (
                  <PreviewChip tone="sky">
                    <FaIcon icon="fa-route" />
                    {Number(c.distance_km).toFixed(1)} km from you
                  </PreviewChip>
                )}

                <Link
                  to={clinicProfileUrl(c)}
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
