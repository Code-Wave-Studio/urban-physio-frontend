import { useId } from 'react';
import FaIcon from '../FaIcon';

/**
 * Modern ruler-style range slider with tick marks.
 */
export default function RulerSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  ticks = null,
  formatValue,
  accent = 'primary',
  icon,
}) {
  const id = useId();
  const num = Number(value);
  const safeVal = Number.isFinite(num) ? Math.min(max, Math.max(min, num)) : min;
  const tickLabels = ticks || Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  const pct = ((safeVal - min) / (max - min)) * 100;

  const accentTrack = accent === 'amber' ? 'accent-amber-500' : 'accent-primary-500';
  const accentText = accent === 'amber' ? 'text-amber-700' : 'text-primary-700';
  const accentBg = accent === 'amber' ? 'bg-amber-50 border-amber-100' : 'bg-primary-50 border-primary-100';

  const display = formatValue ? formatValue(safeVal) : String(safeVal);

  return (
    <div className="ruler-slider">
      <div className="flex items-center justify-between gap-2 mb-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 flex items-center gap-2">
          {icon && <FaIcon icon={icon} className={`text-xs ${accentText}`} />}
          {label}
        </label>
        <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${accentBg} ${accentText}`}>
          {display}
        </span>
      </div>

      <div className="relative px-1 pt-1 pb-6">
        <div className="absolute left-1 right-1 top-[1.125rem] h-2 rounded-full bg-slate-200/90 overflow-hidden pointer-events-none">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              accent === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-primary-400 to-primary-600'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeVal}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`ruler-slider-input w-full ${accentTrack}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={safeVal}
        />

        <div className="absolute left-0 right-0 top-[2.35rem] flex justify-between px-0.5 pointer-events-none">
          {tickLabels.map((t, i) => {
            const tickVal = min + i * step;
            const active = tickVal === safeVal;
            return (
              <span
                key={`${t}-${i}`}
                className={`flex flex-col items-center gap-0.5 min-w-0 flex-1 ${
                  i === 0 ? 'items-start' : i === tickLabels.length - 1 ? 'items-end' : 'items-center'
                }`}
              >
                <span
                  className={`w-px h-2 rounded-full transition-colors ${
                    active
                      ? accent === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-primary-500'
                      : 'bg-slate-300'
                  }`}
                />
                <span
                  className={`text-[9px] sm:text-[10px] font-medium leading-tight text-center truncate max-w-full ${
                    active ? `${accentText} font-bold` : 'text-slate-400'
                  }`}
                >
                  {t}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
