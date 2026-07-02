import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import DoctorAvatar from '../components/DoctorAvatar';
import ClinicLogo from '../components/ClinicLogo';
import DoctorProfileBanner from '../components/doctor/DoctorProfileBanner';
import DoctorCredentialsSection from '../components/doctor/DoctorCredentialsSection';
import BadgeList from '../components/platform/BadgeList';
import ReviewStars from '../components/platform/ReviewStars';
import PageMeta, { doctorSchema } from '../components/seo/PageMeta';
import ShareProfileButton from '../components/profile/ShareProfileButton';
import SaveDoctorButton from '../components/SaveDoctorButton';
import ProfileSlotsPreview from '../components/profile/ProfileSlotsPreview';
import { doctors, booking } from '../services/api';
import { googleMapsUrl } from '../utils/locationHelpers';
import { doctorMinFee, formatReviewCount } from '../utils/doctorProfileUtils';
import { bookDoctorUrl } from '../utils/bookUrl';
import {
  clinicProfileUrl,
  doctorProfileUrl,
  formatAvailabilitySummary,
} from '../utils/profileUrls';
import { isValidHttpUrl, SOCIAL_FIELDS } from '../utils/clinicProfileUtils';
import ProfileSectionNav from '../components/profile/ProfileSectionNav';
import ProfileServicesGrid from '../components/profile/ProfileServicesGrid';
import TreatmentPackagesBrowser from '../components/packages/TreatmentPackagesBrowser';
import { HEALTHCARE_IMAGES } from '../utils/healthcareImages';
import { resolveMediaUrl } from '../utils/mediaUrl';

const SERVICE_META = {
  clinic: { icon: 'fa-hospital', label: 'Clinic visit', feeKey: 'consultation_fee' },
  online: { icon: 'fa-video', label: 'Online consult', feeKey: 'online_fee' },
  home_visit: { icon: 'fa-house-medical', label: 'Home visit', feeKey: 'home_visit_fee' },
};

const SERVICE_TYPES = ['clinic', 'online', 'home_visit'];

