import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useRequireAuth } from '../../utils/requireAuth';
import { patients } from '../../services/api';
import { isClinicSaved, toggleSavedClinic } from '../../utils/savedClinics';
import { bookClinicUrl } from '../../utils/bookUrl';
import { clinicProfileUrl } from '../../utils/profileUrls';
import { clinicMapsUrl } from '../../utils/locationHelpers';
import { whatsappChatUrl, whatsappDigits } from '../../utils/whatsapp';

function stopNav(e) {
  e.stopPropagation();
}

function CircleAction({ href, to, onClick, icon, label, accent = 'default', external }) {
  const base =
    'shrink-0 snap-start flex flex-col items-center gap-1 w-[3.25rem] group transition-transform active:scale-95';
  const circle =
    accent === 'primary'
      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 group-hover:bg-emerald-700'
      : accent === 'whatsapp'
        ? 'bg-[#25D366] text-white shadow-md shadow-green-600/20'
        : accent === 'saved'
          ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm'
          : 'bg-white text-slate-700 border border-slate-200/90 shadow-sm group-hover:border-emerald-200 group-hover:bg-emerald-50/50';

  const inner = (
    <>
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${circle}`}
      >
        <FaIcon icon={icon} className="text-sm" brand={icon.includes('whatsapp')} />
      </span>
      <span className="text-[9px] font-semibold text-slate-600 text-center leading-tight max-w-[3.5rem] truncate">
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

function SaveCircleAction({ clinic, onNavigate }) {
  const { user, hasRole } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [saved, setSaved] = useState(() => isClinicSaved(clinic?.id));

  useEffect(() => {
    const sync = () => setSaved(isClinicSaved(clinic?.id));
    sync();
    window.addEventListener('saved-clinics-changed', sync);
    return () => window.removeEventListener('saved-clinics-changed', sync);
  }, [clinic?.id]);

  const toggle = async (e) => {
    stopNav(e);
    if (!requireAuth('Log in to save clinics')) return;
    const { saved: next } = toggleSavedClinic(clinic);
    setSaved(next);
    if (user && hasRole('patient') && clinic?.id) {
      try {
        if (next) await patients.addFavouriteClinic(clinic.id);
        else await patients.removeFavouriteClinic(clinic.id);
      } catch {
        /* local save still works */
      }
    }
    toast.success(next ? 'Clinic saved to your list' : 'Removed from saved clinics', { duration: 2000 });
  };

  return (
    <CircleAction
      icon="fa-heart"
      label={saved ? 'Saved' : 'Save'}
      accent={saved ? 'saved' : 'default'}
      onClick={toggle}
    />
  );
}

/**
 * Circular quick actions: Profile → Book → Call → Directions → WhatsApp → Website → Save → Share
 */
export default function ClinicQuickActions({
  clinic,
  onNavigate,
  className = '',
  bookAccent = true,
  variant = 'card',
}) {
  const mapUrl = clinicMapsUrl(clinic);
  const bookTo = bookClinicUrl(clinic.id);
  const profileTo = clinicProfileUrl(clinic);
  const site = (clinic.website_url || clinic.website || '').trim();
  const websiteHref = site ? (site.startsWith('http') ? site : `https://${site}`) : null;
  const social = clinic.social_links_parsed || clinic.social_links || {};
  const waRaw = social.whatsapp || clinic.phone;
  const waUrl = whatsappDigits(waRaw) ? whatsappChatUrl(waRaw, `Hi, I would like to visit ${clinic.name}.`) : null;

  const share = async (e) => {
    stopNav(e);
    onNavigate?.();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: clinic.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      /* cancelled */
    }
  };

  const wrapNav = (fn) => (e) => {
    stopNav(e);
    onNavigate?.();
    fn?.(e);
  };

  const isProfile = variant === 'profile';

  const actions = (
    <>
      {isProfile ? (
        <>
          <SaveCircleAction clinic={clinic} onNavigate={onNavigate} />
          <CircleAction icon="fa-share-nodes" label="Share" onClick={share} />
          {websiteHref && (
            <CircleAction href={websiteHref} icon="fa-globe" label="Website" external onClick={stopNav} />
          )}
          <CircleAction
            to={bookTo}
            icon="fa-calendar-check"
            label="Book"
            accent={bookAccent ? 'primary' : 'default'}
            onClick={wrapNav()}
          />
          {clinic.phone && (
            <CircleAction
              href={`tel:${clinic.phone}`}
              icon="fa-phone"
              label="Call"
              onClick={stopNav}
            />
          )}
          {mapUrl && (
            <CircleAction href={mapUrl} icon="fa-diamond-turn-right" label="Directions" external onClick={stopNav} />
          )}
          {waUrl && (
            <CircleAction href={waUrl} icon="fa-whatsapp" label="WhatsApp" accent="whatsapp" external onClick={stopNav} />
          )}
        </>
      ) : (
        <>
          <CircleAction
            to={profileTo}
            icon="fa-hospital"
            label="Profile"
            onClick={wrapNav()}
          />
          <CircleAction
            to={bookTo}
            icon="fa-calendar-check"
            label="Book"
            accent={bookAccent ? 'primary' : 'default'}
            onClick={wrapNav()}
          />
          {clinic.phone && (
            <CircleAction
              href={`tel:${clinic.phone}`}
              icon="fa-phone"
              label="Call"
              onClick={stopNav}
            />
          )}
          {mapUrl && (
            <CircleAction href={mapUrl} icon="fa-diamond-turn-right" label="Directions" external onClick={stopNav} />
          )}
          {waUrl && (
            <CircleAction href={waUrl} icon="fa-whatsapp" label="WhatsApp" accent="whatsapp" external onClick={stopNav} />
          )}
          {websiteHref && (
            <CircleAction href={websiteHref} icon="fa-globe" label="Website" external onClick={stopNav} />
          )}
          <SaveCircleAction clinic={clinic} onNavigate={onNavigate} />
          <CircleAction icon="fa-share-nodes" label="Share" onClick={share} />
        </>
      )}
    </>
  );

  return (
    <div
      className={`flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth touch-pan-x max-w-full [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      role="list"
      aria-label="Quick actions"
    >
      {actions}
    </div>
  );
}
