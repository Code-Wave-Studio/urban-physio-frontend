import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';

// Shown when no avatar photo is uploaded for that slot.
const AVATAR_FALLBACK = [
  { icon: 'fa-user', bg: '#DCE6F4', fg: '#376299' },
  { icon: 'fa-person-dress', bg: '#FDE3DF', fg: '#C2412F' },
  { icon: 'fa-user', bg: '#DFF3EA', fg: '#1F7A55' },
];

/** Google rating + patient count. Either half hides when its value is empty in admin. */
export default function HeroSocialProof({ rating = {}, patients = {} }) {
  const showRating = !!String(rating.value || '').trim();
  const showPatients = !!String(patients.value || '').trim();
  if (!showRating && !showPatients) return null;

  const ratingBody = (
    <>
      <span className="tup-proof-g" aria-hidden="true">
        <FaIcon icon="fa-brands fa-google" />
      </span>
      <span>
        <span className="tup-proof-num">
          {rating.value}
          <span className="tup-proof-stars" aria-hidden="true">★★★★★</span>
        </span>
        <span className="tup-proof-label">
          {rating.label || 'Google rating'}
          {rating.reviews ? ` · ${rating.reviews} reviews` : ''}
        </span>
      </span>
    </>
  );

  return (
    <div className="tup-proof">
      {showRating &&
        (rating.url ? (
          <a className="tup-proof-item tup-proof-link" href={rating.url} target="_blank" rel="noopener noreferrer">
            {ratingBody}
          </a>
        ) : (
          <div className="tup-proof-item">{ratingBody}</div>
        ))}
      {showRating && showPatients && <span className="tup-proof-divider" aria-hidden="true" />}
      {showPatients && (
        <div className="tup-proof-item">
          <span className="tup-proof-avatars" aria-hidden="true">
            {(patients.avatars || []).slice(0, 3).map((src, i) => {
              const fb = AVATAR_FALLBACK[i];
              const url = src ? resolveMediaUrl(src) || src : '';
              return url ? (
                <img key={i} src={url} alt="" loading="lazy" decoding="async" />
              ) : (
                <span key={i} style={{ background: fb.bg, color: fb.fg }}>
                  <FaIcon icon={fb.icon} />
                </span>
              );
            })}
          </span>
          <span>
            <span className="tup-proof-num">{patients.value}</span>
            <span className="tup-proof-label">{patients.label || 'Happy patients'}</span>
          </span>
        </div>
      )}
    </div>
  );
}
