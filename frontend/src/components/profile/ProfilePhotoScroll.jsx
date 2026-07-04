import ClinicCoverImage from '../clinic/ClinicCoverImage';

/**
 * Horizontal photo strip — clinic & doctor profile headers (swipeable, snap).
 * @param {{ slides: { id: string, image_url: string }[], alt?: string, className?: string }} props
 */
export default function ProfilePhotoScroll({ slides = [], alt = '', className = '' }) {
  if (!slides.length) return null;

  return (
    <div className={`max-w-full min-w-0 ${className}`}>
      <div className="scroll-x-touch flex gap-3 pb-1 snap-x snap-mandatory scroll-smooth">
        {slides.map((img) => (
          <div
            key={img.id}
            className="shrink-0 w-[85%] sm:w-80 max-w-full aspect-video snap-center rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
          >
            <ClinicCoverImage src={img.image_url} alt={alt} variant="profile" />
          </div>
        ))}
      </div>
    </div>
  );
}
