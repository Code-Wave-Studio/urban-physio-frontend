import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';

/**
 * Colorful speed-dial row for portal sidebars / dashboards.
 */
export default function PortalSpeedDial({ items = [], onAction, onNavigate, className = '' }) {
  if (!items?.length) return null;

  return (
    <div className={`portal-speed-dial ${className}`} role="list" aria-label="Quick actions">
      <div className="scroll-x-touch flex gap-2.5 pb-1 snap-x snap-mandatory">
        {items.map((item) => {
          const inner = (
            <>
              <span
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color || 'from-primary-500 to-orange-600'} text-white flex items-center justify-center shadow-md shrink-0`}
              >
                <FaIcon icon={item.icon} className="text-sm" />
              </span>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight line-clamp-2 text-center max-w-[4.5rem]">
                {item.label}
              </span>
            </>
          );

          const base =
            'portal-speed-dial-item snap-start shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-in-out';

          if (item.action) {
            return (
              <button
                key={item.action + item.label}
                type="button"
                role="listitem"
                className={base}
                onClick={() => {
                  onAction?.(item.action, item);
                  onNavigate?.();
                }}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={item.to + item.label}
              to={item.to}
              role="listitem"
              className={base}
              onClick={() => onNavigate?.()}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
