import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import ClinicLogo from '../ClinicLogo';
import DoctorAvatar from '../DoctorAvatar';
import BadgeList from '../platform/BadgeList';
import PartnerClinicBadge from '../PartnerClinicBadge';
import PreviewModalShell, { PreviewChip, PreviewSection } from './PreviewModalShell';
import { useClinicPreview } from '../../hooks/useClinicPreview';
import { showPartnerClinicBadge } from '../../utils/clinicBadges';
import { todayOpenStatus, formatOpeningHoursRows } from '../../utils/clinicProfileUtils';
import { clinicMapsUrl } from '../../utils/locationHelpers';
import { bookClinicUrl } from '../../utils/bookUrl';
import { clinicProfileUrl, doctorProfileUrl } from '../../utils/profileUrls';

function stopNav(e) {
  e.stopPropagation();
}

export default function ClinicPreviewModal({ clinic: initialClinic, open, onClose }) {
  const { clinic, loading } = useClinicPreview(initialClinic, open);

  if (!initialClinic) return null;

  const c = clinic || initialClinic;
  const rating = Number(c.rating_avg ?? c.statistics?.avg_rating) || 0;
  const ratingCount = Number(c.rating_count ?? c.statistics?.rating_count) || 0;
  const doctors = c.doctors || [];
  const doctorCount = c.statistics?.doctor_count ?? c.doctor_count ?? doctors.length;
  const services = c.services_list?.length ? c.services_list : [];
  const facilities = c.facilities_list?.length ? c.facilities_list : [];
  const combinedServices = [...services, ...facilities].slice(0, 10);
  const hours = c.opening_hours_parsed || c.opening_hours;
  const todayStatus = todayOpenStatus(hours);
  const hoursRows = formatOpeningHoursRows(hours).slice(0, 7);
  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
  const mapUrl = clinicMapsUrl(c);
  const description = c.description?.trim();

  const header = (
    <div className="relative shrink-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-teal-50/50 to-white pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
      <div className="relative px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
        <button
          type="button"
          onClick={onClose}
          className="glass-modal-close absolute top-4 right-4 sm:top-5 sm:right-5 z-10"
          aria-label="Close preview"
        >
          <FaIcon icon="fa-xmark" />
        </button>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 pr-10">
          <div className="shrink-0 mx-auto sm:mx-0">
            <div className="ring-4 ring-white/90 shadow-xl rounded-2xl overflow-hidden">
              <ClinicLogo clinic={c} size="xl" className="!w-24 !h-24 sm:!w-28 sm:!h-28" />
            </div>
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Partner clinic</p>
            <h2 id="clinic-preview-title" className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {c.name}
            </h2>
            <p className="text-emerald-800 font-semibold text-sm mt-1">
              {[c.city_name, c.state_name].filter(Boolean).join(', ') || 'India'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              {showPartnerClinicBadge(c) && <PartnerClinicBadge />}
              <BadgeList badges={c.badges} compact className="!mt-0" />
              {rating > 0 && (
                <PreviewChip tone="amber">
                  <FaIcon icon="fa-star" className="text-amber-500" />
                  {rating.toFixed(1)}
                  {ratingCount > 0 && <span className="font-normal opacity-80">({ratingCount})</span>}
                </PreviewChip>
              )}
              {doctorCount > 0 && (
                <PreviewChip tone="emerald">
                  <FaIcon icon="fa-user-doctor" />
                  {doctorCount} doctor{doctorCount !== 1 ? 's' : ''}
                </PreviewChip>
              )}
              <PreviewChip tone={todayStatus.open ? 'emerald' : 'slate'}>
                <span className={`w-1.5 h-1.5 rounded-full ${todayStatus.open ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {todayStatus.text}
              </PreviewChip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
      <Link
        to={clinicProfileUrl(c)}
        onClick={(e) => {
          stopNav(e);
          onClose();
        }}
        className="btn-outline w-full sm:flex-1 text-center !py-3 inline-flex items-center justify-center gap-2"
      >
        <FaIcon icon="fa-hospital" />
        View clinic profile
      </Link>
      <Link
        to={bookClinicUrl(c.id)}
        onClick={(e) => {
          stopNav(e);
          onClose();
        }}
        className="btn-primary w-full sm:flex-1 text-center !py-3 inline-flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-700 shadow-emerald-600/25"
      >
        <FaIcon icon="fa-calendar-check" />
        Book appointment
      </Link>
    </div>
  );

  return (
    <PreviewModalShell
      open={open}
      onClose={onClose}
      titleId="clinic-preview-title"
      size="lg"
      accent="emerald"
      header={header}
      footer={footer}
      panelClassName="max-h-[min(92dvh,820px)]"
    >
      {loading && (
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80">
          <p className="text-xs text-slate-500 inline-flex items-center gap-2">
            <FaIcon icon="fa-spinner" className="fa-spin text-emerald-500" />
            Loading clinic details…
          </p>
        </div>
      )}

      <PreviewSection title="Address & contact" icon="fa-location-dot">
        <div className="space-y-2 text-sm text-slate-700">
          {c.address && (
            <p className="flex items-start gap-2">
              <FaIcon icon="fa-map-pin" className="text-emerald-600 mt-0.5 shrink-0" />
              <span>
                {c.address}
                {(c.city_name || c.state_name) && (
                  <span className="block text-slate-500 text-xs mt-0.5">
                    {[c.city_name, c.state_name, c.pincode].filter(Boolean).join(', ')}
                  </span>
                )}
              </span>
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            {c.phone && (
              <a href={`tel:${c.phone}`} onClick={stopNav} className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold hover:underline">
                <FaIcon icon="fa-phone" />
                {c.phone}
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} onClick={stopNav} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-700">
                <FaIcon icon="fa-envelope" />
                {c.email}
              </a>
            )}
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stopNav}
                className="inline-flex items-center gap-1.5 text-sky-700 font-medium hover:underline"
              >
                <FaIcon icon="fa-diamond-turn-right" />
                Directions
              </a>
            )}
          </div>
        </div>
      </PreviewSection>

      {hoursRows.length > 0 && (
        <PreviewSection title="Opening hours" icon="fa-clock">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
            {hoursRows.map((row) => (
              <li
                key={row.key}
                className={`flex justify-between gap-2 rounded-lg px-2.5 py-1.5 ${
                  row.key === todayKey ? 'bg-emerald-50 border border-emerald-100 font-medium' : 'text-slate-600'
                }`}
              >
                <span>{row.label}</span>
                <span className="text-right">{row.text}</span>
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {combinedServices.length > 0 && (
        <PreviewSection title="Facilities & services" icon="fa-hand-holding-medical">
          <div className="flex flex-wrap gap-2">
            {combinedServices.map((item) => (
              <PreviewChip key={item} tone="emerald">
                <FaIcon icon="fa-check" className="text-[10px]" />
                {item}
              </PreviewChip>
            ))}
          </div>
        </PreviewSection>
      )}

      {description && (
        <PreviewSection title="About this clinic" icon="fa-circle-info">
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{description}</p>
        </PreviewSection>
      )}

      {doctors.length > 0 && (
        <PreviewSection title="Physiotherapists" icon="fa-user-doctor">
          <ul className="space-y-2">
            {doctors.slice(0, 5).map((doc) => (
              <li key={doc.id}>
                <Link
                  to={doctorProfileUrl(doc)}
                  onClick={(e) => {
                    stopNav(e);
                    onClose();
                  }}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 hover:border-emerald-200 hover:bg-emerald-50/40 transition"
                >
                  <DoctorAvatar doctor={doc} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      Dr. {doc.first_name} {doc.last_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{doc.specialization || 'Physiotherapist'}</p>
                  </div>
                  {doc.rating_avg > 0 && (
                    <span className="text-xs font-semibold text-amber-700 shrink-0">
                      <FaIcon icon="fa-star" className="text-amber-500" />
                      {Number(doc.rating_avg).toFixed(1)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {c.distance_km != null && (
        <div className="px-5 sm:px-6 pb-4">
          <PreviewChip tone="sky">
            <FaIcon icon="fa-route" />
            {Number(c.distance_km).toFixed(1)} km from you
          </PreviewChip>
        </div>
      )}
    </PreviewModalShell>
  );
}
