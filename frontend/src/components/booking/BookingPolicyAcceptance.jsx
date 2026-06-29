import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { ALL_POLICIES } from '../../constants/policyPages';

export function emptyPolicyAcceptance() {
  return Object.fromEntries(ALL_POLICIES.map((p) => [p.key, false]));
}

export function allPoliciesAccepted(acceptance) {
  return ALL_POLICIES.every((p) => acceptance[p.key] === true);
}

export default function BookingPolicyAcceptance({ acceptance, onChange }) {
  const complete = allPoliciesAccepted(acceptance);

  const setAll = (checked) => {
    const next = {};
    ALL_POLICIES.forEach((p) => {
      next[p.key] = checked;
    });
    onChange(next);
  };

  const toggle = (key) => {
    onChange({ ...acceptance, [key]: !acceptance[key] });
  };

  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 transition-colors ${
        complete ? 'border-emerald-200 bg-emerald-50/80' : 'border-amber-200 bg-amber-50/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex gap-3 min-w-0">
          <span
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            <FaIcon icon="fa-file-signature" />
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">Policy agreement required</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Accept every policy below before completing your secure checkout.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAll(true)}
          className="text-xs font-medium text-primary-700 hover:text-primary-800 whitespace-nowrap shrink-0"
        >
          Accept all
        </button>
      </div>

      <ul className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {ALL_POLICIES.map((p) => (
          <li key={p.key}>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={!!acceptance[p.key]}
                onChange={() => toggle(p.key)}
              />
              <span className="text-sm text-slate-700 leading-snug">
                I accept the{' '}
                <Link
                  to={p.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-700 hover:underline inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {p.label}
                  <FaIcon icon="fa-arrow-up-right-from-square" className="text-[10px]" />
                </Link>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {!complete && (
        <p className="text-xs text-amber-800 mt-3 flex items-center gap-1.5">
          <FaIcon icon="fa-circle-exclamation" />
          All {ALL_POLICIES.length} policies must be accepted to pay.
        </p>
      )}
    </div>
  );
}
