import FaIcon from '../FaIcon';

const BANNER_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.09'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/svg%3E\")";

/**
 * Color-only modern banner for public doctor profiles (no photos).
 */
export default function DoctorProfileBanner({ className = '', specialization = '' }) {
  return (
    <div className={`doctor-profile-banner relative overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-primary-600 to-primary-900" />
      <div
        className="absolute inset-0 opacity-40 mix-blend-soft-light"
        style={{ backgroundImage: BANNER_PATTERN }}
      />
      <span className="doctor-profile-banner__orb doctor-profile-banner__orb--warm" />
      <span className="doctor-profile-banner__orb doctor-profile-banner__orb--amber" />
      <span className="doctor-profile-banner__orb doctor-profile-banner__orb--deep" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/25 via-transparent to-white/10 pointer-events-none" />

      <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-3 opacity-[0.14] text-white pointer-events-none">
        <FaIcon icon="fa-heart-pulse" className="text-4xl md:text-5xl" />
        <FaIcon icon="fa-hand-holding-medical" className="text-3xl md:text-4xl ml-6" />
        <FaIcon icon="fa-stethoscope" className="text-4xl md:text-5xl" />
      </div>

      {specialization && (
        <p className="absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-[1] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/35 pointer-events-none max-w-[12rem] text-right truncate">
          {specialization}
        </p>
      )}
    </div>
  );
}
