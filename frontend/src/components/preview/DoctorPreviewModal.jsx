import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import DoctorAvatar from '../DoctorAvatar';
import PreviewModalShell, { PreviewChip, PreviewSection } from './PreviewModalShell';
import { useDoctorPreview } from '../../hooks/useDoctorPreview';
import { bookDoctorUrl } from '../../utils/bookUrl';
import { doctorProfileUrl } from '../../utils/profileUrls';
import { doctorMinFee, formatReviewCount } from '../../utils/doctorProfileUtils';

const SERVICE_META = {
  clinic: { icon: 'fa-hospital', label: 'Clinic visit', feeKey: 'consultation_fee' },
  online: { icon: 'fa-video', label: 'Online', feeKey: 'online_fee' },
  home_visit: { icon: 'fa-house-medical', label: 'Home visit', feeKey: 'home_visit_fee' },
};

const ALL_SERVICES = ['clinic', 'online', 'home_visit'];

function stopNav(e) {
  e.stopPropagation();
}

export default function DoctorPreviewModal({ doctor: initialDoctor, open, onClose }) {
  const { doctor, loading, availableToday, packageFrom } = useDoctorPreview(initialDoctor, open);

  if (!initialDoctor) return null;

  const d = doctor || initialDoctor;
  const rating = Number(d.rating_avg) || 0;
  const reviewCount = Number(d.rating_count) || 0;
  const exp = Number(d.experience_years) || 0;
  const enabled = d.enabled_services?.length ? d.enabled_services : ALL_SERVICES;
  const languages = d.languages_list?.length ? d.languages_list : ['English', 'Hindi'];
  const clinics = d.clinics || [];
  const minFee = doctorMinFee(d, enabled);
  const startingPrice = packageFrom ?? minFee;
  const bio = d.bio?.trim();

  const header = (
    <div className="relative shrink-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/15 via-orange-100/40 to-white pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary-400/10 blur-2xl pointer-events-none" />
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
              <DoctorAvatar doctor={d} size="xl" className="!w-24 !h-24 sm:!w-28 sm:!h-28" />
            </div>
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 mb-1">Physiotherapist</p>
            <h2 id="doctor-preview-title" className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              Dr. {d.first_name} {d.last_name}
            </h2>
            <p className="text-primary-700 font-semibold text-sm mt-1">{d.specialization || 'Physiotherapist'}</p>
            {d.qualifications && (
              <p className="text-slate-600 text-xs sm:text-sm mt-1 line-clamp-2">{d.qualifications}</p>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              {rating > 0 ? (
                <PreviewChip tone="amber">
                  <FaIcon icon="fa-star" className="text-amber-500" />
                  {rating.toFixed(1)}
                  <span className="font-normal opacity-80">({formatReviewCount(reviewCount)})</span>
                </PreviewChip>
              ) : (
                <PreviewChip>New on platform</PreviewChip>
              )}
              {exp > 0 && (
                <PreviewChip tone="sky">
                  <FaIcon icon="fa-briefcase" />
                  {exp}+ years
                </PreviewChip>
              )}
              {d.city_name && (
                <PreviewChip>
                  <FaIcon icon="fa-location-dot" />
                  {d.city_name}
                </PreviewChip>
              )}
              {availableToday === true && (
                <PreviewChip tone="emerald">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available today
                </PreviewChip>
              )}
              {availableToday === false && !loading && (
                <PreviewChip tone="slate">No slots today</PreviewChip>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
      <Link
        to={doctorProfileUrl(d)}
        onClick={(e) => {
          stopNav(e);
          onClose();
        }}
        className="btn-outline w-full sm:flex-1 text-center !py-3 inline-flex items-center justify-center gap-2"
      >
        <FaIcon icon="fa-user" />
        View full profile
      </Link>
      <Link
        to={bookDoctorUrl(d.id)}
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
  );

  return (
    <PreviewModalShell
      open={open}
      onClose={onClose}
      titleId="doctor-preview-title"
      size="lg"
      accent="primary"
      header={header}
      footer={footer}
      panelClassName="max-h-[min(92dvh,820px)]"
    >
      {loading && (
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80">
          <p className="text-xs text-slate-500 inline-flex items-center gap-2">
            <FaIcon icon="fa-spinner" className="fa-spin text-primary-500" />
            Loading profile details…
          </p>
        </div>
      )}

      <PreviewSection title="Consultation fees" icon="fa-indian-rupee-sign">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {ALL_SERVICES.map((type) => {
            const meta = SERVICE_META[type];
            const active = enabled.includes(type);
            const fee = Number(d[meta.feeKey]) || 0;
            return (
              <div
                key={type}
                className={`rounded-xl border p-3 text-center transition ${
                  active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-100 opacity-60'
                }`}
              >
                <FaIcon icon={meta.icon} className={`text-sm mb-1.5 ${active ? 'text-primary-600' : 'text-slate-400'}`} />
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">{meta.label}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {active && fee > 0 ? `₹${fee.toLocaleString('en-IN')}` : '—'}
                </p>
              </div>
            );
          })}
        </div>
        {startingPrice != null && (
          <p className="text-xs text-slate-600 mt-3 flex items-center gap-1.5">
            <FaIcon icon="fa-box-open" className="text-primary-500" />
            Packages from <strong className="text-slate-800">₹{Number(startingPrice).toLocaleString('en-IN')}</strong>
          </p>
        )}
      </PreviewSection>

      {bio && (
        <PreviewSection title="About" icon="fa-user-doctor">
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{bio}</p>
        </PreviewSection>
      )}

      <PreviewSection title="Languages" icon="fa-language">
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <PreviewChip key={lang}>{lang}</PreviewChip>
          ))}
        </div>
      </PreviewSection>

      {clinics.length > 0 && (
        <PreviewSection title="Associated clinics" icon="fa-hospital">
          <ul className="space-y-2">
            {clinics.slice(0, 4).map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-2.5 text-sm text-slate-700 rounded-xl bg-slate-50/90 border border-slate-100 px-3 py-2.5"
              >
                <FaIcon icon="fa-hospital" className="text-emerald-600 mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="font-semibold text-slate-900">{c.name}</span>
                  {c.is_primary ? (
                    <span className="ml-1.5 text-[10px] font-bold uppercase text-primary-600">Primary</span>
                  ) : null}
                  {(c.address || c.city_name) && (
                    <span className="block text-xs text-slate-500 mt-0.5 truncate">
                      {[c.address, c.city_name].filter(Boolean).join(', ')}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {d.distance_km != null && (
        <div className="px-5 sm:px-6 pb-4">
          <PreviewChip tone="sky">
            <FaIcon icon="fa-route" />
            {Number(d.distance_km).toFixed(1)} km from you
          </PreviewChip>
        </div>
      )}
    </PreviewModalShell>
  );
}
