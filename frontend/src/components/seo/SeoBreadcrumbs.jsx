import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';

/**
 * Visual breadcrumbs for SEO landing pages.
 *
 * @param {{ items: Array<{ label: string, href?: string }>, tone?: 'onDark' | 'onLight' }} props
 */
export default function SeoBreadcrumbs({ items, tone = 'onDark' }) {
  if (!items?.length) return null;

  const isDark = tone === 'onDark';
  const wrap = isDark ? 'text-white/80 mb-6' : 'text-slate-500 mb-4';
  const linkCls = isDark ? 'hover:text-white transition' : 'hover:text-teal-700 transition text-slate-600';
  const lastCls = isDark ? 'text-white font-medium' : 'text-slate-800 font-medium';
  const midCls = isDark ? 'text-white/90' : 'text-slate-600';

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-sm flex-wrap ${wrap}`}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-2">
            {idx > 0 && <FaIcon icon="fa-chevron-right" className="text-xs opacity-60" />}
            {item.href && !isLast ? (
              <Link to={item.href} className={linkCls}>
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? lastCls : midCls}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
