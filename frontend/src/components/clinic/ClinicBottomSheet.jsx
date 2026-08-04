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
import ClinicStatusBadge from './ClinicStatusBadge';
import ClinicTodaySlotsRow from './ClinicTodaySlotsRow';
import SaveClinicButton from './SaveClinicButton';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { useClinicPreview } from '../../hooks/useClinicPreview';
import { showPartnerClinicBadge } from '../../utils/clinicBadges';
import { clinicProfileUrl, doctorProfileUrl } from '../../utils/profileUrls';
import { bookClinicUrl } from '../../utils/bookUrl';
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
  const logoUrl = resolveMediaUrl(c.logo);

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

  const mapUrl = c.map_url || (c.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name}, ${c.address}`)}` : null);

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

          {/* Container — Desktop Pop-up Modal / Mobile Bottom Sheet */}
          <div className="fixed inset-0 z-[125] flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-none overflow-hidden">
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="clinic-sheet-title"
              className="pointer-events-auto w-full md:max-w-3xl lg:max-w-4xl h-[min(94dvh,780px)] md:h-[min(86dvh,740px)] flex flex-col bg-white rounded-t-[2rem] md:rounded-[2.25rem] shadow-2xl shadow-slate-950/30 border border-slate-200/90 overflow-hidden"
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
              {/* Touch Drag Bar (Mobile Only) */}
              <div
                className="shrink-0 pt-2.5 pb-1 md:hidden cursor-grab active:cursor-grabbing touch-none bg-white"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto" />
              </div>

              {/* Desktop & Mobile Header Banner (Matching Doctor Popup style) */}
              <div className="relative h-40 md:h-48 shrink-0 bg-slate-900 overflow-hidden">
                {cover ? (
                  <ClinicCoverImage src={cover} alt={c.name} variant="sheet" eager />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 flex items-center justify-center text-emerald-200/40">
                    <FaIcon icon="fa-hospital" className="text-6xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />

                {/* Floating Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 shadow-md backdrop-blur-md transition active:scale-95 z-10"
                  aria-label="Close"
                >
                  <FaIcon icon="fa-xmark" className="text-sm" />
                </button>

                {/* Header Information Ring & Title */}
                <div className="absolute bottom-3.5 left-4 right-4 z-10 flex items-end gap-3.5">
                  <div className="shrink-0 ring-2 ring-white/90 shadow-xl rounded-2xl overflow-hidden bg-white w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt={c.name} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                        {c.name ? c.name.charAt(0) : 'C'}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pb-0.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      {showPartnerClinicBadge(c) && <PartnerClinicBadge />}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-slate-900/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
                        Physiotherapy Clinic
                      </span>
                    </div>
                    <h2 id="clinic-sheet-title" className="text-xl md:text-2xl font-bold text-white leading-tight drop-shadow-sm line-clamp-1">
                      {c.name}
                    </h2>
                    <p className="text-slate-200 text-xs md:text-sm mt-0.5 line-clamp-1 flex items-center gap-1.5 opacity-95">
                      <FaIcon icon="fa-location-dot" className="text-emerald-400 shrink-0 text-xs" />
                      <span>{locationLine(c)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Quick Attributes Sub-header */}
              <div className="shrink-0 px-4 md:px-6 py-2.5 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <ClinicStatusBadge hours={hours} />
                  {doctorCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-slate-700 text-xs font-medium border border-slate-200/90 shadow-xs">
                      <FaIcon icon="fa-user-doctor" className="text-teal-600 text-xs" />
                      {doctorCount} doctor{doctorCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  <BadgeList badges={c.badges} compact className="!mt-0" />
                </div>
                <ClinicSocialLinks clinic={c} />
              </div>

              {/* Scrollable Content Body — Optimized 2-Column Desktop Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-6 py-4">
                {loading && (
                  <p className="text-xs text-slate-500 flex items-center gap-2 mb-3">
                    <FaIcon icon="fa-spinner" className="fa-spin text-emerald-500" />
                    Loading latest schedule…
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Left Column (Main Stats, Availability, Doctors, Contact) */}
                  <div className="md:col-span-7 space-y-4">
                    {/* Quick Stats Bar */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
                      <ClinicMiniStats clinic={c} hideDoctorCount />
                    </div>

                    {/* Today's Availability / Offline Alert */}
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

                    {/* Address & Contact Information */}
                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                        <FaIcon icon="fa-location-dot" className="text-teal-600" />
                        Address & Contact
                      </h3>
                      <div className="text-xs md:text-sm text-slate-700 space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                        {c.address && <p className="font-medium text-slate-800 leading-relaxed">{c.address}</p>}
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/60 text-xs">
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
                          {mapUrl && (
                            <a href={mapUrl} target="_blank" rel="noopener noreferrer" onClick={stopNav} className="text-emerald-700 font-semibold flex items-center gap-1.5 ml-auto">
                              <FaIcon icon="fa-diamond-turn-right" />
                              Directions
                            </a>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Associated Physiotherapists */}
                    {doctors.length > 0 && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <FaIcon icon="fa-user-doctor" className="text-teal-600" />
                          Associated Physiotherapists ({doctors.length})
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
                                className="flex items-center gap-3 rounded-2xl border border-slate-200/80 p-2.5 hover:border-teal-300 hover:bg-teal-50/40 transition group"
                              >
                                <DoctorAvatar doctor={doc} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-xs md:text-sm text-slate-900 group-hover:text-teal-700 truncate">
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
                  </div>

                  {/* Right Column (Operating Hours, Services, About) */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Operating Hours */}
                    {hoursRows.length > 0 && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <FaIcon icon="fa-clock" className="text-teal-600" />
                          Operating Hours
                        </h3>
                        <ul className="rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 text-xs">
                          {hoursRows.map((row) => (
                            <li
                              key={row.key}
                              className={`flex justify-between gap-2 px-3 py-2 ${
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

                    {/* About Clinic */}
                    {c.description?.trim() && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <FaIcon icon="fa-circle-info" className="text-teal-600" />
                          About Clinic
                        </h3>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed line-clamp-6">{c.description}</p>
                      </section>
                    )}
                  </div>
                </div>
              </div>

              {/* Fixed Desktop & Mobile Footer Bar (Matching Doctor Popup CTA layout) */}
              <div className="shrink-0 z-20 border-t border-slate-200/90 bg-white px-4 md:px-6 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] flex items-center justify-between gap-3">
                {/* Left: Save Action Button */}
                <div className="flex items-center gap-2">
                  <SaveClinicButton clinic={c} onNavigate={onClose} compact />
                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={stopNav}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition"
                    >
                      <FaIcon icon="fa-diamond-turn-right" className="text-emerald-600" />
                      Directions
                    </a>
                  )}
                </div>

                {/* Center: View Full Profile Link */}
                <Link
                  to={clinicProfileUrl(c)}
                  onClick={() => onClose()}
                  className="text-xs md:text-sm font-semibold text-teal-700 hover:text-teal-800 px-3 py-2 rounded-xl hover:bg-teal-50/60 transition flex items-center gap-1"
                >
                  View full profile →
                </Link>

                {/* Right: Primary Book Appointment CTA */}
                {!isOfflineOrClosed ? (
                  <Link
                    to={bookClinicUrl(c)}
                    onClick={() => onClose()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs md:text-sm shadow-md shadow-teal-900/20 active:scale-95 transition"
                  >
                    <FaIcon icon="fa-calendar-check" className="text-xs" />
                    Book Appointment
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed border border-slate-200"
                  >
                    <FaIcon icon="fa-lock" className="text-xs" />
                    Currently Closed
                  </button>
                )}
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
