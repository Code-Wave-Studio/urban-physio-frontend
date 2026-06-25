const PAIN_LEVELS = [
  { value: 1, label: '1 — Mild' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5 — Moderate' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 10, label: '10 — Severe' },
];

const DURATION_OPTIONS = [
  'Less than 1 week',
  '1–2 weeks',
  '2–4 weeks',
  '1–3 months',
  '3–6 months',
  'More than 6 months',
];

export default function BookingChiefComplaintStep({ form, patch, painTypes }) {
  const types = painTypes.length ? painTypes : ['Back Pain', 'Neck Pain', 'Knee Pain', 'Shoulder Pain', 'Other'];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Chief complaint</h2>
        <p className="text-sm text-slate-600 mt-1">Help your physiotherapist prepare for your session.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pain area *</label>
          <select
            className="input-field"
            value={form.pain_type}
            onChange={(e) => patch({ pain_type: e.target.value, pain_area: e.target.value })}
          >
            <option value="">Select pain area…</option>
            {types.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms *</label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Describe pain, stiffness, swelling, movement limits…"
            value={form.pain_description}
            onChange={(e) => patch({ pain_description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
          <select
            className="input-field"
            value={form.pain_duration}
            onChange={(e) => patch({ pain_duration: e.target.value })}
          >
            <option value="">How long?</option>
            {DURATION_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pain level (1–10)</label>
          <select
            className="input-field"
            value={form.pain_level}
            onChange={(e) => patch({ pain_level: e.target.value })}
          >
            <option value="">Select severity…</option>
            {PAIN_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Medical history</label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Surgeries, chronic conditions, medications, allergies…"
            value={form.medical_history}
            onChange={(e) => patch({ medical_history: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Additional notes</label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Anything else your therapist should know…"
            value={form.additional_notes}
            onChange={(e) => patch({ additional_notes: e.target.value, special_instructions: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
