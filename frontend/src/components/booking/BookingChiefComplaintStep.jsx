import { useEffect } from 'react';
import RulerSlider from '../ui/RulerSlider';

const DURATION_OPTIONS = [
  'Less than 1 week',
  '1–2 weeks',
  '2–4 weeks',
  '1–3 months',
  '3–6 months',
  'More than 6 months',
];

const PAIN_LABELS = {
  1: 'Mild',
  2: 'Mild',
  3: 'Mild',
  4: 'Low–mod',
  5: 'Moderate',
  6: 'Moderate',
  7: 'High',
  8: 'Severe',
  9: 'Severe',
  10: 'Worst',
};

function durationIndex(value) {
  const idx = DURATION_OPTIONS.indexOf(value);
  return idx >= 0 ? idx : 0;
}

export default function BookingChiefComplaintStep({ form, patch, painTypes }) {
  const types = painTypes.length ? painTypes : ['Back Pain', 'Neck Pain', 'Knee Pain', 'Shoulder Pain', 'Other'];
  const painLevel = Number(form.pain_level) || 5;
  const durationIdx = durationIndex(form.pain_duration);

  useEffect(() => {
    patch((f) => ({
      ...f,
      pain_duration: f.pain_duration || DURATION_OPTIONS[0],
      pain_level: f.pain_level || '5',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        <div className="md:col-span-2 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 p-4 sm:p-5 shadow-sm">
          <RulerSlider
            label="How long have you had this?"
            icon="fa-clock"
            min={0}
            max={DURATION_OPTIONS.length - 1}
            step={1}
            value={durationIdx}
            onChange={(idx) => patch({ pain_duration: DURATION_OPTIONS[idx] })}
            ticks={['1', '2', '3', '4', '5', '6']}
            formatValue={(idx) => DURATION_OPTIONS[idx] || DURATION_OPTIONS[0]}
            accent="primary"
          />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-amber-50/40 p-4 sm:p-5 shadow-sm">
          <RulerSlider
            label="Pain level (1–10)"
            icon="fa-heart-pulse"
            min={1}
            max={10}
            step={1}
            value={painLevel}
            onChange={(n) => patch({ pain_level: String(n) })}
            formatValue={(n) => `${n} — ${PAIN_LABELS[n] || ''}`}
            accent="amber"
          />
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
