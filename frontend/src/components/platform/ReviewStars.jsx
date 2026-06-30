import FaIcon from '../FaIcon';



export default function ReviewStars({ rating = 0, count = 0, size = 'sm', onClick, className = '', showValue = true }) {

  const numericRating = Number(rating) || 0;
  const reviewCount = Number(count) || 0;
  const stars = Math.round(numericRating);
  const cls = size === 'lg' ? 'text-lg' : 'text-sm';
  const valueCls = size === 'lg' ? 'text-base font-bold text-slate-800' : 'text-sm font-semibold text-slate-700';

  const interactive = typeof onClick === 'function';

  const Wrapper = interactive ? 'button' : 'span';

  const hasRating = numericRating > 0 || reviewCount > 0;

  return (

    <Wrapper

      type={interactive ? 'button' : undefined}

      onClick={onClick}

      className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${cls} ${interactive ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}

      aria-label={interactive ? 'View patient reviews' : undefined}

    >

      {[1, 2, 3, 4, 5].map((i) => (

        <FaIcon key={i} icon="fa-star" className={i <= stars ? 'text-amber-500' : 'text-slate-300'} />

      ))}

      {showValue && hasRating && (
        <span className={`${valueCls} ml-0.5`}>
          {numericRating > 0 ? numericRating.toFixed(1) : '—'}
        </span>
      )}

      {reviewCount > 0 && (
        <span className="text-slate-500 text-xs">
          ({reviewCount} Review{reviewCount !== 1 ? 's' : ''})
        </span>
      )}

    </Wrapper>

  );

}

