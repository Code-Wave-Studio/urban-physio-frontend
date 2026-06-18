import FaIcon from '../FaIcon';

export default function ReviewStars({ rating = 0, count = 0, size = 'sm' }) {
  const stars = Math.round(Number(rating) || 0);
  const cls = size === 'lg' ? 'text-lg' : 'text-sm';
  return (
    <span className={`inline-flex items-center gap-1 ${cls}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FaIcon key={i} icon="fa-star" className={i <= stars ? 'text-amber-500' : 'text-slate-300'} />
      ))}
      {count > 0 && <span className="text-slate-500 text-xs ml-1">({count})</span>}
    </span>
  );
}
