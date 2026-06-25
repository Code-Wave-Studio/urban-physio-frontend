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
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Personal details</h2>
        <p className="text-sm text-slate-600 mt-1">We use this to confirm your booking and reach you.</p>
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
        <div className="md:col-span-2">
          <input
            className="input-field"
            placeholder="Address"
            value={form.patient_address}
            onChange={(e) => patch({ patient_address: e.target.value })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-800">GPS location</p>
        <button type="button" onClick={onOpenMap} className="btn-outline text-sm w-full sm:w-auto">
          <FaIcon icon="fa-map-location-dot" className="mr-2" />
          {form.map_latitude != null ? 'Update location on map' : 'Capture GPS on map'}
        </button>
        {form.map_latitude != null && (
          <div className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-slate-100">
            <p>Lat: {Number(form.map_latitude).toFixed(5)}, Lng: {Number(form.map_longitude).toFixed(5)}</p>
            <a
              href={googleMapsUrl(form.map_latitude, form.map_longitude)}
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 font-medium"
            >
              Preview on map
            </a>
          </div>
        )}
        {consultationType === 'home_visit' && form.map_latitude == null && (
          <p className="text-xs text-amber-700">GPS location is required for home visits.</p>
        )}
      </div>

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

      {consultationType === 'home_visit' && (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <p className="font-medium text-sm text-slate-800">Home visit address</p>
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
        </div>
      )}
    </div>
  );
}
