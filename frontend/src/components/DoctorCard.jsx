import { useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from './FaIcon';
import DoctorAvatar from './DoctorAvatar';
import DoctorPreviewModal from './preview/DoctorPreviewModal';
import { bookDoctorUrl } from '../utils/bookUrl';
import { doctorProfileUrl } from '../utils/profileUrls';

function stopNav(e) {
  e.stopPropagation();
}

/**
 * @param {{ doctor: object, compact?: boolean, variant?: 'default' | 'listing' }} props
 */
export default function DoctorCard({ doctor, compact = false, variant = 'default' }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const rating = Number(doctor.rating_avg) || 0;
  const count = Number(doctor.rating_count) || 0;
  const exp = Number(doctor.experience_years) || 0;

  const openPreview = () => setPreviewOpen(true);

  if (compact) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={openPreview}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPreview()}
          className="premium-preview-card premium-preview-card--doctor p-4 animate-fade-in cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
        >
          <div className="flex gap-3 items-center">
            <DoctorAvatar doctor={doctor} size="md" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm truncate">
                Dr. {doctor.first_name} {doctor.last_name}
              </h3>
              <p className="text-primary-600 text-xs truncate">{doctor.specialization}</p>
              <p className="text-slate-600 text-xs font-medium mt-0.5">₹{doctor.consultation_fee}</p>
            </div>
            <Link to={bookDoctorUrl(doctor.id)} onClick={stopNav} className="btn-primary text-xs py-2 px-3 shrink-0">
              Book
            </Link>
          </div>
        </div>
        <DoctorPreviewModal doctor={doctor} open={previewOpen} onClose={() => setPreviewOpen(false)} />
      </>
    );
  }

  if (variant === 'listing') {
    return (
      <>
        <article
          role="button"
          tabIndex={0}
          onClick={openPreview}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPreview()}
          className="premium-preview-card premium-preview-card--doctor interactive-card group relative flex flex-col h-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-400/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="p-5 md:p-6 flex-1 flex flex-col relative">
            <div className="flex gap-4">
              <DoctorAvatar doctor={doctor} size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-primary-700 transition-colors">
                  Dr. {doctor.first_name} {doctor.last_name}
                </h3>
                <p className="text-primary-600 text-sm font-semibold mt-1 line-clamp-2">{doctor.specialization || 'Physiotherapist'}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <FaIcon icon="fa-location-dot" className="text-slate-400" />
                    {doctor.city_name || 'India'}
                  </span>
                  {exp > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <FaIcon icon="fa-briefcase" className="text-slate-400" />
                      {exp}+ yrs
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {rating > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-100">
                  <FaIcon icon="fa-star" className="text-amber-500" />
                  {rating.toFixed(1)}
                  {count > 0 && <span className="font-normal text-amber-800/80">({count})</span>}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                  New on platform
                </span>
              )}
              {doctor.distance_km != null && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 text-xs font-medium border border-sky-100">
                  <FaIcon icon="fa-route" />
                  {Number(doctor.distance_km).toFixed(1)} km
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50/90 border border-slate-100 px-1 py-2">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Clinic</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">₹{Number(doctor.consultation_fee || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-xl bg-slate-50/90 border border-slate-100 px-1 py-2">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Online</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">₹{Number(doctor.online_fee || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-xl bg-slate-50/90 border border-slate-100 px-1 py-2">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Home</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">₹{Number(doctor.home_visit_fee || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="mt-auto pt-5 flex flex-wrap gap-2">
              <Link
                to={doctorProfileUrl(doctor)}
                onClick={stopNav}
                className="btn-outline flex-1 min-w-[6rem] text-center text-sm !py-2.5 inline-flex items-center justify-center gap-2"
              >
                <FaIcon icon="fa-user" className="text-xs btn-icon" />
                Profile
              </Link>

              <Link
                to={bookDoctorUrl(doctor.id)}
                onClick={stopNav}
                className="btn-primary flex-1 min-w-[6rem] text-center text-sm !py-2.5 inline-flex items-center justify-center gap-2"
              >
                <FaIcon icon="fa-calendar-check" className="text-xs btn-icon" />
                Book
              </Link>
            </div>
          </div>
        </article>
        <DoctorPreviewModal doctor={doctor} open={previewOpen} onClose={() => setPreviewOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={openPreview}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPreview()}
        className="premium-preview-card premium-preview-card--doctor p-5 animate-fade-in group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
      >
        <div className="flex gap-4">
          <DoctorAvatar doctor={doctor} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg text-slate-800 group-hover:text-primary-700 transition">
              Dr. {doctor.first_name} {doctor.last_name}
            </h3>
            <p className="text-primary-600 text-xs md:text-sm font-medium">{doctor.specialization}</p>
            <p className="text-slate-500 text-xs mt-0.5">{doctor.city_name || 'India'}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
              <span className="badge bg-amber-100/80 text-amber-800 border border-amber-200/50 inline-flex items-center gap-1">
                <FaIcon icon="fa-star" className="text-[10px]" />
                {doctor.rating_avg || 'New'}
              </span>
              {doctor.distance_km && <span className="text-slate-500">{doctor.distance_km} km</span>}
              <span className="font-medium text-slate-700">₹{doctor.consultation_fee}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 md:mt-4 flex gap-2">
          <Link to={bookDoctorUrl(doctor.id)} onClick={stopNav} className="btn-primary flex-1 text-center block text-sm">
            Book Appointment
          </Link>
        </div>
      </div>
      <DoctorPreviewModal doctor={doctor} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </>
  );
}
