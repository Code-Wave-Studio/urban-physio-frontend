import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import ReviewStars from '../platform/ReviewStars';
import BadgeList from '../platform/BadgeList';
import PartnerClinicBadge from '../PartnerClinicBadge';
import DoctorAvatar from '../DoctorAvatar';
import ClinicQuickActions from './ClinicQuickActions';
import { ClinicStatusDetail } from './ClinicStatusBadge';
import ClinicSlotsPreview from './ClinicSlotsPreview';
import ProfileSectionNav, { CLINIC_PROFILE_TABS } from '../profile/ProfileSectionNav';
import ProfileServicesGrid from '../profile/ProfileServicesGrid';
import { showPartnerClinicBadge } from '../../utils/clinicBadges';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { formatOpeningHoursRows } from '../../utils/clinicProfileUtils';
import { clinicBookUrl, clinicProfileUrl, doctorProfileUrl } from '../../utils/profileUrls';
import { HEALTHCARE_IMAGES } from '../../utils/healthcareImages';

function Section({ title, icon, children, id, className = '' }) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-md shadow-slate-200/30 p-4 sm:p-6 scroll-mt-36 ${className}`}
    >
      <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 mb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
          <FaIcon icon={icon} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function formatPatientsTreated(count) {
  if (!count || count <= 0) return '—';
  return `${Number(count).toLocaleString('en-IN')}+`;
}

function filterFacilities(facilities, pattern) {
  return facilities.filter((f) => pattern.test(String(f)));
}

export default function ClinicProfileView({ clinic, mapUrl, websiteUrl }) {
  const hours = clinic.opening_hours_parsed || clinic.opening_hours;
  const hoursRows = formatOpeningHoursRows(hours);
  const profileServices = clinic.profile_services?.length ? clinic.profile_services : [];
  const legacyServices = clinic.services_list?.length ? clinic.services_list : [];
  const facilities = clinic.facilities_list?.length ? clinic.facilities_list : [];
  const equipment = clinic.equipment_list?.length ? clinic.equipment_list : [];
  const stats = clinic.statistics || {};
  const social = clinic.social_links_parsed || {};
  const doctorCount = stats.doctor_count ?? clinic.doctors?.length ?? clinic.doctor_count ?? 0;
  const rating = Number(stats.avg_rating ?? clinic.rating_avg) || 0;
  const locationLine = [clinic.address, clinic.city_name, clinic.state_name].filter(Boolean).join(', ');
  const gallery = clinic.gallery?.length ? clinic.gallery : [];
  const bannerFallback = resolveMediaUrl(clinic.cover_image || clinic.logo) || HEALTHCARE_IMAGES.clinicProfile;

  const insuranceItems = filterFacilities(facilities, /insurance/i);
  const parkingItems = filterFacilities(facilities, /parking/i);
  const paymentItems = filterFacilities(facilities, /payment|upi|card|cash|pay/i);
  const otherFacilities = facilities.filter(
    (f) => !insuranceItems.includes(f) && !parkingItems.includes(f) && !paymentItems.includes(f)
  );

  const statCards = [
    { label: 'Rating', value: rating > 0 ? `${rating.toFixed(1)} / 5` : 'New', icon: 'fa-star' },
    { label: 'Patients', value: formatPatientsTreated(stats.patients_treated), icon: 'fa-users' },
    { label: 'Staff', value: stats.staff_count || '—', icon: 'fa-user-nurse' },
    { label: 'Doctors', value: doctorCount || '—', icon: 'fa-user-doctor' },
    {
      label: 'Experience',
      value: stats.years_experience ? `${stats.years_experience}+ yrs` : stats.satisfaction_rate != null ? `${stats.satisfaction_rate}%` : '—',
      icon: 'fa-award',
    },
  ];

  return (
    <>
      {/* Header — top-left info */}
      <div className="relative bg-gradient-to-b from-emerald-50/80 via-white to-slate-50/50 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 pt-20 sm:pt-24 pb-6">
          <Link
            to="/clinics"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-4 hover:underline"
          >
            <FaIcon icon="fa-arrow-left" />
            All clinics
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {showPartnerClinicBadge(clinic) && <PartnerClinicBadge />}
                <BadgeList badges={clinic.badges} compact className="!mt-0" />
                {(clinic.is_featured === 1 || clinic.is_featured === '1') && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-violet-50 text-violet-800 border border-violet-200 px-2.5 py-1 rounded-full">
                    <FaIcon icon="fa-gem" />
                    Premium
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                {clinic.name}
              </h1>

              <p className="text-slate-600 text-sm sm:text-base mt-2 flex items-start gap-2 max-w-2xl">
                <FaIcon icon="fa-location-dot" className="text-emerald-600 mt-1 shrink-0" />
                <span>{locationLine || 'India'}</span>
              </p>

              <div className="mt-3">
                <ReviewStars rating={clinic.rating_avg} count={clinic.rating_count} size="lg" />
              </div>

              <ClinicStatusDetail hours={hours} className="mt-3" />

              {hoursRows.length > 0 && (
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                  <FaIcon icon="fa-clock" className="text-emerald-600" />
                  Today: {hoursRows.find((r) => r.key === ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()])?.text || '—'}
                </p>
              )}
            </div>

            <div className="hidden lg:block shrink-0 w-full max-w-xs">
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-lg">
                <p className="text-sm font-bold text-slate-900 mb-3">Book your visit</p>
                <ClinicSlotsPreview clinicId={clinic.id} />
                <Link to={clinicBookUrl(clinic)} className="btn-primary w-full text-center mt-3 !bg-emerald-600 hover:!bg-emerald-700">
                  Book now
                </Link>
              </div>
            </div>
          </div>

          {/* Media gallery */}
          <div className="mt-6">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(gallery.length ? gallery : [{ id: 'cover', image_url: bannerFallback }]).map((img, i) => (
                <div
                  key={img.id || i}
                  className="relative shrink-0 w-[78%] sm:w-64 md:w-72 aspect-[16/10] snap-center rounded-2xl overflow-hidden border border-slate-200/80 shadow-md"
                >
                  <img
                    src={resolveMediaUrl(img.image_url) || img.image_url || bannerFallback}
                    alt={`${clinic.name} photo`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <ClinicQuickActions clinic={{ ...clinic, website_url: websiteUrl }} />
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm flex items-center gap-2 min-h-[3rem]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-xs">
                  <FaIcon icon={s.icon} />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase text-slate-400 truncate">{s.label}</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProfileSectionNav tabs={CLINIC_PROFILE_TABS} accent="emerald" />

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-28 lg:pb-10">
        <Section title="Overview" icon="fa-circle-info" id="profile-overview">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">About this clinic</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {clinic.description ||
                  'A verified Urban Physio partner clinic offering in-person physiotherapy with modern equipment and experienced specialists.'}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Contact</h3>
                {clinic.phone && (
                  <a href={`tel:${clinic.phone}`} className="block text-sm font-semibold text-emerald-700 mb-1">
                    {clinic.phone}
                  </a>
                )}
                {clinic.email && (
                  <a href={`mailto:${clinic.email}`} className="block text-sm text-slate-600 break-all">
                    {clinic.email}
                  </a>
                )}
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Opening hours</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  {hoursRows.map((row) => (
                    <li key={row.key} className="flex justify-between gap-2">
                      <span className="font-medium">{row.label}</span>
                      <span>{row.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {clinic.latitude && clinic.longitude && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Location</h3>
                <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video max-h-64">
                  <iframe
                    title="Clinic map"
                    loading="lazy"
                    className="w-full h-full border-0"
                    src={`https://maps.google.com/maps?q=${clinic.latitude},${clinic.longitude}&z=15&output=embed`}
                  />
                </div>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-sm mt-3 inline-flex items-center gap-2"
                >
                  <FaIcon icon="fa-map-location-dot" />
                  Open in Google Maps
                </a>
              </div>
            )}

            {otherFacilities.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Facilities</h3>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {otherFacilities.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                      <FaIcon icon="fa-check" className="text-emerald-600 text-xs" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insuranceItems.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Insurance</h3>
                <div className="flex flex-wrap gap-2">
                  {insuranceItems.map((f) => (
                    <span key={f} className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-medium border border-sky-100">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parkingItems.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Parking</h3>
                <div className="flex flex-wrap gap-2">
                  {parkingItems.map((f) => (
                    <span key={f} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {paymentItems.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Payment methods</h3>
                <div className="flex flex-wrap gap-2">
                  {paymentItems.map((f) => (
                    <span key={f} className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-medium border border-amber-100">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="lg:hidden rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
              <p className="font-bold text-slate-900 text-sm mb-3">Appointment availability</p>
              <ClinicSlotsPreview clinicId={clinic.id} />
            </div>
          </div>
        </Section>

        {(profileServices.length > 0 || legacyServices.length > 0 || equipment.length > 0) && (
          <Section title="Services & treatments" icon="fa-hand-holding-medical" id="profile-services">
            {profileServices.length > 0 ? (
              <ProfileServicesGrid services={profileServices} variant="clinic" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {legacyServices.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-sm font-medium border border-emerald-100">
                    {s}
                  </span>
                ))}
              </div>
            )}
            {equipment.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Equipment & modalities</h3>
                <div className="flex flex-wrap gap-2">
                  {equipment.map((item) => (
                    <span key={item} className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        <Section title="Photos & videos" icon="fa-images" id="profile-media">
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(gallery.length ? gallery : [{ id: 1, image_url: bannerFallback }]).map((img) => (
              <div key={img.id} className="shrink-0 w-[85%] sm:w-80 aspect-video snap-center rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                <img
                  src={resolveMediaUrl(img.image_url) || img.image_url}
                  alt={`${clinic.name}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Reviews" icon="fa-star" id="profile-reviews">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="rounded-2xl bg-amber-50 border border-amber-100 px-6 py-4 text-center min-w-[8rem]">
              <p className="text-3xl font-bold text-amber-900">{rating > 0 ? rating.toFixed(1) : '—'}</p>
              <ReviewStars rating={clinic.rating_avg} count={0} size="md" />
            </div>
            <div>
              <p className="text-slate-700 font-semibold">
                {clinic.rating_count || 0} patient review{(clinic.rating_count || 0) !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Ratings are collected from verified visits at this clinic.
              </p>
            </div>
          </div>
        </Section>

        {clinic.doctors?.length > 0 && (
          <Section title="Our physiotherapists" icon="fa-user-doctor" id="profile-doctors">
            <div className="grid gap-3 sm:grid-cols-2">
              {clinic.doctors.map((d) => (
                <Link
                  key={d.id}
                  to={doctorProfileUrl(d)}
                  className="group flex gap-3 p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-md transition-all"
                >
                  <DoctorAvatar doctor={d} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 group-hover:text-emerald-800">
                      Dr. {d.first_name} {d.last_name}
                    </p>
                    <p className="text-xs text-emerald-700 font-medium">{d.specialization || 'Physiotherapist'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Clinic fee: ₹{Number(d.consultation_fee || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {clinic.related_clinics?.length > 0 && (
          <Section title="Related clinics nearby" icon="fa-hospital">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
              {clinic.related_clinics.map((c) => (
                <Link
                  key={c.id}
                  to={clinicProfileUrl(c)}
                  className="shrink-0 snap-start min-w-[10rem] rounded-2xl border border-slate-100 p-3 hover:border-emerald-200 transition"
                >
                  <p className="font-semibold text-sm text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.city_name}</p>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
        <ClinicQuickActions clinic={{ ...clinic, website_url: websiteUrl }} />
      </div>
    </>
  );
}
