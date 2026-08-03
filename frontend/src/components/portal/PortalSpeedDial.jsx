import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';

function SpeedDialTile({ item, onAction, onNavigate }) {
  const inner = (
    <>
      <span
        className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color || 'from-primary-500 to-orange-600'} text-white flex items-center justify-center shrink-0 mb-2`}
      >
        <FaIcon icon={item.icon} className="text-xs" />
      </span>
      <span className="text-xs font-semibold text-slate-700 leading-snug flex-1">{item.label}</span>
    </>
  );

  const base =
    'portal-speed-dial-item flex flex-col h-full rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 active:scale-[0.98] transition-transform';

  if (item.action) {
    return (
      <button
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
      to={item.to}
      role="listitem"
      className={base}
      onClick={() => onNavigate?.()}
    >
      {inner}
    </Link>
  );
}

/**
 * Quick-action grid for portal sidebars / dashboards.
 */
export default function PortalSpeedDial({ items = [], onAction, onNavigate, className = '' }) {
  if (!items?.length) return null;

  const gridCols = items.length === 5 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2';

  return (
    <div className={`portal-speed-dial ${className}`} role="list" aria-label="Quick actions">
      <div className={`grid ${gridCols} gap-2 auto-rows-fr items-stretch`}>
        {items.map((item) => (
          <SpeedDialTile
            key={(item.to || item.action) + item.label}
            item={item}
            onAction={onAction}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
