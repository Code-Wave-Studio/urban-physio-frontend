import FaIcon from '../FaIcon';

export function CmsField({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-xs font-semibold text-slate-600">{label}</span>}
      {children}
      {hint && <span className="block text-[11px] text-slate-500 leading-relaxed">{hint}</span>}
    </label>
  );
}

const LINE_LIST_KEYS = new Set(['items', 'features', 'points']);

function readField(item, field) {
  if (typeof item === 'string') return item;
  const value = item?.[field.key];
  if (Array.isArray(value)) return value.join(field.key === 'items' ? ' · ' : '\n');
  return value ?? '';
}

function writeField(field, raw) {
  if (LINE_LIST_KEYS.has(field.key)) {
    return String(raw)
      .split(/\s*[·\n]\s*/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return raw;
}

export function CmsListEditor({ items, onChange, fields, addLabel }) {
  const list = items || [];
  return (
    <div className="space-y-3">
      {list.map((item, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4 space-y-2 relative">
          <div className="flex items-center justify-between gap-2 pr-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Item {i + 1}</p>
            <button
              type="button"
              className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              onClick={() => onChange(list.filter((_, j) => j !== i))}
              aria-label="Remove item"
            >
              <FaIcon icon="fa-trash" />
            </button>
          </div>
          {fields.map((f) =>
            f.type === 'textarea' ? (
              <textarea
                key={f.key}
                className="input-field text-sm min-h-[72px]"
                placeholder={f.label}
                aria-label={f.label}
                value={readField(item, f)}
                onChange={(e) => {
                  if (typeof item === 'string') {
                    const next = [...list];
                    next[i] = e.target.value;
                    onChange(next);
                  } else {
                    const next = [...list];
                    next[i] = { ...next[i], [f.key]: writeField(f, e.target.value) };
                    onChange(next);
                  }
                }}
              />
            ) : (
              <input
                key={f.key}
                className="input-field text-sm"
                placeholder={f.label}
                aria-label={f.label}
                value={typeof item === 'string' ? item : item[f.key] || ''}
                onChange={(e) => {
                  if (typeof item === 'string') {
                    const next = [...list];
                    next[i] = e.target.value;
                    onChange(next);
                  } else {
                    const next = [...list];
                    next[i] = { ...next[i], [f.key]: e.target.value };
                    onChange(next);
                  }
                }}
              />
            )
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn-outline text-xs !py-2"
        onClick={() => {
          const blank =
            fields.length === 1 && fields[0].key === 'value'
              ? ''
              : Object.fromEntries(fields.map((f) => [f.key, '']));
          onChange([...list, blank]);
        }}
      >
        <FaIcon icon="fa-plus" /> {addLabel}
      </button>
    </div>
  );
}

export function CmsPanel({ title, icon, children }) {
  return (
    <section className="glass-card p-4 sm:p-6 space-y-4">
      <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base sm:text-lg">
        {icon && <FaIcon icon={icon} className="text-primary-600" />}
        {title}
      </h2>
      {children}
    </section>
  );
}
