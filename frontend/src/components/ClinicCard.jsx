import { Link } from 'react-router-dom';
import FaIcon from './FaIcon';
import ClinicLogo from './ClinicLogo';
import BadgeList from './platform/BadgeList';
import SaveClinicButton from './clinic/SaveClinicButton';
import PartnerClinicBadge from './PartnerClinicBadge';
import { showPartnerClinicBadge } from '../utils/clinicBadges';
import { bookClinicUrl } from '../utils/bookUrl';
import { clinicProfileUrl } from '../utils/profileUrls';
import { clinicMapsUrl } from '../utils/locationHelpers';

/**
 * @param {{ clinic: object, compact?: boolean, variant?: 'default' | 'listing' }} props
 */
export default function ClinicCard({ clinic, compact = false, variant = 'default' }) {
  const bookTo = bookClinicUrl(clinic.id);
  const mapUrl = clinicMapsUrl(clinic);
  const rating = Number(clinic.rating_avg) || 0;
  const ratingCount = Number(clinic.rating_count) || 0;
  const doctorCount = Number(clinic.doctor_count) || 0;

  if (compact) {
    return (
      <div className="glass-card p-4 animate-fade-in">
        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/30 to-teal-600/40 rounded-xl flex items-center justify-center text-emerald-800 shrink-0">
            <FaIcon icon="fa-hospital" className="text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-sm truncate">{clinic.name}</h3>
            <p className="text-slate-600 text-xs truncate">{clinic.city_name || 'India'}</p>
            {clinic.distance_km != null && (
              <p className="text-primary-600 text-xs mt-0.5">{Number(clinic.distance_km).toFixed(1)} km away</p>
            )}
          </div>
          <Link to={bookTo} className="btn-primary text-xs py-2 px-3 shrink-0">
            Book
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'listing') {
    return (
      <article className="interactive-card group relative flex flex-col h-full">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="p-5 md:p-6 flex-1 flex flex-col relative">
          <div className="flex gap-4">
            <ClinicLogo clinic={clinic} size="lg" />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
                {clinic.name}
              </h3>
              <p className="text-emerald-700 text-sm font-semibold mt-1 line-clamp-1">
                {clinic.city_name || 'India'}
                {clinic.state_name ? `, ${clinic.state_name}` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
                {clinic.address && (
                  <span className="inline-flex items-center gap-1 line-clamp-1">
                    <FaIcon icon="fa-location-dot" className="text-slate-400 shrink-0" />
                    {clinic.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {showPartnerClinicBadge(clinic) && <PartnerClinicBadge />}
            <BadgeList badges={clinic.badges} compact className="!mt-0" />
            {Number(clinic.is_featured) ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-900 text-xs font-semibold border border-violet-100 shrink-0">
                <FaIcon icon="fa-star" className="text-violet-500" />
                Featured
              </span>
            ) : null}
            {rating > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-100 shrink-0">
                <FaIcon icon="fa-star" className="text-amber-500" />
                {rating.toFixed(1)}
                {ratingCount > 0 && <span className="font-normal text-amber-800/80">({ratingCount})</span>}
              </span>
            ) : null}
            {doctorCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100 shrink-0">
                <FaIcon icon="fa-user-doctor" />
                {doctorCount} doctor{doctorCount !== 1 ? 's' : ''}
              </span>
            )}
            {clinic.distance_km != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 text-xs font-medium border border-sky-100 shrink-0">
                <FaIcon icon="fa-route" />
                {Number(clinic.distance_km).toFixed(1)} km
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-slate-50/90 border border-slate-100 px-1 py-2">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Physiotherapists</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{doctorCount || '—'}</p>
            </div>
            <div className="rounded-xl bg-slate-50/90 border border-slate-100 px-1 py-2">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Rating</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{rating > 0 ? rating.toFixed(1) : 'New'}</p>
            </div>
          </div>

          {clinic.phone && (
            <p className="text-slate-600 text-xs mt-3 inline-flex items-center gap-1.5">
              <FaIcon icon="fa-phone" className="text-slate-400" />
              {clinic.phone}
            </p>
          )}

          <div className="mt-auto pt-5 flex flex-wrap gap-2">
            <Link
              to={clinicProfileUrl(clinic)}
              className="btn-outline flex-1 min-w-[7rem] text-center text-sm !py-2.5 inline-flex items-center justify-center gap-2"
            >
              <FaIcon icon="fa-hospital" className="text-xs btn-icon" />
              Profile
            </Link>
            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} className="btn-outline text-sm !py-2.5 !px-3 inline-flex items-center justify-center gap-1.5">
                <FaIcon icon="fa-phone" />
                Call
              </a>
            )}
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm !py-2.5 !px-3 inline-flex items-center justify-center gap-1.5">
                <FaIcon icon="fa-diamond-turn-right" />
                Map
              </a>
            )}
            <SaveClinicButton clinic={clinic} compact className="!py-2.5" />
            <Link
              to={bookTo}
              className="btn-primary flex-1 min-w-[7rem] text-center text-sm !py-2.5 inline-flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-700"
            >
              <FaIcon icon="fa-calendar-check" className="text-xs btn-icon" />
              Book
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="glass-card p-5 md:p-6 flex flex-col h-full animate-fade-in group hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md">
          <FaIcon icon="fa-hospital" className="text-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-primary-700 transition-colors">
            {clinic.name}
          </h3>
          <p className="text-slate-600 text-sm mt-1 line-clamp-2 flex items-start gap-1">
            <FaIcon icon="fa-location-dot" className="text-slate-400 shrink-0 mt-0.5" />
            <span>
              {clinic.address ? `${clinic.address}, ` : ''}
              {clinic.city_name || 'India'}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {showPartnerClinicBadge(clinic) && <PartnerClinicBadge className="text-xs font-medium" />}
        <BadgeList badges={clinic.badges} compact className="!mt-0" />
        {clinic.distance_km != null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 text-xs font-medium border border-sky-100">
            <FaIcon icon="fa-route" />
            {Number(clinic.distance_km).toFixed(1)} km
          </span>
        )}
      </div>

      {clinic.phone && (
        <p className="text-slate-600 text-sm mt-3 inline-flex items-center gap-1.5">
          <FaIcon icon="fa-phone" className="text-slate-400" />
          {clinic.phone}
        </p>
      )}

      <div className="mt-auto pt-4 flex flex-wrap gap-2">
        <Link to={clinicProfileUrl(clinic)} className="btn-outline flex-1 min-w-[7rem] text-center text-sm py-2.5">
          View clinic
        </Link>
        {clinic.phone && (
          <a href={`tel:${clinic.phone}`} className="btn-outline text-sm py-2.5 px-3 inline-flex items-center justify-center gap-1.5">
            <FaIcon icon="fa-phone" />
            Call
          </a>
        )}
        {mapUrl && (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm py-2.5 px-3 inline-flex items-center justify-center gap-1.5">
            <FaIcon icon="fa-diamond-turn-right" />
            Directions
          </a>
        )}
        <SaveClinicButton clinic={clinic} compact />
        <Link to={bookTo} className="btn-primary flex-1 min-w-[7rem] text-center text-sm py-2.5 inline-flex items-center justify-center gap-2">
          Book clinic visit
          <FaIcon icon="fa-arrow-right" className="text-xs" />
        </Link>
      </div>
    </article>
  );
}
