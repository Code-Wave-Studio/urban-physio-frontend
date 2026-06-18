import { useMemo, useState } from 'react';
import FaIcon from '../FaIcon';

/**
 * Searchable dropdown for admin entity pickers (doctors, clinics, etc.)
 */
export default function SearchableEntitySelect({
  label,
  placeholder = 'Search…',
  options = [],
  value,
  onChange,
  disabled = false,
  getOptionValue = (o) => String(o.id),
  getOptionLabel = (o) => o.label || o.name || `#${o.id}`,
  getOptionSub = (o) => o.sub || '',
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const labelText = getOptionLabel(o).toLowerCase();
      const sub = getOptionSub(o).toLowerCase();
      return labelText.includes(q) || sub.includes(q) || String(getOptionValue(o)).includes(q);
    });
  }, [options, query, getOptionLabel, getOptionSub, getOptionValue]);

  const selected = options.find((o) => String(getOptionValue(o)) === String(value));

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <input
        type="text"
        className="input-field mb-2"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
      />
      <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-slate-500 text-center">No matches</p>
        ) : (
          filtered.map((o) => {
            const id = getOptionValue(o);
            const active = String(value) === String(id);
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(id)}
                className={`w-full text-left px-3 py-2.5 text-sm transition ${
                  active ? 'bg-primary-50 text-primary-900' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <span className="font-medium block truncate">{getOptionLabel(o)}</span>
                {getOptionSub(o) && (
                  <span className="text-xs text-slate-500 block truncate">{getOptionSub(o)}</span>
                )}
              </button>
            );
          })
        )}
      </div>
      {selected && (
        <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1.5">
          <FaIcon icon="fa-circle-check" />
          Selected: <strong>{getOptionLabel(selected)}</strong>
        </p>
      )}
    </div>
  );
}
