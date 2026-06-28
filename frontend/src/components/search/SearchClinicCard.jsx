import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import ClinicLogo from '../ClinicLogo';
import ReviewStars from '../platform/ReviewStars';
import { clinicProfileUrl } from '../../utils/profileUrls';
import { bookClinicUrl } from '../../utils/bookUrl';

export default function SearchClinicCard({ clinic, onTrack }) {
  const track = () => onTrack?.('clinic', String(clinic.id));

  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
      <div className="flex gap-3 sm:gap-4">
        <ClinicLogo clinic={clinic} size="lg" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug">{clinic.name}</h3>
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{clinic.address}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
            {clinic.city_name && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <FaIcon icon="fa-location-dot" />
                {clinic.city_name}
              </span>
            )}
            <ReviewStars rating={Number(clinic.rating_avg) || 0} size="sm" />
            <span>({clinic.rating_count || 0})</span>
            {clinic.distance_km != null && (
              <span className="text-emerald-700 font-semibold">{clinic.distance_km} km away</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
        <Link
          to={bookClinicUrl(clinic.id)}
          onClick={track}
          className="flex-1 min-w-[8rem] text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 rounded-xl transition inline-flex items-center justify-center gap-1.5"
        >
          <FaIcon icon="fa-calendar-check" />
          Book visit
        </Link>
        <Link
          to={clinicProfileUrl(clinic)}
          onClick={track}
          className="flex-1 min-w-[8rem] text-center btn-outline text-sm !py-2.5"
        >
          View clinic
        </Link>
      </div>
    </article>
  );
}
