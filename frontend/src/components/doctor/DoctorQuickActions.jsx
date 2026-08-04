import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useRequireAuth } from '../../utils/requireAuth';
import { patients } from '../../services/api';
import { isDoctorSaved, toggleSavedDoctor } from '../../utils/savedDoctors';
import { bookDoctorUrl } from '../../utils/bookUrl';
import { doctorProfileUrl } from '../../utils/profileUrls';
import { doctorMapsUrl } from '../../utils/locationHelpers';
import { parseSocialLinksRaw } from '../../utils/clinicProfileUtils';
import { whatsappChatUrl, whatsappDigits } from '../../utils/whatsapp';

function stopNav(e) {
  e.stopPropagation();
}

function CircleAction({ href, to, onClick, icon, label, saved = false, brand = false, external, compact = false }) {
  const base = compact
    ? 'shrink-0 snap-start flex flex-col items-center gap-0.5 w-[3rem] group transition-transform active:scale-95'
    : 'shrink-0 snap-start flex flex-col items-center gap-1 w-[3.25rem] group transition-transform active:scale-95';
  const circle = saved
    ? 'bg-slate-50 text-rose-600 border border-slate-200 shadow-sm group-hover:bg-slate-100'
    : 'bg-white text-slate-600 border border-slate-200 shadow-sm group-hover:bg-slate-50 group-hover:border-slate-300';

  const inner = (
    <>
      <span
        className={`rounded-full flex items-center justify-center transition-all duration-200 ${
          compact ? 'w-10 h-10' : 'w-11 h-11'
        } ${circle}`}
      >
        <FaIcon icon={icon} className={compact ? 'text-xs' : 'text-sm'} brand={brand} />
      </span>
      <span
        className={`font-semibold text-slate-600 text-center leading-tight truncate ${
          compact ? 'text-[8px] max-w-[3rem]' : 'text-[9px] max-w-[3.5rem]'
        }`}
      >
        {label}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={base} aria-label={label}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        onClick={onClick}
        className={base}
        aria-label={label}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={base} aria-label={label}>
      {inner}
    </button>
  );
}

function SaveCircleAction({ doctor, onNavigate, compact = false }) {
  const { user, hasRole } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [saved, setSaved] = useState(() => isDoctorSaved(doctor?.id));

  useEffect(() => {
    const sync = () => setSaved(isDoctorSaved(doctor?.id));
    sync();
    window.addEventListener('saved-doctors-changed', sync);
    return () => window.removeEventListener('saved-doctors-changed', sync);
  }, [doctor?.id]);

  const toggle = async (e) => {
    stopNav(e);
    if (!doctor?.id) return;
    if (!requireAuth('Log in to save doctors')) return;
    const { saved: nowFav } = toggleSavedDoctor(doctor);
    setSaved(nowFav);
    window.dispatchEvent(new CustomEvent('saved-doctors-changed'));

    if (user && hasRole('patient')) {
      try {
        if (nowFav) await patients.addFavouriteDoctor(doctor.id);
        else await patients.removeFavouriteDoctor(doctor.id);
      } catch {
        /* local save still works */
      }
    }

    toast.success(nowFav ? 'Doctor saved' : 'Removed from saved doctors', { duration: 2000 });
  };

  return (
    <CircleAction
      icon="fa-heart"
      label={saved ? 'Saved' : 'Save'}
      saved={saved}
      onClick={toggle}
      compact={compact}
    />
  );
}

/**
 * Circular quick actions — sheet popup: Profile → Book → Directions → … ; cards omit Profile.
 */
export default function DoctorQuickActions({ doctor, onNavigate, variant = 'sheet', className = '' }) {
  if (!doctor) return null;

  const mapUrl = doctorMapsUrl(doctor);
  const bookTo = bookDoctorUrl(doctor.id);
  const profileTo = doctorProfileUrl(doctor);
  const site = (doctor.website_url || doctor.website || '').trim();
  const websiteHref = site ? (site.startsWith('http') ? site : `https://${site}`) : null;
  const social = parseSocialLinksRaw(doctor.social_links_parsed) ?? parseSocialLinksRaw(doctor.social_links) ?? {};
  const waRaw = social.whatsapp || doctor.phone;
  const waUrl = whatsappDigits(waRaw)
    ? whatsappChatUrl(waRaw, `Hi Dr. ${doctor.first_name}, I would like to book an appointment.`)
    : null;
  const fullName = `Dr. ${doctor.first_name} ${doctor.last_name}`;

  const share = async (e) => {
    stopNav(e);
    onNavigate?.();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: fullName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      /* cancelled */
    }
  };

  const wrapNav = () => (e) => {
    stopNav(e);
    onNavigate?.();
  };

  const compact = variant === 'card' || variant === 'sheet';
  const showProfile = variant === 'sheet';

  const isOffline = doctor.is_closed || (doctor.profile_public !== undefined && Number(doctor.profile_public) === 0);

  const actions = (
    <>
      {showProfile && (
        <CircleAction to={profileTo} icon="fa-user-doctor" label="Profile" onClick={wrapNav()} compact={compact} />
      )}
      {!isOffline && (
        <CircleAction to={bookTo} icon="fa-calendar-check" label="Book" onClick={wrapNav()} compact={compact} />
      )}
      {mapUrl && (
        <CircleAction href={mapUrl} icon="fa-diamond-turn-right" label="Directions" external onClick={stopNav} compact={compact} />
      )}
      {doctor.phone && (
        <CircleAction href={`tel:${doctor.phone}`} icon="fa-phone" label="Call" onClick={stopNav} compact={compact} />
      )}
      {waUrl && (
        <CircleAction
          href={waUrl}
          icon="fa-whatsapp"
          label="WhatsApp"
          brand
          external
          onClick={stopNav}
          compact={compact}
        />
      )}
      {websiteHref && (
        <CircleAction href={websiteHref} icon="fa-globe" label="Website" external onClick={stopNav} compact={compact} />
      )}
      <SaveCircleAction doctor={doctor} onNavigate={onNavigate} compact={compact} />
      <CircleAction icon="fa-share-nodes" label="Share" onClick={share} compact={compact} />
    </>
  );

  const gapClass = compact ? 'gap-2 sm:gap-3' : 'gap-3';

  return (
    <div
      className={`scroll-x-touch flex ${gapClass} pb-1 snap-x snap-mandatory scroll-smooth w-full min-w-0 ${className}`}
      role="list"
      aria-label="Quick actions"
    >
      {actions}
    </div>
  );
}
