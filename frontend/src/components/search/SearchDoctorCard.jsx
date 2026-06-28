import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import DoctorAvatar from '../DoctorAvatar';
import ReviewStars from '../platform/ReviewStars';
import { doctorProfileUrl } from '../../utils/profileUrls';
import { bookDoctorUrl } from '../../utils/bookUrl';

export default function SearchDoctorCard({ doctor, query, onTrack }) {
  const fee = doctor.consultation_fee || doctor.online_fee || doctor.home_visit_fee;
  const track = () => onTrack?.('doctor', String(doctor.id));

  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-300">
      <div className="flex gap-3 sm:gap-4">
        <DoctorAvatar doctor={doctor} size="lg" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug">
              Dr. {doctor.first_name} {doctor.last_name}
            </h3>
            {doctor.is_verified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                <FaIcon icon="fa-circle-check" /> Verified
              </span>
            ) : null}
          </div>
          <p className="text-sm text-primary-700 font-medium mt-0.5">{doctor.specialization || 'Physiotherapist'}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
            {doctor.experience_years > 0 && (
              <span className="inline-flex items-center gap-1">
                <FaIcon icon="fa-briefcase-medical" className="text-slate-400" />
                {doctor.experience_years}+ yrs
              </span>
            )}
            <ReviewStars rating={Number(doctor.rating_avg) || 0} size="sm" />
            <span>({doctor.rating_count || 0})</span>
            {doctor.city_name && (
              <span className="inline-flex items-center gap-1">
                <FaIcon icon="fa-location-dot" className="text-slate-400" />
                {doctor.city_name}
              </span>
            )}
            {doctor.distance_km != null && (
              <span className="text-emerald-700 font-semibold">{doctor.distance_km} km away</span>
            )}
          </div>
          {fee > 0 && (
            <p className="text-sm font-bold text-slate-800 mt-2">From ₹{Number(fee).toLocaleString('en-IN')}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
        <Link
          to={bookDoctorUrl(doctor.id)}
          onClick={track}
          className="flex-1 min-w-[8rem] text-center btn-primary text-sm !py-2.5 inline-flex items-center justify-center gap-1.5"
        >
          <FaIcon icon="fa-calendar-check" />
          Book appointment
        </Link>
        <Link
          to={doctorProfileUrl(doctor)}
          onClick={track}
          className="flex-1 min-w-[8rem] text-center btn-outline text-sm !py-2.5"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
