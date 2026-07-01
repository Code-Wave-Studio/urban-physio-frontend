import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import BadgeList from '../platform/BadgeList';
import PartnerClinicBadge from '../PartnerClinicBadge';
import DoctorAvatar from '../DoctorAvatar';
import ClinicQuickActions from '../clinic/ClinicQuickActions';
import ClinicMiniStats from '../clinic/ClinicMiniStats';
import ClinicSocialLinks from '../clinic/ClinicSocialLinks';
import ClinicStatusBadge, { ClinicStatusDetail } from '../clinic/ClinicStatusBadge';
import ClinicTodaySlotsRow from '../clinic/ClinicTodaySlotsRow';
import PreviewModalShell, { PreviewChip, PreviewSection } from './PreviewModalShell';
import { useClinicPreview } from '../../hooks/useClinicPreview';
import { showPartnerClinicBadge } from '../../utils/clinicBadges';
import { formatOpeningHoursRows, resolveClinicHours, getTodayDayKey } from '../../utils/clinicProfileUtils';
import { clinicProfileUrl, doctorProfileUrl } from '../../utils/profileUrls';
import { resolveMediaUrl } from '../../utils/mediaUrl';

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

export default function ClinicPreviewModal({ clinic: initialClinic, open, onClose }) {
  const { clinic, loading } = useClinicPreview(initialClinic, open);

  if (!initialClinic) return null;

  const c = clinic || initialClinic;
  const hours = resolveClinicHours(c);
  const hoursRows = formatOpeningHoursRows(hours).slice(0, 7);
  const todayKey = getTodayDayKey();
  const doctors = c.doctors || [];
  const services = c.services_list?.length ? c.services_list : [];
  const facilities = c.facilities_list?.length ? c.facilities_list : [];
  const combined = [...services, ...facilities].slice(0, 12);
  const cover = clinicCover(c);
  const doctorCount = c.statistics?.doctor_count ?? c.doctor_count ?? doctors.length;

  const header = (
    <div className="relative shrink-0 overflow-hidden">
      <div className="relative h-40 sm:h-44">
        {cover ? (
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-slate-100 flex items-center justify-center text-emerald-300">
            <FaIcon icon="fa-hospital" className="text-5xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
        <button
          type="button"
          onClick={onClose}
          className="glass-modal-close absolute top-4 right-4 sm:top-5 sm:right-5 z-10"
          aria-label="Close preview"
        >
          <FaIcon icon="fa-xmark" />
        </button>
        <div className="absolute bottom-4 left-5 right-14 sm:left-6 sm:right-16">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-0.5">Partner clinic</p>
          <h2 id="clinic-preview-title" className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">
            {c.name}
          </h2>
          <p className="text-white/90 text-xs sm:text-sm mt-1 line-clamp-2">{locationLine(c)}</p>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-white/95 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {showPartnerClinicBadge(c) && <PartnerClinicBadge />}
          <BadgeList badges={c.badges} compact className="!mt-0" />
          <ClinicStatusBadge hours={hours} />
          {doctorCount > 0 && (
            <PreviewChip tone="emerald">
              <FaIcon icon="fa-user-doctor" />
              {doctorCount} doctor{doctorCount !== 1 ? 's' : ''}
            </PreviewChip>
          )}
          {c.distance_km != null && (
            <PreviewChip tone="sky">
              <FaIcon icon="fa-route" />
              {Number(c.distance_km).toFixed(1)} km
            </PreviewChip>
          )}
        </div>
        <ClinicMiniStats clinic={c} hideDoctorCount />
        <ClinicStatusDetail hours={hours} />
        <ClinicSocialLinks clinic={c} />
      </div>
    </div>
  );

  const footer = (
    <div className="w-full">
      <ClinicQuickActions clinic={c} onNavigate={onClose} className="!pb-0" />
      <Link
        to={clinicProfileUrl(c)}
        onClick={() => onClose()}
        className="mt-3 block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      >
        View full clinic profile →
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

      <PreviewSection title="Today's availability" icon="fa-calendar-day">
        <ClinicTodaySlotsRow clinicId={c.id} />
      </PreviewSection>

      <PreviewSection title="Address & contact" icon="fa-location-dot">
        <div className="text-sm text-slate-700 space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
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
      </PreviewSection>

      {hoursRows.length > 0 && (
        <PreviewSection title="Opening hours" icon="fa-clock">
          <ul className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100 text-sm">
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
        </PreviewSection>
      )}

      {combined.length > 0 && (
        <PreviewSection title="Services & facilities" icon="fa-hand-holding-medical">
          <div className="flex flex-wrap gap-1.5">
            {combined.map((item) => (
              <PreviewChip key={item} tone="emerald">
                {item}
              </PreviewChip>
            ))}
          </div>
        </PreviewSection>
      )}

      {c.description?.trim() && (
        <PreviewSection title="About" icon="fa-hospital">
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-5">{c.description}</p>
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
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:border-emerald-200 hover:bg-emerald-50/40 transition"
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
        </PreviewSection>
      )}
    </PreviewModalShell>
  );
}
