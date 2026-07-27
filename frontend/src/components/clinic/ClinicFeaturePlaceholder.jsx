import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import ClinicPortalShell from './ClinicPortalShell';

/**
 * Consistent placeholder for Feature Request menus not fully built yet.
 */
export default function ClinicFeaturePlaceholder({
  title,
  subtitle,
  icon = 'fa-screwdriver-wrench',
  bullets = [],
  actions = [],
}) {
  return (
    <ClinicPortalShell title={title} subtitle={subtitle}>
      <div className="glass-card max-w-2xl mx-auto text-center py-10 px-6">
        <span className="inline-flex w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 items-center justify-center text-2xl mb-4">
          <FaIcon icon={icon} />
        </span>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          This menu is part of the Clinic Portal Feature Request. Core pieces may already exist elsewhere —
          full workflow is being rolled out in phases.
        </p>
        {!!bullets.length && (
          <ul className="text-left text-sm text-slate-600 mt-6 space-y-2 max-w-md mx-auto">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <FaIcon icon="fa-circle-check" className="text-teal-600 mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        {!!actions.length && (
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {actions.map((a) => (
              <Link key={a.to} to={a.to} className="btn-primary inline-flex items-center gap-2 !py-2 !px-4 text-sm">
                <FaIcon icon={a.icon || 'fa-arrow-right'} />
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </ClinicPortalShell>
  );
}
