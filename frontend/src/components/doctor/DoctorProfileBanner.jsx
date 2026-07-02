import FaIcon from '../FaIcon';

const GRID_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 .5H39.5V40' fill='none' stroke='%23ffffff' stroke-opacity='0.06'/%3E%3C/svg%3E\")";

/**
 * Modern color-only banner for public doctor profiles (no photos).
 */
export default function DoctorProfileBanner({ className = '', specialization = '' }) {
  return (
    <div className={`doctor-profile-banner relative overflow-hidden ${className}`} aria-hidden>
      {/* base gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary-800 via-primary-600 to-orange-500" />
      {/* soft radial glow, top-left */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 140% at 0% 0%, rgba(255,255,255,0.22), transparent 45%)' }}
      />
      {/* fine grid mesh */}
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: GRID_PATTERN }} />

      {/* depth orbs */}
      <span className="doctor-profile-banner__orb doctor-profile-banner__orb--warm" />
      <span className="doctor-profile-banner__orb doctor-profile-banner__orb--amber" />
      <span className="doctor-profile-banner__orb doctor-profile-banner__orb--deep" />

      {/* subtle bottom fade so avatar + content sit cleanly */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary-950/30 to-transparent pointer-events-none" />

      {/* single refined medical motif, right side */}
      <FaIcon
        icon="fa-heart-pulse"
        className="absolute right-5 sm:right-10 top-1/2 -translate-y-1/2 text-white/10 text-6xl sm:text-8xl md:text-9xl pointer-events-none"
      />

      {specialization && (
        <p className="absolute bottom-3 right-4 sm:bottom-4 sm:right-8 z-[1] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white/40 pointer-events-none max-w-[12rem] text-right truncate">
          {specialization}
        </p>
      )}
    </div>
  );
}
