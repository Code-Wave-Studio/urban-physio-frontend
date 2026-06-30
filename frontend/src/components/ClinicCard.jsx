import { useState } from 'react';
import { motion } from 'framer-motion';
import FaIcon from './FaIcon';
import BadgeList from './platform/BadgeList';
import PartnerClinicBadge from './PartnerClinicBadge';
import ClinicBottomSheet from './clinic/ClinicBottomSheet';
import ClinicQuickActions from './clinic/ClinicQuickActions';
import ClinicMiniStats from './clinic/ClinicMiniStats';
import ClinicStatusBadge, { ClinicStatusDetail } from './clinic/ClinicStatusBadge';
import ClinicTodaySlotsRow from './clinic/ClinicTodaySlotsRow';
import { showPartnerClinicBadge } from '../utils/clinicBadges';
import { resolveClinicHours } from '../utils/clinicProfileUtils';
import { resolveMediaUrl } from '../utils/mediaUrl';

function stopNav(e) {
  e.stopPropagation();
}

function clinicPhotoUrl(clinic) {
  return resolveMediaUrl(clinic.cover_image) || resolveMediaUrl(clinic.logo) || null;
}

function locationLine(clinic) {
  const parts = [];
  if (clinic.address) parts.push(clinic.address);
  const cityState = [clinic.city_name, clinic.state_name].filter(Boolean).join(', ');
  if (cityState) parts.push(cityState);
  return parts.join(' · ') || clinic.city_name || 'India';
}

/**
 * Premium clinic card — mobile-first listing with status, slots, and quick actions.
 * @param {{ clinic: object, compact?: boolean, variant?: 'default' | 'listing' }} props
 */
export default function ClinicCard({ clinic, compact = false, variant = 'listing' }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const photo = clinicPhotoUrl(clinic);
  const hours = resolveClinicHours(clinic);
  const useSmall = compact || variant === 'listing' || variant === 'default';

  const openSheet = () => setSheetOpen(true);

  if (!useSmall && variant !== 'listing') {
    return null;
  }

  if (compact) {
    return (
      <>
        <motion.article
          role="button"
          tabIndex={0}
          layout
          whileTap={{ scale: 0.99 }}
          onClick={openSheet}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openSheet()}
          className="rounded-2xl border border-white/80 bg-white/90 backdrop-blur-sm shadow-md shadow-slate-200/50 p-3 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
        >
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-emerald-50">
              {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <FaIcon icon="fa-hospital" className="m-3 text-emerald-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm truncate">{clinic.name}</h3>
              <ClinicStatusBadge hours={hours} className="mt-1" />
            </div>
          </div>
        </motion.article>
        <ClinicBottomSheet clinic={clinic} open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </>
    );
  }

  return (
    <>
      <motion.article
        role="button"
        tabIndex={0}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.995 }}
        transition={{ duration: 0.22 }}
        onClick={openSheet}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openSheet()}
        className="group flex flex-col h-full rounded-[1.25rem] border border-slate-200/70 bg-white/95 backdrop-blur-sm shadow-lg shadow-slate-200/40 overflow-hidden cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 hover:shadow-xl hover:shadow-emerald-900/5 transition-shadow duration-300"
      >
        <div className="relative h-32 sm:h-36 shrink-0 overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt={clinic.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-slate-100 flex items-center justify-center text-emerald-300/90">
              <FaIcon icon="fa-hospital" className="text-4xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/15 to-transparent" />
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
            <ClinicStatusBadge hours={hours} prominent className="!text-white drop-shadow-sm" />
            {clinic.distance_km != null && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-sky-800 text-[10px] font-bold shadow-sm">
                <FaIcon icon="fa-route" className="text-[9px]" />
                {Number(clinic.distance_km).toFixed(1)} km
              </span>
            )}
          </div>
          <div className="absolute bottom-2.5 left-3 right-3">
            <h3 className="font-bold text-base text-white leading-snug line-clamp-2 drop-shadow-sm">{clinic.name}</h3>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {showPartnerClinicBadge(clinic) && <PartnerClinicBadge />}
            <BadgeList badges={clinic.badges} compact className="!mt-0" />
            {Number(clinic.is_featured) ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-800 text-[10px] font-bold border border-violet-100">
                <FaIcon icon="fa-star" className="text-[9px]" />
                Premium
              </span>
            ) : null}
          </div>

          <p className="text-xs text-slate-600 flex items-start gap-1.5 line-clamp-2">
            <FaIcon icon="fa-location-dot" className="text-emerald-500 shrink-0 mt-0.5 text-[10px]" />
            <span>{locationLine(clinic)}</span>
          </p>

          <ClinicMiniStats clinic={clinic} />
          <ClinicStatusDetail hours={hours} />

          <ClinicTodaySlotsRow clinicId={clinic.id} />

          <div className="mt-auto pt-1" onClick={stopNav} onKeyDown={stopNav} role="presentation">
            <ClinicQuickActions clinic={clinic} />
          </div>
        </div>
      </motion.article>

      <ClinicBottomSheet clinic={clinic} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
