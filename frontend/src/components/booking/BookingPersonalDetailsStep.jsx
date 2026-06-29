import FaIcon from '../FaIcon';
import { googleMapsUrl } from '../../utils/locationHelpers';

export default function BookingPersonalDetailsStep({
  form,
  patch,
  consultationType,
  sessions,
  homeConditions,
  onOpenMap,
  uploading,
  onReportUpload,
}) {
  const isHomeVisit = consultationType === 'home_visit';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Personal details</h2>
        <p className="text-sm text-slate-600 mt-1">We use this to confirm your booking and reach you.</p>
        {form.full_name && (
          <p className="text-xs text-primary-700 mt-1">Prefilled from your profile — edit if needed.</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <input
            className="input-field"
            placeholder="Full name *"
            value={form.full_name}
            onChange={(e) => patch({ full_name: e.target.value })}
          />
        </div>
        <input
          className="input-field"
          placeholder="Mobile number *"
          value={form.mobile}
          onChange={(e) => patch({ mobile: e.target.value })}
        />
        <input
          type="email"
          className="input-field"
          placeholder="Email *"
          value={form.email}
          onChange={(e) => patch({ email: e.target.value })}
        />
        <input
          type="number"
          min={1}
          max={120}
          className="input-field"
          placeholder="Age *"
          value={form.age}
          onChange={(e) => patch({ age: e.target.value })}
        />
        <select
          className="input-field"
          value={form.gender}
          onChange={(e) => patch({ gender: e.target.value })}
        >
          <option value="">Gender *</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {!isHomeVisit && (
          <div className="md:col-span-2">
            <input
              className="input-field"
              placeholder="Address (optional)"
              value={form.patient_address}
              onChange={(e) => patch({ patient_address: e.target.value })}
            />
          </div>
        )}
      </div>

      {isHomeVisit && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div>
            <p className="font-medium text-sm text-slate-800">Home visit address</p>
            <p className="text-xs text-slate-500 mt-0.5">Where should the physiotherapist visit you?</p>
          </div>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Full address *"
            value={form.full_address}
            onChange={(e) => patch({ full_address: e.target.value, patient_address: e.target.value })}
          />
          <input className="input-field" placeholder="Landmark" value={form.landmark} onChange={(e) => patch({ landmark: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" placeholder="Pincode *" value={form.pincode} onChange={(e) => patch({ pincode: e.target.value })} />
            <input className="input-field" placeholder="City *" value={form.city} onChange={(e) => patch({ city: e.target.value })} />
          </div>
          <select className="input-field" value={form.patient_condition} onChange={(e) => patch({ patient_condition: e.target.value })}>
            <option value="">Patient condition *</option>
            {(homeConditions.length ? homeConditions : ['Bedridden', 'Can Walk', 'Post Surgery', 'Injury']).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="rounded-xl border border-orange-200/80 bg-orange-50/50 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <FaIcon icon="fa-map-location-dot" className="text-orange-600" />
                Pin on map *
              </p>
              <p className="text-xs text-slate-600 mt-1">
                We auto-detect your location when you open the map. Drag the pin if needed.
              </p>
            </div>
            <button type="button" onClick={onOpenMap} className="btn-outline text-sm w-full sm:w-auto">
              <FaIcon icon="fa-house-medical" className="mr-2" />
              {form.map_latitude != null ? 'Update home pin on map' : 'Set home location on map'}
            </button>
            {form.map_latitude != null ? (
              <div className="text-xs text-slate-600 bg-white rounded-lg p-2.5 border border-slate-100">
                <p className="font-medium text-emerald-800 mb-1">
                  <FaIcon icon="fa-circle-check" className="mr-1" />
                  Location pinned
                </p>
                <p>Lat: {Number(form.map_latitude).toFixed(5)}, Lng: {Number(form.map_longitude).toFixed(5)}</p>
                <a
                  href={googleMapsUrl(form.map_latitude, form.map_longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 font-medium inline-block mt-1"
                >
                  Preview on Google Maps
                </a>
              </div>
            ) : (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                Map pin is required so our physio can reach your home.
              </p>
            )}
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <select
          className="input-field"
          value={form.session_type_id}
          onChange={(e) => patch({ session_type_id: parseInt(e.target.value, 10) })}
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration_minutes} min)
            </option>
          ))}
        </select>
      )}

      {consultationType === 'online' && (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <p className="font-medium text-sm text-slate-800">Online consultation</p>
          <select className="input-field" value={form.device_type} onChange={(e) => patch({ device_type: e.target.value })}>
            <option value="">Device type *</option>
            <option value="Mobile">Mobile</option>
            <option value="Laptop">Laptop</option>
          </select>
          <select className="input-field" value={form.internet_quality} onChange={(e) => patch({ internet_quality: e.target.value })}>
            <option value="">Internet quality *</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
          <select className="input-field" value={form.preferred_language} onChange={(e) => patch({ preferred_language: e.target.value })}>
            <option value="">Preferred language *</option>
            <option value="Hindi">Hindi</option>
            <option value="English">English</option>
          </select>
          <div>
            <label className="text-sm font-medium">Upload reports (optional)</label>
            <input type="file" accept=".pdf,image/*" className="input-field mt-1" onChange={onReportUpload} disabled={uploading} />
            {form.report_file && <p className="text-xs text-green-700 mt-1">Uploaded ✓</p>}
          </div>
        </div>
      )}
    </div>
  );
}
