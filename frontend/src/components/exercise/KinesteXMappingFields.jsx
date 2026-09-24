/**
 * Shared KinesteX mapping fields for Admin / Clinic exercise editors (Phase 2).
 * Informational configuration only — does not start AI sessions.
 */
export const EMPTY_KINESTEX = {
  ai_supported: false,
  status: 'inactive',
  kinestex_exercise_id: '',
  kinestex_model_id: '',
};

export function kinestexFromExercise(ex) {
  const k = ex?.kinestex || {};
  return {
    ai_supported: !!k.ai_supported,
    status: k.status === 'active' ? 'active' : 'inactive',
    kinestex_exercise_id: k.kinestex_exercise_id || '',
    kinestex_model_id: k.kinestex_model_id || '',
  };
}

export function kinestexPayload(formKinestex) {
  return {
    ai_supported: !!formKinestex.ai_supported,
    status: formKinestex.ai_supported
      ? formKinestex.status === 'active'
        ? 'active'
        : 'inactive'
      : 'inactive',
    kinestex_exercise_id: (formKinestex.kinestex_exercise_id || '').trim(),
    kinestex_model_id: (formKinestex.kinestex_model_id || '').trim(),
  };
}

/** List/detail badge helper using public or manage payload shapes. */
export function showAiReadyBadge(kinestex) {
  if (!kinestex) return false;
  if (kinestex.mapped && kinestex.ai_supported) return true;
  return (
    !!kinestex.ai_supported &&
    kinestex.status === 'active' &&
    !!(kinestex.kinestex_exercise_id || '').trim()
  );
}

export default function KinesteXMappingFields({ value, onChange, disabled = false }) {
  const v = value || EMPTY_KINESTEX;
  const set = (key, next) => onChange({ ...v, [key]: next });

  return (
    <div className={`rounded-xl border border-teal-100 bg-teal-50/40 p-4 space-y-3 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <div>
        <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700 text-xs">AI</span>
          KinesteX AI
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Map this library exercise to an official KinesteX Content API exercise ID. Leave unmapped if no verified match exists.
          Do not invent IDs.
        </p>
      </div>

      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm font-medium text-slate-700">AI monitoring supported</span>
        <button
          type="button"
          role="switch"
          aria-checked={!!v.ai_supported}
          disabled={disabled}
          onClick={() => {
            const next = !v.ai_supported;
            onChange({
              ...v,
              ai_supported: next,
              status: next ? (v.status === 'active' ? 'active' : 'inactive') : 'inactive',
            });
          }}
          className={`relative w-11 h-6 rounded-full transition-colors ${v.ai_supported ? 'bg-teal-600' : 'bg-slate-300'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${v.ai_supported ? 'translate-x-5' : ''}`}
          />
        </button>
      </label>

      {v.ai_supported && (
        <>
          <label className="block text-sm font-medium text-slate-700">
            KinesteX Exercise ID
            <input
              className="input-field mt-1.5 w-full font-mono text-sm"
              value={v.kinestex_exercise_id}
              onChange={(e) => set('kinestex_exercise_id', e.target.value)}
              placeholder="Official KinesteX exercise document ID"
              autoComplete="off"
              disabled={disabled}
              required={!!v.ai_supported}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Mapping status
            <select
              className="input-field mt-1.5 w-full"
              value={v.status}
              onChange={(e) => set('status', e.target.value)}
              disabled={disabled}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            KinesteX model ID <span className="font-normal text-slate-400">(optional)</span>
            <input
              className="input-field mt-1.5 w-full font-mono text-sm"
              value={v.kinestex_model_id}
              onChange={(e) => set('kinestex_model_id', e.target.value)}
              placeholder="Motion model ID from Content API (modelId)"
              autoComplete="off"
              disabled={disabled}
            />
          </label>
        </>
      )}
    </div>
  );
}
