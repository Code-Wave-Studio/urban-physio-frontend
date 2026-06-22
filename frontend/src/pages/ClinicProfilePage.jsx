import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import ClinicLogo from '../components/ClinicLogo';
import DoctorAvatar from '../components/DoctorAvatar';
import BadgeList from '../components/platform/BadgeList';
import ReviewStars from '../components/platform/ReviewStars';
import PageMeta, { clinicSchema } from '../components/seo/PageMeta';
import ShareProfileButton from '../components/profile/ShareProfileButton';
import { clinics } from '../services/api';
import { resolveMediaUrl } from '../utils/mediaUrl';
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
      className={`rounded-xl sm:rounded-2xl border border-white/90 bg-white/95 backdrop-blur-md shadow-lg shadow-emerald-950/10 h-full ${
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
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    clinics
      .get(slug)
      .then((res) => setClinic(res?.data ?? res))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const canonical = clinic?.canonical_path || (slug ? `/clinic/${slug}` : '');
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}${canonical}` : canonical;
  const jsonLd = useMemo(() => (clinic ? clinicSchema(clinic, canonicalUrl) : null), [clinic, canonicalUrl]);

  const hoursText = formatOpeningHours(clinic?.opening_hours_parsed || clinic?.opening_hours);
  const services = clinic?.services_list?.length ? clinic.services_list : [];
  const facilities = clinic?.facilities_list?.length ? clinic.facilities_list : [];
  const doctorCount = clinic?.doctors?.length ?? clinic?.doctor_count ?? 0;
  const rating = Number(clinic?.rating_avg) || 0;
  const coverSrc = resolveMediaUrl(clinic?.cover_image);

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

  const mapUrl =
    clinic.latitude && clinic.longitude
      ? googleMapsUrl(clinic.latitude, clinic.longitude)
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address || clinic.name)}`;

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

      {/* Hero + stats anchored to banner bottom */}
      <div className="relative overflow-visible bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white pb-12 sm:pb-14 md:pb-16">
        {coverSrc && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{ backgroundImage: `url(${coverSrc})` }}
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-emerald-950/75 to-teal-900/60" aria-hidden />
        <div className="mesh-blob w-72 h-72 -top-20 -right-16 bg-emerald-400/20 hidden md:block" aria-hidden />
        <div className="mesh-blob w-56 h-56 bottom-0 left-0 bg-teal-400/15 hidden md:block" aria-hidden />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 sm:pt-20 pb-6 sm:pb-8 md:pt-24 md:pb-10">
          <Link
            to="/clinics"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-emerald-200/90 hover:text-white transition mb-4 sm:mb-6"
          >
            <FaIcon icon="fa-arrow-left" className="text-xs" />
            All clinics
          </Link>

          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-center md:items-start">
            <div className="shrink-0">
              <ClinicLogo
                clinic={clinic}
                size="xl"
                className="!w-24 !h-24 sm:!w-32 sm:!h-32 md:!w-36 md:!h-36 !rounded-2xl sm:!rounded-3xl ring-4 ring-white/25 shadow-2xl"
              />
            </div>
            <div className="flex-1 min-w-0 w-full text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 px-3 py-1 rounded-full">
                  <FaIcon icon="fa-circle-check" className="text-emerald-300" />
                  Partner clinic
                </span>
                {(clinic.is_featured === 1 || clinic.is_featured === '1') && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide bg-amber-400/20 text-amber-100 border border-amber-300/30 px-3 py-1 rounded-full">
                    <FaIcon icon="fa-star" />
                    Featured
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight px-1">{clinic.name}</h1>

              <p className="text-emerald-100/90 text-xs sm:text-sm md:text-base mt-2 flex items-start justify-center md:justify-start gap-2 max-w-2xl mx-auto md:mx-0 px-1">
                <FaIcon icon="fa-location-dot" className="text-emerald-300 mt-0.5 shrink-0" />
                <span className="text-left line-clamp-3 sm:line-clamp-none">{locationLine || 'India'}</span>
              </p>

              <div className="mt-3 sm:mt-4 flex justify-center md:justify-start">
                <ReviewStars rating={clinic.rating_avg} count={clinic.rating_count} size="lg" />
              </div>
              <div className="mt-2 sm:mt-3 flex justify-center md:justify-start">
                <BadgeList badges={clinic.badges} />
              </div>

              {/* Desktop / tablet hero actions */}
              <div className="mt-4 sm:mt-6 hidden sm:flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
                <Link
                  to={clinicBookUrl(clinic)}
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-900 font-bold px-5 py-3 rounded-xl text-sm shadow-lg shadow-emerald-950/30 hover:bg-emerald-50 transition"
                >
                  <FaIcon icon="fa-calendar-check" />
                  Book clinic visit
                </Link>
                <ShareProfileButton
                  title={clinic.name}
                  className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/15"
                />
                {clinic.phone && (
                  <a
                    href={`tel:${clinic.phone}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-white/25 bg-white/5 hover:bg-white/10 transition"
                  >
                    <FaIcon icon="fa-phone" />
                    Call
                  </a>
                )}
              </div>

              {/* Mobile — share only (book/call in bottom bar) */}
              <div className="mt-4 flex sm:hidden justify-center">
                <ShareProfileButton
                  title={clinic.name}
                  className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/15 !py-2.5 !text-sm w-full max-w-xs justify-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats — horizontal scroll on mobile, grid on desktop */}
        <div className="absolute left-0 right-0 bottom-0 translate-y-1/2 z-[3]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <StatPill
                label="Rating"
                value={rating > 0 ? `${rating.toFixed(1)} / 5` : 'New'}
                icon={rating > 0 ? 'fa-star' : undefined}
                tone={rating > 0 ? 'amber' : 'slate'}
                compact
              />
              <StatPill label="Physios" value={doctorCount || '—'} icon="fa-user-doctor" compact />
              <StatPill label="City" value={clinic.city_name || '—'} icon="fa-location-dot" tone="slate" compact />
              <StatPill label="Care" value="In-person" icon="fa-hospital" compact />
            </div>
            <div className="hidden md:grid md:grid-cols-4 md:gap-3">
              <StatPill
                label="Rating"
                value={rating > 0 ? `${rating.toFixed(1)} / 5` : 'New'}
                icon={rating > 0 ? 'fa-star' : undefined}
                tone={rating > 0 ? 'amber' : 'slate'}
              />
              <StatPill label="Physiotherapists" value={doctorCount || '—'} icon="fa-user-doctor" />
              <StatPill label="City" value={clinic.city_name || '—'} icon="fa-location-dot" tone="slate" />
              <StatPill label="Care type" value="In-person" icon="fa-hospital" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-10 sm:pt-12 md:pt-14 pb-24 sm:pb-8 md:pb-10 space-y-4 sm:space-y-6">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
            <Section title="About this clinic" icon="fa-circle-info">
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {clinic.description ||
                  'A verified Urban Physio partner clinic offering in-person physiotherapy with modern equipment and experienced specialists.'}
              </p>
            </Section>

            {clinic.gallery?.length > 0 && (
              <Section title="Clinic gallery" icon="fa-images">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {clinic.gallery.map((img) => (
                    <div key={img.id} className="group relative overflow-hidden rounded-2xl border border-slate-100 aspect-[4/3]">
                      <img
                        src={resolveMediaUrl(img.image_url) || img.image_url}
                        alt={`${clinic.name} photo`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </Section>
            )}

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
              <Section title="Treatments offered" icon="fa-hand-holding-medical">
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

            {clinic.reviews?.length > 0 && (
              <Section title="Patient reviews" icon="fa-star">
                <div className="space-y-3">
                  {clinic.reviews.map((r) => (
                    <div key={r.id} className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                      <ReviewStars rating={r.rating} />
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{r.comment || 'No comment'}</p>
                      {r.created_at && (
                        <p className="text-xs text-slate-400 mt-2">{r.created_at.slice(0, 10)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
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
              {hoursText && (
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
