import { useEffect, useRef, useState } from 'react';
import FaIcon from '../FaIcon';

/**
 * Inline editable field.
 * Shows value in read mode; becomes an input/select/textarea on edit click.
 * Reports changed value via onChange(value).
 */
export default function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  options = [],      // [{ value, label }] for select type
  placeholder = '—',
  className = '',
  disabled = false,
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal]     = useState(value ?? '');
  const inputRef              = useRef(null);

  useEffect(() => { setLocal(value ?? ''); }, [value]);

  const startEdit = () => {
    if (disabled) return;
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const commit = () => {
    setEditing(false);
    if (local !== (value ?? '')) onChange(local);
  };

  const cancel = () => {
    setEditing(false);
    setLocal(value ?? '');
  };

  const displayVal = type === 'select'
    ? (options.find((o) => String(o.value) === String(value))?.label || value || placeholder)
    : (value || placeholder);

  return (
    <div className={`group ${className}`}>
      <p className="text-[10px] uppercase text-slate-400 mb-0.5">{label}</p>

      {editing ? (
        <div className="flex items-center gap-2">
          {type === 'textarea' ? (
            <textarea
              ref={inputRef}
              className="flex-1 text-sm border border-teal-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              rows={3}
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }}
            />
          ) : type === 'select' ? (
            <select
              ref={inputRef}
              className="flex-1 text-sm border border-teal-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            >
              <option value="">— Select —</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input
              ref={inputRef}
              type={type}
              className="flex-1 text-sm border border-teal-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
            />
          )}
          <button
            type="button"
            onClick={commit}
            className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            title="Save"
          >
            <FaIcon icon="fa-solid fa-check" className="text-xs" />
          </button>
          <button
            type="button"
            onClick={cancel}
            className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
            title="Cancel"
          >
            <FaIcon icon="fa-solid fa-xmark" className="text-xs" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className={`w-full text-left text-sm py-1 rounded-lg transition-colors ${
            disabled
              ? 'text-slate-400 cursor-default'
              : 'text-slate-800 hover:bg-slate-50 group-hover:underline decoration-dotted underline-offset-2 cursor-pointer'
          }`}
          disabled={disabled}
        >
          {displayVal}
          {!disabled && (
            <FaIcon
              icon="fa-solid fa-pen"
              className="ml-1.5 text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </button>
      )}
    </div>
  );
}
