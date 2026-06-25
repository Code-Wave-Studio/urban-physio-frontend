import FaIcon from '../FaIcon';
import { WEEKDAYS, SOCIAL_FIELDS, tagsToInput } from '../../utils/clinicProfileUtils';

function FieldLabel({ children, hint }) {
  return (
    <div className="mb-1">
      <label className="block text-sm font-medium text-slate-700">{children}</label>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

/**
 * @param {{ form: object, set: (k: string, v: unknown) => void, setHours: (key: string, value: string) => void }} props
 */
export function ClinicProfileDetailsFields({ form, set, setHours }) {
  return (
    <>
      <div>
        <FieldLabel hint="Shown on your public clinic profile">About the clinic</FieldLabel>
        <textarea
          className="input-field min-h-[100px]"
          rows={4}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Describe your clinic, specialities, and patient experience…"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Website</FieldLabel>
          <input
            className="input-field"
            type="url"
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://yourclinic.com"
          />
        </div>
        <div>
          <FieldLabel>Cover image URL</FieldLabel>
          <input
            className="input-field"
            value={form.cover_image}
            onChange={(e) => set('cover_image', e.target.value)}
            placeholder="https://… (banner photo)"
          />
        </div>
      </div>
    </>
  );
}

export function ClinicOpeningHoursFields({ form, setHours }) {
  return (
    <div className="space-y-2">
      <FieldLabel hint="e.g. 09:00-18:00 · leave empty for closed">Opening & closing hours</FieldLabel>
      <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {WEEKDAYS.map(({ key, label }) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-3 py-2.5 bg-white/80">
            <span className="text-sm font-medium text-slate-700 w-28 shrink-0">{label}</span>
            <input
              className="input-field !py-2 text-sm flex-1"
              value={(form.opening_hours?.[key] || []).join(', ')}
              onChange={(e) => setHours(key, e.target.value)}
              placeholder="09:00-18:00 or closed"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClinicSocialLinksFields({ form, setSocial }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {SOCIAL_FIELDS.map(({ key, label, icon, placeholder, brand }) => (
        <div key={key}>
          <FieldLabel>
            <span className="inline-flex items-center gap-1.5">
              <FaIcon icon={icon} brand={brand} className="text-slate-500 text-xs" />
              {label}
            </span>
          </FieldLabel>
          <input
            className="input-field !py-2.5 text-sm"
            value={form.social_links?.[key] || ''}
            onChange={(e) => setSocial(key, e.target.value)}
            placeholder={placeholder}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Google Maps profile link (primary) + optional GPS pin for map embed.
 * @param {{ form: object, set: (k: string, v: unknown) => void, onPickMap?: () => void }} props
 */
export function ClinicLocationFields({ form, set, onPickMap }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel hint="Paste your Google Maps business / place link — shown as primary map on profile">
          Google Maps profile link
        </FieldLabel>
        <input
          className="input-field"
          type="url"
          value={form.google_maps_url || ''}
          onChange={(e) => set('google_maps_url', e.target.value)}
          placeholder="https://maps.google.com/… or https://goo.gl/maps/…"
        />
      </div>
      {onPickMap && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <FaIcon icon="fa-map-location-dot" className="text-emerald-600" />
            Optional GPS pin
          </p>
          <p className="text-xs text-slate-500 mt-1">For precise map embed — not required if you added the Google Maps link above.</p>
          <button type="button" className="btn-outline text-sm mt-3 w-full sm:w-auto" onClick={onPickMap}>
            Pick on map
          </button>
          {form.latitude != null && (
            <p className="text-xs text-slate-600 mt-2">
              Pin: {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ClinicTagListFields({ form, set }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel hint="Comma-separated treatments & services">Treatments / services</FieldLabel>
        <textarea
          className="input-field min-h-[72px] text-sm"
          value={tagsToInput(form.services)}
          onChange={(e) => set('services', e.target.value)}
          placeholder="Sports injury rehab, Back pain, Post-op rehab…"
        />
      </div>
      <div>
        <FieldLabel hint="Equipment & modalities available at clinic">Equipment & modalities</FieldLabel>
        <textarea
          className="input-field min-h-[72px] text-sm"
          value={tagsToInput(form.equipment_modalities)}
          onChange={(e) => set('equipment_modalities', e.target.value)}
          placeholder="Ultrasound, TENS, Laser therapy, Traction…"
        />
      </div>
      <div>
        <FieldLabel hint="Amenities patients care about">Facilities & amenities</FieldLabel>
        <textarea
          className="input-field min-h-[72px] text-sm"
          value={tagsToInput(form.facilities)}
          onChange={(e) => set('facilities', e.target.value)}
          placeholder="Parking, Wheelchair access, AC waiting area…"
        />
      </div>
    </div>
  );
}

export function ClinicStatisticsFields({ form, set }) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <div>
        <FieldLabel>Patients treated</FieldLabel>
        <input
          type="number"
          min={0}
          className="input-field"
          value={form.stats_patients_treated}
          onChange={(e) => set('stats_patients_treated', e.target.value)}
        />
      </div>
      <div>
        <FieldLabel hint="Includes physios & support staff">Staff count</FieldLabel>
        <input
          type="number"
          min={0}
          className="input-field"
          value={form.stats_staff_count}
          onChange={(e) => set('stats_staff_count', e.target.value)}
        />
      </div>
      <div>
        <FieldLabel hint="Optional display metric — star rating is set by main admin only">Satisfaction rate (%)</FieldLabel>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          className="input-field"
          value={form.stats_satisfaction_rate}
          onChange={(e) => set('stats_satisfaction_rate', e.target.value)}
          placeholder="Auto"
        />
      </div>
    </div>
  );
}
