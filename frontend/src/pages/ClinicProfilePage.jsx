import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import ClinicLogo from '../components/ClinicLogo';
import ClinicBannerCarousel from '../components/clinic/ClinicBannerCarousel';
import DoctorAvatar from '../components/DoctorAvatar';
import BadgeList from '../components/platform/BadgeList';
import ReviewStars from '../components/platform/ReviewStars';
import PageMeta, { clinicSchema } from '../components/seo/PageMeta';
import ShareProfileButton from '../components/profile/ShareProfileButton';
import ReviewForm from '../components/platform/ReviewForm';
import { clinics } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { formatOpeningHoursRows, getBannerImages, isValidHttpUrl, SOCIAL_FIELDS, todayOpenStatus } from '../utils/clinicProfileUtils';
import { googleMapsUrl } from '../utils/locationHelpers';
import { clinicBookUrl, clinicProfileUrl, doctorProfileUrl, formatOpeningHours } from '../utils/profileUrls';

function Section({ title, icon, children, accent = 'emerald' }) {
  const iconTone = accent === 'emerald' ? 'text-emerald-600' : 'text-primary-600';
  return (
    <section className="glass-card p-4 sm:p-5 md:p-7 border border-white/60 shadow-sm rounded-2xl">
      <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 mb-3 sm:mb-4">
        <span className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-50 shrink-0 ${iconTone}`}>
          <FaIcon icon={icon} className="text-sm sm:text-base" />
        </span>
        <span className="leading-snug">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function StatPill({ label, value, icon, tone = 'emerald', compact = false }) {
  const valueTone = {
    emerald: 'text-emerald-800',
    amber: 'text-amber-800',
    slate: 'text-slate-800',
  };
  const iconBg = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  return (
    <div
      className={`rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/60 h-full ${
        compact ? 'px-3 py-2.5 min-w-[8.75rem] snap-start shrink-0' : 'px-3 py-2.5 sm:px-4 sm:py-3.5'
      }`}
    >
      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
      <p
        className={`font-bold mt-1 flex items-center gap-1.5 sm:gap-2 ${
          compact ? 'text-sm' : 'text-sm sm:text-lg'
        } ${valueTone[tone] || valueTone.emerald}`}
      >
        {icon && (
          <span
            className={`flex shrink-0 items-center justify-center rounded-lg text-[10px] sm:text-xs ${
              compact ? 'h-6 w-6' : 'h-6 w-6 sm:h-7 sm:w-7'
            } ${iconBg[tone] || iconBg.emerald}`}
          >
            <FaIcon icon={icon} />
          </span>
        )}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

export default function ClinicProfilePage() {
  const { slug } = useParams();
  const { hasRole } = useAuth();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = () => {
    setLoading(true);
    setNotFound(false);
    clinics
      .get(slug)
      .then((res) => setClinic(res?.data ?? res))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [slug]);

  const canonical = clinic?.canonical_path || (slug ? `/clinic/${slug}` : '');
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}${canonical}` : canonical;
  const jsonLd = useMemo(() => (clinic ? clinicSchema(clinic, canonicalUrl) : null), [clinic, canonicalUrl]);

  const hoursText = formatOpeningHours(clinic?.opening_hours_parsed || clinic?.opening_hours);
  const hoursRows = formatOpeningHoursRows(clinic?.opening_hours_parsed || clinic?.opening_hours);
  const todayHours = todayOpenStatus(clinic?.opening_hours_parsed || clinic?.opening_hours);
  const services = clinic?.services_list?.length ? clinic.services_list : [];
  const facilities = clinic?.facilities_list?.length ? clinic.facilities_list : [];
  const equipment = clinic?.equipment_list?.length ? clinic.equipment_list : [];
  const stats = clinic?.statistics || {};
  const social = clinic?.social_links_parsed || {};
  const doctorCount = stats.doctor_count ?? clinic?.doctors?.length ?? clinic?.doctor_count ?? 0;
  const rating = Number(stats.avg_rating ?? clinic?.rating_avg) || 0;
  const bannerImages = useMemo(() => getBannerImages(clinic), [clinic]);
  const websiteUrl = clinic?.website_url || clinic?.website;
  const activeSocials = SOCIAL_FIELDS.filter(({ key }) => isValidHttpUrl(social[key]));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40">
        <div className="animate-spin w-11 h-11 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-500 mt-4 font-medium">Loading clinic profile…</p>
      </div>
    );
  }

  if (notFound || !clinic) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-24">
          <div className="glass-card max-w-md w-full text-center p-8 md:p-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
              <FaIcon icon="fa-hospital" className="text-2xl" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Clinic not found</h1>
            <p className="text-slate-500 text-sm mt-2">This profile may have been removed or the link is incorrect.</p>
            <Link
              to="/clinics"
              className="btn-primary mt-6 inline-flex items-center gap-2 !bg-emerald-600 hover:!bg-emerald-700"
            >
              <FaIcon icon="fa-magnifying-glass" />
              Find clinics
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const mapUrl = (() => {
    const gmaps = clinic.google_maps_url?.trim();
    if (gmaps) return gmaps.startsWith('http') ? gmaps : `https://${gmaps}`;
    if (clinic.latitude && clinic.longitude) return googleMapsUrl(clinic.latitude, clinic.longitude);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address || clinic.name)}`;
  })();

  const locationLine = [clinic.address, clinic.city_name, clinic.state_name].filter(Boolean).join(', ');

  return (
    <>
      <PageMeta
        title={clinic.seo?.title || clinic.name}
        description={clinic.seo?.description}
        canonical={canonical}
        image={clinic.cover_image || clinic.logo}
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* Banner hero — image as background, logo on top */}
      <div className="relative bg-white">
        <div className="relative pt-14 sm:pt-16 md:pt-[4.5rem]">
          <ClinicBannerCarousel
            images={bannerImages}
            className="h-52 sm:h-60 md:h-72 w-full"
            alt={`${clinic.name} banner`}
            showOverlay={false}
          />
          <div className="absolute top-3 left-0 right-0 z-20 max-w-6xl mx-auto px-4">
            <Link
              to="/clinics"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white bg-black/40 backdrop-blur-sm border border-white/20 shadow-sm px-3 py-1.5 rounded-full hover:bg-black/55 transition"
            >
              <FaIcon icon="fa-arrow-left" className="text-xs" />
              All clinics
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-20 max-w-6xl mx-auto px-4 pointer-events-none">
            <div className="flex justify-center md:justify-start translate-y-1/2">
              <ClinicLogo
                clinic={clinic}
                size="xl"
                className="!w-24 !h-24 sm:!w-32 sm:!h-32 md:!w-36 md:!h-36 !rounded-2xl sm:!rounded-3xl ring-4 ring-white shadow-2xl pointer-events-auto"
              />
            </div>
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-10 md:pb-12">
          <div className="text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
                  <FaIcon icon="fa-circle-check" className="text-emerald-600" />
                  Partner clinic
                </span>
                {(clinic.is_featured === 1 || clinic.is_featured === '1') && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                    <FaIcon icon="fa-star" />
                    Featured
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-slate-900 px-1">
                {clinic.name}
              </h1>

              <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-2 flex items-start justify-center md:justify-start gap-2 max-w-2xl mx-auto md:mx-0 px-1">
                <FaIcon icon="fa-location-dot" className="text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-left line-clamp-3 sm:line-clamp-none">{locationLine || 'India'}</span>
              </p>

              <div className="mt-3 sm:mt-4 flex justify-center md:justify-start">
                <ReviewStars rating={clinic.rating_avg} count={clinic.rating_count} size="lg" />
              </div>

              {todayHours?.text && (
                <p
                  className={`mt-3 text-xs sm:text-sm inline-flex items-center gap-2 justify-center md:justify-start font-medium ${
                    todayHours.open ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  <FaIcon
                    icon={todayHours.open ? 'fa-circle-check' : 'fa-clock'}
                    className={todayHours.open ? 'text-emerald-600' : 'text-slate-400'}
                  />
                  {todayHours.text}
                </p>
              )}

              {(websiteUrl || activeSocials.length > 0) && (
                <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                  {websiteUrl && (
                    <a
                      href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200/80"
                    >
                      <FaIcon icon="fa-globe" />
                      Website
                    </a>
                  )}
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

              <div className="mt-2 sm:mt-3 flex justify-center md:justify-start">
                <BadgeList badges={clinic.badges} />
              </div>

              <div className="mt-4 sm:mt-6 hidden sm:flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
                <Link to={clinicBookUrl(clinic)} className="btn-primary text-sm !px-5 !py-3">
                  <FaIcon icon="fa-calendar-check" />
                  Book clinic visit
                </Link>
                <ShareProfileButton title={clinic.name} />
                {clinic.phone && (
                  <a href={`tel:${clinic.phone}`} className="btn-outline text-sm !px-5 !py-3">
                    <FaIcon icon="fa-phone" />
                    Call
                  </a>
                )}
              </div>

              <div className="mt-4 flex sm:hidden justify-center">
                <ShareProfileButton title={clinic.name} className="!py-2.5 !text-sm w-full max-w-xs justify-center" />
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
                label="Patients"
                value={stats.patients_treated > 0 ? stats.patients_treated.toLocaleString('en-IN') : '—'}
                icon="fa-users"
                compact
              />
              <StatPill label="Staff" value={stats.staff_count || doctorCount || '—'} icon="fa-user-doctor" compact />
              <StatPill
                label="Satisfaction"
                value={stats.satisfaction_rate != null ? `${stats.satisfaction_rate}%` : '—'}
                icon="fa-face-smile"
                tone="emerald"
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
                label="Patients treated"
                value={stats.patients_treated > 0 ? stats.patients_treated.toLocaleString('en-IN') : '—'}
                icon="fa-users"
              />
              <StatPill label="Staff" value={stats.staff_count || doctorCount || '—'} icon="fa-user-doctor" />
              <StatPill
                label="Satisfaction"
                value={stats.satisfaction_rate != null ? `${stats.satisfaction_rate}%` : '—'}
                icon="fa-face-smile"
                tone="emerald"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-4 sm:pt-6 pb-24 sm:pb-8 md:pb-10 space-y-4 sm:space-y-6">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
            {clinic.gallery?.length > 0 && (
              <Section title="Clinic photos" icon="fa-images">
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {clinic.gallery.map((img) => (
                    <div
                      key={img.id}
                      className="relative shrink-0 w-[85%] sm:w-72 md:w-80 aspect-[16/10] snap-center rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
                    >
                      <img
                        src={resolveMediaUrl(img.image_url) || img.image_url}
                        alt={`${clinic.name} photo`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="About this clinic" icon="fa-circle-info">
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {clinic.description ||
                  'A verified Urban Physio partner clinic offering in-person physiotherapy with modern equipment and experienced specialists.'}
              </p>
            </Section>

            <Section title="Clinic statistics" icon="fa-chart-simple">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase text-emerald-700/80">Patients treated</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">
                    {stats.patients_treated > 0 ? stats.patients_treated.toLocaleString('en-IN') : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase text-amber-800/80">Average rating</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1 inline-flex items-center justify-center gap-1">
                    {rating > 0 ? (
                      <>
                        <FaIcon icon="fa-star" className="text-sm" />
                        {rating.toFixed(1)}
                      </>
                    ) : (
                      'New'
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Staff</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.staff_count || doctorCount || '—'}</p>
                </div>
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase text-teal-800/80">Satisfaction</p>
                  <p className="text-2xl font-bold text-teal-900 mt-1">
                    {stats.satisfaction_rate != null ? `${stats.satisfaction_rate}%` : '—'}
                  </p>
                </div>
              </div>
            </Section>

            {clinic.doctors?.length > 0 && (
              <Section title="Our physiotherapists" icon="fa-user-doctor">
                <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
                  {clinic.doctors.map((d) => (
                    <Link
                      key={d.id}
                      to={doctorProfileUrl(d)}
                      className="group flex gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-white/60 active:bg-emerald-50/50 sm:hover:border-emerald-200 sm:hover:bg-emerald-50/40 sm:hover:shadow-md transition-all"
                    >
                      <DoctorAvatar doctor={d} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
                          Dr. {d.first_name} {d.last_name}
                        </p>
                        <p className="text-xs text-emerald-700 font-medium mt-0.5">{d.specialization || 'Physiotherapist'}</p>
                        <p className="text-xs text-slate-500 mt-1.5 inline-flex items-center gap-1">
                          <FaIcon icon="fa-indian-rupee-sign" className="text-[10px]" />
                          Clinic fee: ₹{Number(d.consultation_fee || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <FaIcon icon="fa-arrow-right" className="text-slate-300 group-hover:text-emerald-500 self-center text-sm shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {services.length > 0 && (
              <Section title="Treatments & services" icon="fa-hand-holding-medical">
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-sm font-medium border border-emerald-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {equipment.length > 0 && (
              <Section title="Equipment & modalities" icon="fa-stethoscope">
                <div className="flex flex-wrap gap-2">
                  {equipment.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 text-sm font-medium border border-teal-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {facilities.length > 0 && (
              <Section title="Facilities & amenities" icon="fa-wheelchair">
                <ul className="grid sm:grid-cols-2 gap-2.5">
                  {facilities.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600 bg-slate-50/80 rounded-xl px-3 py-2 border border-slate-100">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 text-xs">
                        <FaIcon icon="fa-check" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Patient feedback" icon="fa-star">
              {clinic.reviews?.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {clinic.reviews.map((r) => (
                    <div key={r.id} className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <ReviewStars rating={r.rating} />
                        {r.patient_first_name && (
                          <span className="text-xs font-semibold text-slate-500">{r.patient_first_name}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{r.comment || 'No comment'}</p>
                      {r.created_at && <p className="text-xs text-slate-400 mt-2">{r.created_at.slice(0, 10)}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 mb-4">No patient reviews yet. Be the first to share your experience.</p>
              )}
              {hasRole('patient') && (
                <ReviewForm clinicId={+clinic.id} onSubmitted={load} />
              )}
            </Section>
          </div>

          <aside className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Mobile quick contact — shown before main content */}
            <div className="lg:hidden glass-card p-4 border border-emerald-100/80 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <FaIcon icon="fa-hospital" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm leading-tight truncate">{clinic.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Partner clinic · Book in-clinic visit</p>
                </div>
              </div>
              {clinic.phone && (
                <a
                  href={`tel:${clinic.phone}`}
                  className="mt-3 text-sm text-emerald-700 font-semibold inline-flex items-center gap-2"
                >
                  <FaIcon icon="fa-phone" className="text-xs" />
                  {clinic.phone}
                </a>
              )}
            </div>

            <div className="glass-card p-4 sm:p-5 md:p-6 border border-emerald-100/80 shadow-md lg:sticky lg:top-20 rounded-2xl hidden lg:block">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FaIcon icon="fa-hospital" />
                </span>
                <div>
                  <p className="font-bold text-slate-900 leading-tight">Book at {clinic.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Secure slot · Razorpay</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Choose a physiotherapist and time for your in-clinic visit.
              </p>
              <Link
                to={clinicBookUrl(clinic)}
                className="btn-primary w-full text-center block mb-3 !bg-emerald-600 hover:!bg-emerald-700"
              >
                Book now
              </Link>
              <Link to="/clinics" className="text-sm text-emerald-700 hover:text-emerald-900 font-semibold hover:underline block text-center">
                Compare other clinics
              </Link>
            </div>

            <Section title="Location & contact" icon="fa-map-location-dot">
              {hoursRows?.length > 0 && (
                <div className="mb-4 rounded-xl border border-emerald-100 overflow-hidden">
                  <p className="text-xs font-bold uppercase text-emerald-800 bg-emerald-50 px-3 py-2 border-b border-emerald-100">
                    Opening hours
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {hoursRows.map((row) => (
                      <li key={row.key} className="flex justify-between gap-3 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700">{row.label}</span>
                        <span className={row.closed ? 'text-slate-400' : 'text-slate-600'}>{row.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hoursText && !hoursRows?.length && (
                <div className="flex gap-3 text-sm text-slate-600 mb-4 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/80">
                  <FaIcon icon="fa-clock" className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>{hoursText}</span>
                </div>
              )}
              {clinic.phone && (
                <p className="text-sm text-slate-700 mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-emerald-600">
                    <FaIcon icon="fa-phone" className="text-xs" />
                  </span>
                  <a href={`tel:${clinic.phone}`} className="hover:text-emerald-700 font-medium">
                    {clinic.phone}
                  </a>
                </p>
              )}
              {clinic.email && (
                <p className="text-sm text-slate-700 mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-emerald-600">
                    <FaIcon icon="fa-envelope" className="text-xs" />
                  </span>
                  <a href={`mailto:${clinic.email}`} className="hover:text-emerald-700 break-all">
                    {clinic.email}
                  </a>
                </p>
              )}
              {clinic.latitude && clinic.longitude && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video shadow-inner">
                  <iframe
                    title="Clinic map"
                    loading="lazy"
                    className="w-full h-full border-0"
                    src={`https://maps.google.com/maps?q=${clinic.latitude},${clinic.longitude}&z=15&output=embed`}
                  />
                </div>
              )}
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline w-full text-center mt-3 text-sm inline-flex items-center justify-center gap-2 !border-emerald-200 hover:!bg-emerald-50"
              >
                <FaIcon icon="fa-map-location-dot" />
                Open in Google Maps
              </a>
            </Section>
          </aside>
        </div>

        {clinic.related_clinics?.length > 0 && (
          <Section title="Related clinics nearby" icon="fa-hospital">
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {clinic.related_clinics.map((c) => (
                <Link
                  key={c.id}
                  to={clinicProfileUrl(c)}
                  className="group min-w-[11rem] sm:min-w-0 snap-start rounded-2xl border border-slate-100 bg-white/70 p-4 active:border-emerald-200 sm:hover:border-emerald-200 sm:hover:shadow-lg transition-all shrink-0 sm:shrink"
                >
                  <ClinicLogo clinic={c} size="md" className="mb-3 group-hover:ring-emerald-200 transition" />
                  <p className="font-semibold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">{c.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.city_name}</p>
                  {Number(c.rating_avg) > 0 && (
                    <p className="text-xs text-amber-700 mt-2 inline-flex items-center gap-1">
                      <FaIcon icon="fa-star" />
                      {Number(c.rating_avg).toFixed(1)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
        <div className="max-w-6xl mx-auto flex gap-2">
          {clinic.phone && (
            <a
              href={`tel:${clinic.phone}`}
              className="btn-outline flex-1 !py-3 text-sm inline-flex items-center justify-center gap-1.5 !px-3"
            >
              <FaIcon icon="fa-phone" />
              Call
            </a>
          )}
          <Link
            to={clinicBookUrl(clinic)}
            className={`btn-primary !py-3 text-sm inline-flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-700 ${clinic.phone ? 'flex-[1.6]' : 'flex-1'}`}
          >
            <FaIcon icon="fa-calendar-check" />
            Book visit
          </Link>
        </div>
      </div>

      <Footer />
    </>
  );
}
