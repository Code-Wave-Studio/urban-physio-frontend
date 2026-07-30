/**
 * Profile field — view (read-only) or edit (controlled input).
 * No per-field save/cancel; parent owns page-level Edit/Save.
 */
export default function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  options = [],
  placeholder = '—',
  className = '',
  editing = false,
  disabled = false,
}) {
  const displayVal =
    type === 'select'
      ? options.find((o) => String(o.value) === String(value))?.label || value || placeholder
      : value || placeholder;

  const inputClass =
    'w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white';

  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5 font-semibold">{label}</p>

      {editing && !disabled ? (
        type === 'textarea' ? (
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder === '—' ? '' : placeholder}
          />
        ) : type === 'select' ? (
          <select
            className={inputClass}
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
          >
            <option value="">— Select —</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            className={inputClass}
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder === '—' ? '' : placeholder}
          />
        )
      ) : (
        <p className="text-sm text-slate-800 py-1.5 min-h-[1.75rem] break-words">
          {displayVal || <span className="text-slate-400">{placeholder}</span>}
        </p>
      )}
    </div>
  );
}
