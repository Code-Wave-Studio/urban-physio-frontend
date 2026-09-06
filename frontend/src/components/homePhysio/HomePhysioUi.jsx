import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { HOME_VISIT_BOOK_PATH } from '../../constants/homePhysioDefaults';

export function bookHref(link) {
  return link || HOME_VISIT_BOOK_PATH;
}

export function SectionHead({ eyebrow, heading, intro, align = 'center' }) {
  return (
    <div className={`max-w-3xl mb-8 md:mb-12 ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      {eyebrow && (
        <p className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-primary-600 mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="section-title">{heading}</h2>
      {intro && <p className="section-subtitle mt-3 leading-relaxed mx-auto">{intro}</p>}
    </div>
  );
}

export function CtaLink({ to, children, className = 'btn-primary', icon = 'fa-calendar-check' }) {
  return (
    <Link
      to={bookHref(to)}
      className={`${className} inline-flex items-center justify-center gap-2 min-h-11 px-6`}
    >
      <FaIcon icon={icon} />
      {children}
    </Link>
  );
}

export function CheckRow({ children, tone = 'good' }) {
  const good = tone === 'good';
  return (
    <li className="flex gap-2.5 text-sm sm:text-[15px] text-slate-600 leading-relaxed">
      <span
        className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
          good ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
        }`}
      >
        <FaIcon icon={good ? 'fa-check' : 'fa-minus'} className="text-[10px]" />
      </span>
      <span>{children}</span>
    </li>
  );
}

export function QuoteCard({ quote, featured = false }) {
  return (
    <blockquote
      className={`glass-card relative overflow-hidden p-5 sm:p-6 h-full ${
        featured ? 'sm:p-7' : ''
      }`}
    >
      <FaIcon icon="fa-quote-left" className="text-primary-200 text-2xl mb-3" />
      <div className="flex gap-0.5 text-amber-500 mb-3" aria-label={`${quote.rating || 5} out of 5 stars`}>
        {Array.from({ length: Number(quote.rating) || 5 }).map((_, i) => (
          <FaIcon key={i} icon="fa-star" className="text-xs" />
        ))}
      </div>
      <p className={`text-slate-700 leading-relaxed ${featured ? 'text-sm sm:text-base' : 'text-sm line-clamp-4'}`}>
        &ldquo;{quote.text}&rdquo;
      </p>
      <footer className="mt-4 pt-3 border-t border-slate-100">
        <p className="font-semibold text-slate-900 text-sm">{quote.name}</p>
        {quote.city && <p className="text-xs text-slate-500 mt-0.5">{quote.city}</p>}
      </footer>
    </blockquote>
  );
}
