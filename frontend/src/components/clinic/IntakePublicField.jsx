import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { isFieldVisible, parseOptions, parseValidation } from '../../utils/intakeFields';

/** Invisible required control for custom widgets browsers can't validate natively. */
function RequiredProbe({ active }) {
  if (!active) return null;
  return (
    <input
      className="sr-only absolute w-px h-px opacity-0 pointer-events-none"
      tabIndex={-1}
      required
      value=""
      onChange={() => {}}
      aria-hidden
    />
  );
}

function SignaturePad({ value, onChange, required }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const paint = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.offsetWidth || 280;
      const height = 120;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.strokeStyle = '#0f766e';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.clearRect(0, 0, width, height);
      if (value) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, width, height);
        img.src = value;
      }
    };
    paint();
    window.addEventListener('resize', paint);
    return () => window.removeEventListener('resize', paint);
  }, [value === '' || value == null ? 'empty' : 'set']);

  const pos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches?.[0] || e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange('');
  };

  return (
    <div className="space-y-2 relative">
      <canvas
        ref={canvasRef}
        className="w-full h-[120px] rounded-xl border border-slate-200 bg-white touch-none"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <RequiredProbe active={required && !value} />
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-slate-400">{required ? 'Signature required' : 'Sign above'}</span>
        <button type="button" className="text-xs text-teal-700 font-semibold" onClick={clear}>
          Clear
        </button>
      </div>
    </div>
  );
}

/**
 * Renders one public intake field (QR + live preview).
 */
export default function IntakePublicField({ field, value, onChange, className = '' }) {
  const type = field.field_type || field.type || 'text';
  const options = parseOptions(field.options || field.options_json);
  const validation = parseValidation(field);
  const ratingMax = Math.max(2, Math.min(10, Number(validation.rating_max || 5)));
  const inputClass = className || 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500';
  const required = Boolean(Number(field.is_required ?? field.required));
  const id = `field-${field.id || field.field_key}`;

  if (type === 'textarea') {
    return (
      <textarea
        id={id}
        className={inputClass}
        rows={3}
        required={required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (type === 'yesno' || type === 'dropdown') {
    const choices = type === 'yesno' ? ['Yes', 'No'] : options;
    return (
      <select
        id={id}
        className={inputClass}
        required={required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {choices.map((option) => (
          <option key={String(option)} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (type === 'radio') {
    return (
      <div className="space-y-2 relative" role="radiogroup" aria-required={required}>
        {options.map((option) => (
          <label key={String(option)} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={id}
              value={option}
              checked={String(value ?? '') === String(option)}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
        <RequiredProbe active={required && !value} />
        {!options.length && (
          <p className="text-xs text-amber-600">No options configured for this field.</p>
        )}
      </div>
    );
  }

  if (type === 'checkbox' || type === 'multiselect') {
    const selected = Array.isArray(value)
      ? value.map(String)
      : (typeof value === 'string' && value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);
    if (type === 'multiselect') {
      return (
        <div className="relative">
          <select
            id={id}
            className={inputClass}
            multiple
            value={selected}
            onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
          >
            {options.map((option) => (
              <option key={String(option)} value={option}>{option}</option>
            ))}
          </select>
          <RequiredProbe active={required && selected.length === 0} />
        </div>
      );
    }
    return (
      <div className="space-y-2 relative">
        {options.map((option) => {
          const checked = selected.includes(String(option));
          return (
            <label key={String(option)} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  const next = checked
                    ? selected.filter((v) => v !== String(option))
                    : [...selected, String(option)];
                  onChange(next);
                }}
              />
              {option}
            </label>
          );
        })}
        <RequiredProbe active={required && selected.length === 0} />
        {!options.length && (
          <p className="text-xs text-amber-600">No options configured for this field.</p>
        )}
      </div>
    );
  }

  if (type === 'rating') {
    return (
      <div className="flex flex-wrap gap-1.5 relative" role="group" aria-label="Rating">
        {Array.from({ length: ratingMax }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={`w-9 h-9 rounded-lg border text-sm font-semibold transition ${
              Number(value) >= n
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
            onClick={() => onChange(String(n))}
          >
            {n}
          </button>
        ))}
        <RequiredProbe active={required && !value} />
      </div>
    );
  }

  if (type === 'file') {
    return (
      <div className="relative space-y-1">
        <input
          id={id}
          className={inputClass}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              onChange('');
              return;
            }
            if (file.size > 1.5 * 1024 * 1024) {
              toast.error('File must be under 1.5 MB');
              onChange('');
              e.target.value = '';
              return;
            }
            const reader = new FileReader();
            reader.onload = () => onChange(String(reader.result || ''));
            reader.readAsDataURL(file);
          }}
        />
        {value ? <p className="text-[11px] text-emerald-700">File attached</p> : null}
        <RequiredProbe active={required && !value} />
      </div>
    );
  }

  if (type === 'signature') {
    return <SignaturePad value={value || ''} onChange={onChange} required={required} />;
  }

  const htmlType = type === 'phone' ? 'tel' : (['email', 'date', 'number'].includes(type) ? type : 'text');
  return (
    <input
      id={id}
      className={inputClass}
      type={htmlType}
      inputMode={type === 'phone' ? 'numeric' : undefined}
      required={required}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function IntakeFieldPreview({ fields }) {
  const [values, setValues] = useState({});
  const visible = fields.filter((f) => f.is_enabled !== false && f.is_enabled !== 0);

  return (
    <div className="space-y-4">
      {visible.map((field) => {
        if (!isFieldVisible(field, values)) return null;
        const key = field.field_key || `custom_${field.id}`;
        return (
          <label key={field.id || key} htmlFor={`field-${field.id || key}`} className="block">
            <span className="block text-sm font-semibold text-slate-700 mb-1.5">
              {field.label}
              {Boolean(Number(field.is_required)) && <span className="text-rose-500"> *</span>}
            </span>
            <IntakePublicField
              field={field}
              value={values[key]}
              onChange={(v) => setValues((old) => ({ ...old, [key]: v }))}
              className="input-field"
            />
          </label>
        );
      })}
      {!visible.length && (
        <p className="text-xs text-slate-400 text-center py-8">Enable fields to preview the intake form.</p>
      )}
    </div>
  );
}
