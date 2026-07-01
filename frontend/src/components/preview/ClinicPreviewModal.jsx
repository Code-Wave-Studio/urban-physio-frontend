import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import BadgeList from '../platform/BadgeList';
import PartnerClinicBadge from '../PartnerClinicBadge';
import DoctorAvatar from '../DoctorAvatar';
import SaveClinicButton from '../clinic/SaveClinicButton';
import ClinicMiniStats from '../clinic/ClinicMiniStats';
import ClinicSocialLinks from '../clinic/ClinicSocialLinks';
import ClinicStatusBadge, { ClinicStatusDetail } from '../clinic/ClinicStatusBadge';
import ClinicTodaySlotsRow from '../clinic/ClinicTodaySlotsRow';
import PreviewModalShell, { PreviewChip, PreviewSection } from './PreviewModalShell';
import { useClinicPreview } from '../../hooks/useClinicPreview';
import { showPartnerClinicBadge } from '../../utils/clinicBadges';
import { formatOpeningHoursRows, resolveClinicHours, getTodayDayKey } from '../../utils/clinicProfileUtils';
import { clinicProfileUrl, doctorProfileUrl } from '../../utils/profileUrls';
import { clinicMapsUrl } from '../../utils/locationHelpers';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { bookClinicUrl } from '../../utils/bookUrl';

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
  const mapUrl = clinicMapsUrl(c);

  const header = (
    <div className="relative shrink-0 overflow-hidden bg-white">
      <div className="relative h-28 sm:h-32">
        {cover ? (
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-slate-100 flex items-center justify-center text-emerald-300">
            <FaIcon icon="fa-hospital" className="text-4xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
        <button
          type="button"
          onClick={onClose}
          className="glass-modal-close absolute top-3 right-3 sm:top-4 sm:right-4 z-10"
          aria-label="Close preview"
        >
          <FaIcon icon="fa-xmark" />
        </button>
      </div>

      <div className="px-5 sm:px-6 pt-4 pb-4 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Partner clinic</p>
        <h2 id="clinic-preview-title" className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
          {c.name}
        </h2>
        <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">{locationLine(c)}</p>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {showPartnerClinicBadge(c) && <PartnerClinicBadge />}
          <BadgeList badges={c.badges} compact className="!mt-0" />
          <ClinicStatusBadge hours={hours} />
          {c.distance_km != null && (
            <PreviewChip tone="sky">
              <FaIcon icon="fa-route" />
              {Number(c.distance_km).toFixed(1)} km away
            </PreviewChip>
          )}
        </div>

        <ClinicStatusDetail hours={hours} className="mt-2.5" />
      </div>
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-3 w-full">
      <SaveClinicButton clinic={c} className="w-full" />
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
          View full profile
        </Link>
        <Link
          to={bookClinicUrl(c.id)}
          onClick={(e) => {
            stopNav(e);
            onClose();
          }}
          className="btn-primary w-full sm:flex-1 text-center !py-3 inline-flex items-center justify-center gap-2"
        >
          <FaIcon icon="fa-calendar-check" />
          Book appointment
        </Link>
      </div>
      {(c.phone || mapUrl) && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
          {c.phone && (
            <a href={`tel:${c.phone}`} onClick={stopNav} className="hover:text-emerald-700 inline-flex items-center gap-1.5">
              <FaIcon icon="fa-phone" />
              Call
            </a>
          )}
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={stopNav}
              className="hover:text-emerald-700 inline-flex items-center gap-1.5"
            >
              <FaIcon icon="fa-diamond-turn-right" />
              Directions
            </a>
          )}
        </div>
      )}
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
      bodyClassName="!min-h-[12rem]"
    >
      {loading && (
        <div className="px-5 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/80">
          <p className="text-xs text-slate-500 inline-flex items-center gap-2">
            <FaIcon icon="fa-spinner" className="fa-spin text-emerald-500" />
            Loading clinic details…
          </p>
        </div>
      )}

      <PreviewSection title="Quick stats" icon="fa-chart-simple" className="!pt-3">
        <ClinicMiniStats clinic={c} variant="modal" />
      </PreviewSection>

      <PreviewSection title="Today's availability" icon="fa-calendar-day">
        <ClinicTodaySlotsRow clinicId={c.id} variant="modal" />
      </PreviewSection>

      <PreviewSection title="Address & contact" icon="fa-location-dot">
        <div className="text-sm text-slate-700 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
          <p className="leading-relaxed">{c.address || locationLine(c)}</p>
          <div className="flex flex-wrap gap-3">
            {c.phone && (
              <a href={`tel:${c.phone}`} onClick={stopNav} className="text-emerald-700 font-semibold inline-flex items-center gap-1.5">
                <FaIcon icon="fa-phone" />
                {c.phone}
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} onClick={stopNav} className="text-slate-600 hover:text-emerald-700">
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
                className={`flex justify-between gap-3 px-3 py-2.5 ${
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
          <p className="text-sm text-slate-600 leading-relaxed">{c.description}</p>
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

      <PreviewSection title="Connect" icon="fa-share-nodes" className="!pb-5">
        <ClinicSocialLinks clinic={c} />
      </PreviewSection>
    </PreviewModalShell>
  );
}