function Section({ title, icon, children, id }) {
  return (
    <section id={id} className="glass-card p-4 sm:p-5 md:p-7 border border-white/60 shadow-sm rounded-2xl scroll-mt-28">
      <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 mb-3 sm:mb-4">
        <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shrink-0">
          <FaIcon icon={icon} className="text-sm sm:text-base" />
        </span>
        <span className="leading-snug">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function StatPill({ label, value, icon, tone = 'primary', compact = false, onClick }) {
  const valueTone = {
    primary: 'text-primary-800',
    amber: 'text-amber-800',
    slate: 'text-slate-800',
  };
  const iconBg = {
    primary: 'bg-primary-50 text-primary-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/60 h-full ${
        compact ? 'px-3 py-2.5 min-w-[8.75rem] snap-start shrink-0' : 'px-3 py-2.5 sm:px-4 sm:py-3.5'
      } ${onClick ? 'cursor-pointer hover:border-primary-300 hover:shadow-lg transition' : ''}`}
    >
      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
      <p
        className={`font-bold mt-1 flex items-center gap-1.5 sm:gap-2 ${
          compact ? 'text-sm' : 'text-sm sm:text-lg'
        } ${valueTone[tone] || valueTone.primary}`}
      >
        {icon && (
          <span
            className={`flex shrink-0 items-center justify-center rounded-lg text-[10px] sm:text-xs ${
              compact ? 'h-6 w-6' : 'h-6 w-6 sm:h-7 sm:w-7'
            } ${iconBg[tone] || iconBg.primary}`}
          >
            <FaIcon icon={icon} />
          </span>
        )}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

export default function DoctorProfilePage() {
  const { slug, id: legacyId } = useParams();
  const profileKey = slug || legacyId;
  const [doctor, setDoctor] = useState(null);
  const [adminPackages, setAdminPackages] = useState([]);
  const [doctorPackages, setDoctorPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = () => {
    setLoading(true);
    setNotFound(false);
    doctors
      .get(profileKey)
      .then((res) => {
        const d = res?.data ?? res;
        setDoctor(d);
        if (d?.id) {
          booking
            .doctorPackages(d.id)
            .then((pkgRes) => {
              const data = pkgRes?.data ?? pkgRes ?? {};
              setAdminPackages(data.admin_packages || []);
              setDoctorPackages(data.doctor_packages || []);
            })
            .catch(() => {
              setAdminPackages([]);
              setDoctorPackages([]);
            });
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [profileKey]);

  const canonical = doctor?.canonical_path || (doctor?.slug ? `/doctor/${doctor.slug}` : legacyId ? `/doctors/${legacyId}` : '');
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}${canonical}` : canonical;
  const jsonLd = useMemo(() => (doctor ? doctorSchema(doctor, canonicalUrl) : null), [doctor, canonicalUrl]);
  const profilePackages = useMemo(
    () => [
      ...adminPackages.map((p) => ({ ...p, package_source: 'admin' })),
      ...doctorPackages.map((p) => ({ ...p, package_source: 'doctor' })),
    ],
    [adminPackages, doctorPackages]
  );

  if (!loading && doctor?.slug && profileKey !== doctor.slug) {
    return <Navigate to={doctorProfileUrl(doctor)} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50/40 to-primary-50/30">
        <div className="animate-spin w-11 h-11 border-4 border-primary-600 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-500 mt-4 font-medium">Loading doctor profile…</p>
      </div>
    );
  }

  if (notFound || !doctor) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-24">
          <div className="glass-card max-w-md w-full text-center p-8 md:p-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 mb-4">
              <FaIcon icon="fa-user-doctor" className="text-2xl" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Doctor not found</h1>
            <p className="text-slate-500 text-sm mt-2">This profile may have been removed or the link is incorrect.</p>
            <Link to="/doctors" className="btn-primary mt-6 inline-flex items-center gap-2">
              <FaIcon icon="fa-magnifying-glass" />
              Find doctors
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const enabled = doctor.enabled_services || [];
  const social = doctor.social_links_parsed || {};
  const activeSocials = SOCIAL_FIELDS.filter(({ key }) => isValidHttpUrl(social[key]));
  const expertise = doctor.expertise_list?.length
    ? doctor.expertise_list
    : [doctor.specialization].filter(Boolean);
  const languages = doctor.languages_list || ['English', 'Hindi'];
  const rating = Number(doctor.rating_avg) || 0;
  const reviewCount = Number(doctor.rating_count) || 0;
  const minFee = doctorMinFee(doctor, enabled);
  const fullName = `Dr. ${doctor.first_name} ${doctor.last_name}`;
  const locationLine = [doctor.address, doctor.city_name, doctor.state_name].filter(Boolean).join(', ');

  const mapUrl = (() => {
    if (doctor.latitude && doctor.longitude) return googleMapsUrl(doctor.latitude, doctor.longitude);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLine || fullName)}`;
  })();

  return (
    <>
      <PageMeta
        title={doctor.seo?.title || fullName}
        description={doctor.seo?.description}
        canonical={canonical}
        image={doctor.avatar}
        ogType="profile"
        jsonLd={jsonLd}
      />
      <Navbar />

      <div className="relative bg-white">
        <div className="relative pt-14 sm:pt-16 md:pt-[4.5rem]">
          <DoctorProfileBanner
            className="h-28 sm:h-32 md:h-36 w-full"
            specialization={doctor.specialization}
          />
          <div className="absolute top-16 sm:top-[4.5rem] md:top-20 left-0 right-0 z-20 max-w-6xl mx-auto px-4">
            <Link
              to="/doctors"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white bg-black/40 backdrop-blur-sm border border-white/20 shadow-sm px-3 py-1.5 rounded-full hover:bg-black/55 transition"
            >
              <FaIcon icon="fa-arrow-left" className="text-xs" />
              All doctors
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-20 max-w-6xl mx-auto px-4 pointer-events-none">
            <div className="flex justify-center md:justify-start translate-y-1/2">
              <DoctorAvatar
                doctor={doctor}
                size="xl"
                className="!w-24 !h-24 sm:!w-32 sm:!h-32 md:!w-36 md:!h-36 !rounded-2xl sm:!rounded-3xl ring-4 ring-white shadow-2xl pointer-events-auto"
              />
            </div>
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-10 md:pb-12">
          <div className="text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide bg-primary-50 text-primary-800 border border-primary-200 px-3 py-1 rounded-full">
                <FaIcon icon="fa-circle-check" className="text-primary-600" />
                Verified physiotherapist
              </span>
              {(doctor.is_featured === 1 || doctor.is_featured === '1') && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                  <FaIcon icon="fa-star" />
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-slate-900 px-1">
              {fullName}
            </h1>

            <p className="text-primary-700 font-semibold text-sm sm:text-base mt-1.5">
              {doctor.specialization || 'Physiotherapist'}
            </p>

            <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-2 flex items-start justify-center md:justify-start gap-2 max-w-2xl mx-auto md:mx-0 px-1">
              <FaIcon icon="fa-location-dot" className="text-primary-600 mt-0.5 shrink-0" />
              <span className="text-left line-clamp-3 sm:line-clamp-none">{locationLine || doctor.city_name || 'India'}</span>
            </p>

            {Number(doctor.experience_years) > 0 && (
              <p className="mt-2 text-xs sm:text-sm text-slate-600 inline-flex items-center gap-1.5 justify-center md:justify-start">
                <FaIcon icon="fa-briefcase" className="text-primary-500" />
                {doctor.experience_years}+ years experience
              </p>
            )}

            <div className="mt-3 sm:mt-4 flex justify-center md:justify-start">
              <ReviewStars
                rating={doctor.rating_avg}
                count={doctor.rating_count}
                size="lg"
              />
            </div>

            <div className="mt-2 sm:mt-3 flex justify-center md:justify-start">
              <BadgeList badges={doctor.badges} />
            </div>

            <div className="mt-4 sm:mt-6 hidden sm:flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
              <Link to={bookDoctorUrl(doctor.id)} className="btn-primary text-sm !px-5 !py-3">
                <FaIcon icon="fa-calendar-check" />
                Book appointment
              </Link>
              {doctor.phone && (
                <a href={`tel:${doctor.phone}`} className="btn-outline text-sm !px-5 !py-3">
                  <FaIcon icon="fa-phone" />
                  Call
                </a>
              )}
              <SaveDoctorButton doctor={doctor} compact />
              <ShareProfileButton title={fullName} />
            </div>

            {activeSocials.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                {activeSocials.map(({ key, icon, brand, label }) => (
                  <a
                    key={key}
                    href={social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200/80"
                    aria-label={label}
                    title={label}
                  >
                    <FaIcon icon={icon} brand={brand} className="text-sm" />
                  </a>
                ))}
              </div>
            )}

            <div className="mt-4 flex sm:hidden justify-center">
              <ShareProfileButton title={fullName} className="!py-2.5 !text-sm w-full max-w-xs justify-center" />
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <StatPill
                label="Rating"
                value={rating > 0 ? `${rating.toFixed(1)} / 5` : 'New'}
                icon={rating > 0 ? 'fa-star' : undefined}
                tone={rating > 0 ? 'amber' : 'slate'}
                compact
              />
              <StatPill
                label="Experience"
                value={Number(doctor.experience_years) > 0 ? `${doctor.experience_years}+ yrs` : '—'}
                icon="fa-briefcase"
                compact
              />
              <StatPill
                label="Reviews"
                value={formatReviewCount(reviewCount)}
                icon="fa-comment-dots"
                compact
              />
              <StatPill
                label="From"
                value={minFee != null ? `₹${minFee.toLocaleString('en-IN')}` : '—'}
                icon="fa-indian-rupee-sign"
                tone="primary"
                compact
              />
            </div>
            <div className="hidden md:grid md:grid-cols-4 md:gap-3">
              <StatPill
                label="Rating"
                value={rating > 0 ? `${rating.toFixed(1)} / 5` : 'New'}
                icon={rating > 0 ? 'fa-star' : undefined}
                tone={rating > 0 ? 'amber' : 'slate'}
              />
              <StatPill
                label="Experience"
                value={Number(doctor.experience_years) > 0 ? `${doctor.experience_years}+ years` : '—'}
                icon="fa-briefcase"
              />
              <StatPill
                label="Patient reviews"
                value={formatReviewCount(reviewCount)}
                icon="fa-comment-dots"
              />
              <StatPill
                label="Starting fee"
                value={minFee != null ? `₹${minFee.toLocaleString('en-IN')}` : 'On request'}
                icon="fa-indian-rupee-sign"
                tone="primary"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-4 sm:pt-6 pb-24 sm:pb-8 md:pb-10 space-y-4 sm:space-y-6">
        <div id="profile-services" className="scroll-mt-28 space-y-4 sm:space-y-6">
        <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
          {SERVICE_TYPES.map((type) => {
            const meta = SERVICE_META[type];
            const active = enabled.includes(type);
            const fee = doctor[meta.feeKey];
            const bookLink = active ? bookDoctorUrl(doctor.id, { type }) : null;
            const inner = (
              <>
                <FaIcon icon={meta.icon} className={`text-xl mb-2 ${active ? 'text-primary-600' : 'text-slate-400'}`} />
                <p className="font-semibold text-slate-900">{meta.label}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {active ? `₹${Number(fee || 0).toLocaleString('en-IN')}` : 'Not available'}
                </p>
                {active && (
                  <p className="text-xs font-semibold text-primary-700 mt-3 inline-flex items-center gap-1">
                    Book now <FaIcon icon="fa-arrow-right" className="text-[10px]" />
                  </p>
                )}
              </>
            );
            return bookLink ? (
              <Link
                key={type}
                to={bookLink}
                className="rounded-2xl border p-4 bg-white border-primary-200 shadow-md hover:shadow-lg hover:border-primary-400 hover:-translate-y-0.5 transition-all block"
              >
                {inner}
              </Link>
            ) : (
              <div key={type} className="rounded-2xl border p-4 bg-slate-50 border-slate-200 opacity-60">
                {inner}
              </div>
            );
          })}
        </div>

        <ProfileSectionNav accent="primary" />

        {profilePackages.length > 0 && (
          <Section title="Treatment packages" icon="fa-box-open" id="profile-packages">
            <TreatmentPackagesBrowser
              packages={profilePackages}
              getBookUrl={(pkg) =>
                bookDoctorUrl(doctor.id, {
                  type: pkg.consultation_type !== 'any' ? pkg.consultation_type : undefined,
                  ...(pkg.package_source === 'admin'
                    ? { treatmentPackageId: pkg.id }
                    : { packageId: pkg.id }),
                })
              }
            />
          </Section>
        )}

        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
            <Section title="About the doctor" icon="fa-user-doctor" id="profile-overview">
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {doctor.bio ||
                  'Experienced physiotherapist dedicated to helping patients recover faster with evidence-based care.'}
              </p>
              <div className="mt-5">
                <DoctorCredentialsSection doctor={doctor} />
              </div>
              <p className="mt-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Languages: </span>
                {languages.join(', ')}
              </p>
              {doctor.license_number && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">License: </span>
                  {doctor.license_number}
                </p>
              )}
            </Section>

            <Section title="Appointment availability" icon="fa-calendar-check">
              <p className="text-sm text-slate-600 mb-3">{formatAvailabilitySummary(doctor.availability)}</p>
              <ProfileSlotsPreview doctorId={doctor.id} />
            </Section>

            <Section title="Expertise & treatment areas" icon="fa-hand-holding-medical">
              <div className="flex flex-wrap gap-2">
                {expertise.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-800 text-sm font-medium border border-primary-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Section>

            {doctor.profile_services?.length > 0 && (
              <Section title="Services & treatments" icon="fa-spa">
                <ProfileServicesGrid services={doctor.profile_services} variant="doctor" />
              </Section>
            )}

            {doctor.clinics?.length > 0 && (
              <Section title="Available clinics" icon="fa-hospital">
                <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
                  {doctor.clinics.map((cl) => (
                    <Link
                      key={cl.id}
                      to={clinicProfileUrl(cl)}
                      className="group flex gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-white/60 active:bg-primary-50/50 sm:hover:border-primary-200 sm:hover:bg-primary-50/40 sm:hover:shadow-md transition-all"
                    >
                      <ClinicLogo clinic={cl} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm group-hover:text-primary-800 transition-colors">
                          {cl.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{cl.address}</p>
                        {cl.city_name && (
                          <p className="text-xs text-primary-700 font-medium mt-1">{cl.city_name}</p>
                        )}
                      </div>
                      <FaIcon icon="fa-arrow-right" className="text-slate-300 group-hover:text-primary-500 self-center text-sm shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Photos & videos" icon="fa-images" id="profile-media">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-2xl overflow-hidden border border-slate-100 aspect-[4/3]">
                  <img
                    src={resolveMediaUrl(doctor.avatar) || HEALTHCARE_IMAGES.doctorProfile}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-100 aspect-[4/3]">
                  <img
                    src={HEALTHCARE_IMAGES.rehab}
                    alt="Physiotherapy session"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </Section>
          </div>

          <aside className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <div className="lg:hidden glass-card p-4 border border-primary-100/80 rounded-2xl">
              <div className="flex items-center gap-3">
                <DoctorAvatar doctor={doctor} size="md" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm leading-tight truncate">{fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{doctor.specialization || 'Physiotherapist'}</p>
                </div>
              </div>
              {doctor.phone && (
                <a
                  href={`tel:${doctor.phone}`}
                  className="mt-3 text-sm text-primary-700 font-semibold inline-flex items-center gap-2"
                >
                  <FaIcon icon="fa-phone" className="text-xs" />
                  {doctor.phone}
                </a>
              )}
            </div>

            <div className="glass-card p-4 sm:p-5 md:p-6 border border-primary-100/80 shadow-md lg:sticky lg:top-20 rounded-2xl hidden lg:block">
              <div className="flex items-center gap-3 mb-4">
                <DoctorAvatar doctor={doctor} size="md" className="shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 leading-tight">Book with {doctor.first_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Online · Home · Clinic</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">Secure booking with Razorpay — pick a slot that works for you.</p>
              <ProfileSlotsPreview doctorId={doctor.id} />
              <Link to={bookDoctorUrl(doctor.id)} className="btn-primary w-full text-center block mt-4 mb-3">
                Book now
              </Link>
              <Link to="/doctors" className="text-sm text-primary-700 hover:text-primary-900 font-semibold hover:underline block text-center">
                Compare other doctors
              </Link>
            </div>

            {(locationLine || doctor.phone) && (
              <Section title="Location & contact" icon="fa-map-location-dot">
                {doctor.phone && (
                  <p className="text-sm text-slate-700 mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-primary-600">
                      <FaIcon icon="fa-phone" className="text-xs" />
                    </span>
                    <a href={`tel:${doctor.phone}`} className="hover:text-primary-700 font-medium">
                      {doctor.phone}
                    </a>
                  </p>
                )}
                {locationLine && (
                  <p className="text-sm text-slate-600 mb-4 flex items-start gap-2">
                    <FaIcon icon="fa-location-dot" className="text-primary-600 mt-0.5 shrink-0" />
                    <span>{locationLine}</span>
                  </p>
                )}
                {doctor.latitude && doctor.longitude && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video shadow-inner">
                    <iframe
                      title="Doctor location map"
                      loading="lazy"
                      className="w-full h-full border-0"
                      src={`https://maps.google.com/maps?q=${doctor.latitude},${doctor.longitude}&z=15&output=embed`}
                    />
                  </div>
                )}
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full text-center mt-3 text-sm inline-flex items-center justify-center gap-2 !border-primary-200 hover:!bg-primary-50"
                >
                  <FaIcon icon="fa-map-location-dot" />
                  Open in Google Maps
                </a>
              </Section>
            )}
          </aside>
        </div>

        {doctor.related_doctors?.length > 0 && (
          <Section title="Related doctors nearby" icon="fa-users">
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {doctor.related_doctors.map((d) => (
                <Link
                  key={d.id}
                  to={doctorProfileUrl(d)}
                  className="group min-w-[11rem] sm:min-w-0 snap-start rounded-2xl border border-slate-100 bg-white/70 p-4 active:border-primary-200 sm:hover:border-primary-200 sm:hover:shadow-lg transition-all shrink-0 sm:shrink"
                >
                  <DoctorAvatar doctor={d} size="md" className="mb-3 group-hover:ring-primary-200 transition" />
                  <p className="font-semibold text-slate-900 text-sm group-hover:text-primary-800 transition-colors">
                    Dr. {d.first_name} {d.last_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{d.specialization}</p>
                  {Number(d.rating_avg) > 0 && (
                    <p className="text-xs text-amber-700 mt-2 inline-flex items-center gap-1">
                      <FaIcon icon="fa-star" />
                      {Number(d.rating_avg).toFixed(1)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
        <div className="max-w-6xl mx-auto flex gap-2">
          {doctor.phone && (
            <a
              href={`tel:${doctor.phone}`}
              className="btn-outline flex-1 !py-3 text-sm inline-flex items-center justify-center gap-1.5 !px-3"
            >
              <FaIcon icon="fa-phone" />
              Call
            </a>
          )}
          <Link
            to={bookDoctorUrl(doctor.id)}
            className={`btn-primary !py-3 text-sm inline-flex items-center justify-center gap-2 ${doctor.phone ? 'flex-[1.6]' : 'flex-1'}`}
          >
            <FaIcon icon="fa-calendar-check" />
            Book now
          </Link>
        </div>
      </div>

      <Footer />
    </>
  );
}
