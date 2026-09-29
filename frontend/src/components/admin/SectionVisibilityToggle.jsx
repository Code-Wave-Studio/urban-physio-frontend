import { CmsPanel } from './CmsFormKit';

function EnabledToggle({ on, onChange, accent }) {
  const active = accent === 'teal' ? 'bg-teal-600' : 'bg-primary-600';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(on ? '0' : '1')}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        on ? active : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      <span className="sr-only">{on ? 'Shown' : 'Hidden'}</span>
    </button>
  );
}

export default function SectionVisibilityToggle({
  label,
  description,
  on,
  onChange,
  accent = 'orange',
}) {
  return (
    <CmsPanel title="Section visibility" icon="fa-eye">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        <EnabledToggle on={on} onChange={onChange} accent={accent} />
      </div>
    </CmsPanel>
  );
}
