import FaIcon from './FaIcon';

export default function PartnerClinicBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-100 shrink-0 ${className}`}
    >
      <FaIcon icon="fa-circle-check" className="text-emerald-600" />
      Partner clinic
    </span>
  );
}
