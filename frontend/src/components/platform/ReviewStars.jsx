import FaIcon from '../FaIcon';



export default function ReviewStars({ rating = 0, count = 0, size = 'sm', onClick, className = '' }) {

  const stars = Math.round(Number(rating) || 0);

  const cls = size === 'lg' ? 'text-lg' : 'text-sm';

  const interactive = typeof onClick === 'function';

  const Wrapper = interactive ? 'button' : 'span';



  return (

    <Wrapper

      type={interactive ? 'button' : undefined}

      onClick={onClick}

      className={`inline-flex items-center gap-1 ${cls} ${interactive ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}

      aria-label={interactive ? 'View patient reviews' : undefined}

    >

      {[1, 2, 3, 4, 5].map((i) => (

        <FaIcon key={i} icon="fa-star" className={i <= stars ? 'text-amber-500' : 'text-slate-300'} />

      ))}

      {count > 0 && <span className="text-slate-500 text-xs ml-1">({count})</span>}

    </Wrapper>

  );

}

