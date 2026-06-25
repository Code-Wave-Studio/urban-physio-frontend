import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import ShareProfileButton from '../profile/ShareProfileButton';
import SaveClinicButton from './SaveClinicButton';
import { clinicBookUrl } from '../../utils/profileUrls';

function scrollToReviews() {
  const el = document.getElementById('patient-reviews');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * @param {{ clinic: object, mapUrl?: string, websiteUrl?: string, className?: string }} props
 */
export default function ClinicProfileActions({ clinic, mapUrl, websiteUrl, className = '' }) {
  const site = websiteUrl?.trim();
  const href = site ? (site.startsWith('http') ? site : `https://${site}`) : null;

  return (
    <div
      className={`flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory ${className}`}
    >
      <Link
        to={clinicBookUrl(clinic)}
        className="btn-primary text-xs sm:text-sm !px-4 sm:!px-5 !py-2.5 sm:!py-3 shrink-0 snap-start inline-flex items-center gap-1.5"
      >
        <FaIcon icon="fa-calendar-check" />
        <span className="whitespace-nowrap">Book clinic visit</span>
      </Link>

      {clinic.phone && (
        <a
          href={`tel:${clinic.phone}`}
          className="btn-outline text-xs sm:text-sm !px-3 sm:!px-4 !py-2.5 sm:!py-3 shrink-0 snap-start inline-flex items-center gap-1.5"
        >
          <FaIcon icon="fa-phone" />
          <span className="whitespace-nowrap">Call</span>
        </a>
      )}

      {mapUrl && (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline text-xs sm:text-sm !px-3 sm:!px-4 !py-2.5 sm:!py-3 shrink-0 snap-start inline-flex items-center gap-1.5"
        >
          <FaIcon icon="fa-diamond-turn-right" />
          <span className="whitespace-nowrap">Directions</span>
        </a>
      )}

      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline text-xs sm:text-sm !px-3 sm:!px-4 !py-2.5 sm:!py-3 shrink-0 snap-start inline-flex items-center gap-1.5"
        >
          <FaIcon icon="fa-globe" />
          <span className="whitespace-nowrap">Website</span>
        </a>
      )}

      <button
        type="button"
        onClick={scrollToReviews}
        className="btn-outline text-xs sm:text-sm !px-3 sm:!px-4 !py-2.5 sm:!py-3 shrink-0 snap-start inline-flex items-center gap-1.5"
      >
        <FaIcon icon="fa-star" />
        <span className="whitespace-nowrap">Reviews</span>
      </button>

      <SaveClinicButton clinic={clinic} compact className="shrink-0 snap-start" />

      <ShareProfileButton title={clinic.name} className="!text-xs sm:!text-sm !px-3 sm:!px-4 !py-2.5 sm:!py-3 shrink-0 snap-start" />
    </div>
  );
}
