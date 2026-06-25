import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FaIcon from '../FaIcon';
import LocationDoctorsBanner from './LocationDoctorsBanner';
import { getLocalFavourites, toggleLocalFavourite } from '../../utils/bookingFavourites';
import { patients } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const FALLBACK_SORT = [
  { slug: 'recommended', label: 'Recommended', icon: 'fa-wand-magic-sparkles' },
  { slug: 'rating', label: 'Top Rated', icon: 'fa-star' },
  { slug: 'experience', label: 'Experience', icon: 'fa-award' },
  { slug: 'nearest', label: 'Nearest', icon: 'fa-location-crosshairs' },
  { slug: 'price', label: 'Price', icon: 'fa-indian-rupee-sign' },
];

const FALLBACK_SPEC = [
  { slug: 'all', label: 'All' },
  { slug: 'orthopedic', label: 'Orthopedic' },
  { slug: 'neuro', label: 'Neuro' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'pediatric', label: 'Pediatric' },
  { slug: 'cardiopulmonary', label: 'Cardiopulmonary' },
];

function feeForType(doctor, consultationType) {
  if (consultationType === 'online') return doctor.online_fee;
  if (consultationType === 'home_visit') return doctor.home_visit_fee;
  return doctor.consultation_fee;
}

function ProviderCard({
  doctor,
  selected,
  consultationType,
  onSelect,
  favourite,
  onToggleFav,
  compareList,
  onToggleCompare,
}) {
  const fee = feeForType(doctor, consultationType);
  const inCompare = compareList.includes(String(doctor.id));

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(doctor)}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
        selected
          ? 'border-primary-500 bg-primary-50/90 ring-2 ring-primary-200 shadow-md'
          : 'border-slate-200/90 bg-white/90 hover:border-primary-200 hover:shadow-sm'
      }`}
    >
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-primary-600 text-white flex items-center justify-center font-bold shrink-0 overflow-hidden">
          {doctor.avatar ? (
            <img src={doctor.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>
              {doctor.first_name?.[0]}
              {doctor.last_name?.[0]}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-slate-900">
              Dr. {doctor.first_name} {doctor.last_name}
            </p>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFav(doctor.id);
                }}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                  favourite ? 'border-rose-300 bg-rose-50 text-rose-500' : 'border-slate-200 text-slate-400 hover:text-rose-500'
                }`}
                aria-label={favourite ? 'Remove favourite' : 'Add favourite'}
              >
                <FaIcon icon={favourite ? 'fa-heart' : 'fa-heart'} className="text-xs" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(doctor.id);
                }}
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition ${
                  inCompare ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
                }`}
                aria-label="Compare"
              >
                <FaIcon icon="fa-scale-balanced" className="text-[10px]" />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{doctor.specialization || 'Physiotherapist'}</p>
          {doctor.primary_clinic_name && (
            <p className="text-xs text-primary-700 mt-1 inline-flex items-center gap-1">
              <FaIcon icon="fa-hospital" className="text-[10px]" />
              {doctor.primary_clinic_name}
            </p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
            {Number(doctor.rating_avg) > 0 && (
              <span className="text-amber-600 font-semibold">
                <FaIcon icon="fa-star" className="mr-0.5" />
                {Number(doctor.rating_avg).toFixed(1)}
              </span>
            )}
            {doctor.experience_years > 0 && <span>{doctor.experience_years} yrs exp.</span>}
            {doctor.distance_km != null && <span>{doctor.distance_km} km</span>}
            <span className="font-semibold text-primary-700">₹{Number(fee || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function BookingProviderSelectStep({
  form,
  patch,
  consultationType,
  city,
  coords,
  onSelectLocation,
  onlineStateId = '',
  onOnlineStateChange,
  indianStates = [],
  doctors,
  clinics,
  clinicDoctors,
  selectedDoctor,
  setSelectedDoctor,
  loading,
  lockedDoctor,
  lockedClinic,
  selectedClinic,
  clinicMapUrl,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  specialization,
  onSpecializationChange,
  onRefresh,
  sortFilters = FALLBACK_SORT,
  specializationFilters = FALLBACK_SPEC,
}) {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState(() => getLocalFavourites());
  const [compareList, setCompareList] = useState([]);

  const toggleFav = async (doctorId) => {
    const nowFav = toggleLocalFavourite(doctorId);
    setFavourites(getLocalFavourites());
    if (user?.role_slug === 'patient') {
      try {
        if (nowFav) await patients.addFavouriteDoctor(doctorId);
        else await patients.removeFavouriteDoctor(doctorId);
      } catch {
        /* local fallback ok */
      }
    }
    toast.success(nowFav ? 'Added to favourites' : 'Removed from favourites');
  };

  const toggleCompare = (doctorId) => {
    const id = String(doctorId);
    setCompareList((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.error('Compare up to 3 doctors');
        return prev;
      }
      return [...prev, id];
    });
  };

  const compareDoctors = useMemo(
    () => doctors.filter((d) => compareList.includes(String(d.id))),
    [doctors, compareList],
  );

  const selectDoctor = (doc) => {
    patch({ doctor_id: String(doc.id) });
    setSelectedDoctor(doc);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Choose doctor & clinic</h2>
        <p className="text-sm text-slate-600 mt-1">Search, filter and pick the best match for your care.</p>
      </div>

      <LocationDoctorsBanner
        city={city}
        hasLocation={consultationType === 'online' ? true : !!city || !!coords}
        onSelectLocation={onSelectLocation}
        hideForOnline={consultationType === 'online'}
      />

      {consultationType === 'online' && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <p className="text-sm font-semibold text-sky-900 flex items-center gap-2">
            <FaIcon icon="fa-video" />
            Online consultation — search across India
          </p>
          <p className="text-xs text-sky-800/80 mt-1">Optionally filter by state. Your fixed city location is not required.</p>
          <select
            className="input-field mt-3"
            value={onlineStateId}
            onChange={(e) => onOnlineStateChange?.(e.target.value)}
          >
            <option value="">All states</option>
            {indianStates.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative">
        <FaIcon icon="fa-magnifying-glass" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          className="input-field pl-10"
          placeholder="Search doctors, clinics, specialization…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {sortFilters.map((opt) => (
          <button
            key={opt.slug}
            type="button"
            onClick={() => onSortChange(opt.slug)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              sortBy === opt.slug
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white/80 text-slate-600 border-slate-200 hover:border-primary-300'
            }`}
          >
            <FaIcon icon={opt.icon || 'fa-star'} className="text-[10px]" />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {specializationFilters.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => onSpecializationChange(s.slug)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              specialization === s.slug
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white/70 text-slate-600 border-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {compareDoctors.length > 0 && (
        <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-3">
          <p className="text-xs font-bold text-primary-800 uppercase tracking-wide mb-2">Compare ({compareDoctors.length})</p>
          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            {compareDoctors.map((d) => (
              <div key={d.id} className="bg-white rounded-lg p-2 border border-slate-100">
                <p className="font-semibold truncate">Dr. {d.first_name} {d.last_name}</p>
                <p>★ {Number(d.rating_avg || 0).toFixed(1)} · {d.experience_years || 0}y</p>
                <p className="text-primary-700 font-bold">₹{feeForType(d, consultationType)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {consultationType === 'clinic' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Clinic</label>
          {lockedClinic && selectedClinic ? (
            <div className="glass-card border-emerald-200/60 p-4">
              <p className="font-bold text-slate-800">{selectedClinic.name}</p>
              <p className="text-sm text-slate-600 mt-1">{selectedClinic.address}</p>
              {clinicMapUrl && (
                <a href={clinicMapUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-600 mt-2 inline-flex gap-1">
                  <FaIcon icon="fa-map-location-dot" /> Map
                </a>
              )}
            </div>
          ) : (
            <select
              className="input-field"
              value={form.clinic_id}
              onChange={(e) => patch({ clinic_id: e.target.value, doctor_id: '' })}
            >
              <option value="">Choose clinic…</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.city_name ? ` — ${c.city_name}` : ''}
                  {c.distance_km != null ? ` (${c.distance_km} km)` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lockedDoctor && selectedDoctor ? (
        <ProviderCard
          doctor={selectedDoctor}
          selected
          consultationType={consultationType}
          onSelect={() => {}}
          favourite={favourites.includes(String(selectedDoctor.id))}
          onToggleFav={toggleFav}
          compareList={compareList}
          onToggleCompare={toggleCompare}
        />
      ) : consultationType === 'clinic' && form.clinic_id ? (
        <div className="space-y-2 max-h-[min(420px,55vh)] overflow-y-auto pr-1">
          {(clinicDoctors.length ? clinicDoctors : doctors).map((d) => (
            <ProviderCard
              key={d.id}
              doctor={d}
              selected={String(form.doctor_id) === String(d.id)}
              consultationType={consultationType}
              onSelect={selectDoctor}
              favourite={favourites.includes(String(d.id))}
              onToggleFav={toggleFav}
              compareList={compareList}
              onToggleCompare={toggleCompare}
            />
          ))}
          {!form.doctor_id && clinicDoctors.length === 0 && doctors.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">No doctors at this clinic — we will auto-assign from availability.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-[min(420px,55vh)] overflow-y-auto pr-1">
          {doctors.map((d) => (
            <ProviderCard
              key={d.id}
              doctor={d}
              selected={String(form.doctor_id) === String(d.id)}
              consultationType={consultationType}
              onSelect={selectDoctor}
              favourite={favourites.includes(String(d.id))}
              onToggleFav={toggleFav}
              compareList={compareList}
              onToggleCompare={toggleCompare}
            />
          ))}
          {doctors.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">
              No doctors found.{' '}
              <button type="button" className="text-primary-600 font-semibold" onClick={onRefresh}>
                Refresh
              </button>
            </p>
          )}
        </div>
      )}

      {consultationType === 'clinic' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.first_time_visit}
            onChange={(e) => patch({ first_time_visit: e.target.checked })}
            className="rounded border-slate-300"
          />
          <span className="text-sm">First-time visit at this clinic?</span>
        </label>
      )}
    </div>
  );
}

export { FALLBACK_SORT, FALLBACK_SPEC };
