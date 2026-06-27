import { useCallback, useEffect, useState } from 'react';
import FaIcon from '../FaIcon';
import SearchableLocationSelect from '../SearchableLocationSelect';
import LocationMapModal from '../LocationMapModal';
import { location, patients } from '../../services/api';
import toast from 'react-hot-toast';

const emptyAddressForm = () => ({
  label: 'Home',
  full_address: '',
  landmark: '',
  pincode: '',
  city: '',
  state_id: '',
  city_id: '',
  latitude: null,
  longitude: null,
  is_primary: false,
});

function addressesFromResponse(res) {
  const body = res?.data ?? res;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.addresses)) return body.addresses;
  return [];
}

export default function PatientAddressSection({ addresses: initialAddresses = [], onChange }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(emptyAddressForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    setAddresses(initialAddresses);
  }, [initialAddresses]);

  useEffect(() => {
    location.states().then((res) => setStates(res.data || []));
  }, []);

  useEffect(() => {
    if (form.state_id) {
      location.cities(form.state_id).then((res) => setCities(res.data || []));
    } else {
      setCities([]);
    }
  }, [form.state_id]);

  const sync = useCallback(
    (list) => {
      setAddresses(list);
      onChange?.(list);
    },
    [onChange]
  );

  const loadAddresses = () =>
    patients
      .listAddresses()
      .then((res) => sync(addressesFromResponse(res)))
      .catch((err) => toast.error(err.message || 'Could not load addresses'));

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyAddressForm(),
      is_primary: addresses.length === 0,
    });
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || 'Home',
      full_address: addr.full_address || '',
      landmark: addr.landmark || '',
      pincode: addr.pincode || '',
      city: addr.city || addr.city_name || '',
      state_id: addr.state_id ? String(addr.state_id) : '',
      city_id: addr.city_id ? String(addr.city_id) : '',
      latitude: addr.latitude ?? null,
      longitude: addr.longitude ?? null,
      is_primary: Boolean(addr.is_primary),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyAddressForm());
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    if (!form.full_address.trim()) {
      toast.error('Full address is required');
      return;
    }
    setSaving(true);
    const payload = {
      label: form.label.trim() || 'Home',
      full_address: form.full_address.trim(),
      landmark: form.landmark.trim(),
      pincode: form.pincode.trim(),
      city: form.city.trim(),
      city_id: form.city_id ? Number(form.city_id) : null,
      state_id: form.state_id ? Number(form.state_id) : null,
      latitude: form.latitude,
      longitude: form.longitude,
      is_primary: form.is_primary ? 1 : 0,
    };
    try {
      const res = editingId
        ? await patients.updateAddress(editingId, payload)
        : await patients.createAddress(payload);
      sync(addressesFromResponse(res));
      toast.success(editingId ? 'Address updated' : 'Address saved');
      resetForm();
    } catch (err) {
      toast.error(err.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  const makePrimary = async (id) => {
    try {
      const res = await patients.setPrimaryAddress(id);
      sync(addressesFromResponse(res));
      toast.success('Primary address updated');
    } catch (err) {
      toast.error(err.message || 'Could not update primary address');
    }
  };

  const removeAddress = async (addr) => {
    if (!window.confirm(`Delete "${addr.label || 'this address'}"?`)) return;
    try {
      const res = await patients.deleteAddress(addr.id);
      sync(addressesFromResponse(res));
      toast.success('Address deleted');
      if (editingId === addr.id) resetForm();
    } catch (err) {
      toast.error(err.message || 'Could not delete address');
    }
  };

  const handleMapConfirm = ({ lat, lng, address }) => {
    setForm((f) => ({
      ...f,
      latitude: lat,
      longitude: lng,
      full_address: address || f.full_address,
    }));
    setMapOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Saved addresses</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Your <strong>primary</strong> address auto-fills when you book appointments.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary text-sm inline-flex items-center gap-2 shrink-0">
          <FaIcon icon="fa-plus" /> Add address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-600">
          No saved addresses yet. Add your home or visit address for faster booking.
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <article
              key={addr.id}
              className={`rounded-xl border p-4 ${
                addr.is_primary ? 'border-primary-300 bg-primary-50/40' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{addr.label || 'Address'}</h3>
                    {addr.is_primary ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary-600 text-white">
                        Primary
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{addr.full_address}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {[addr.city || addr.city_name, addr.state_name].filter(Boolean).join(', ')}
                    {addr.pincode ? ` · ${addr.pincode}` : ''}
                  </p>
                  {addr.landmark && <p className="text-xs text-slate-500 mt-0.5">Landmark: {addr.landmark}</p>}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {!addr.is_primary && (
                    <button type="button" className="btn-outline text-xs !py-1.5" onClick={() => makePrimary(addr.id)}>
                      Set primary
                    </button>
                  )}
                  <button type="button" className="btn-outline text-xs !py-1.5" onClick={() => openEdit(addr)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-xs !py-1.5 text-red-700 border-red-200"
                    onClick={() => removeAddress(addr)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={saveAddress} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900">{editingId ? 'Edit address' : 'New address'}</h3>
            <button type="button" className="text-slate-400 hover:text-slate-600" onClick={resetForm} aria-label="Close">
              <FaIcon icon="fa-xmark" />
            </button>
          </div>

          <input
            className="input-field"
            placeholder="Label (e.g. Home, Office)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <SearchableLocationSelect
              id="patient-address-state"
              label="State"
              placeholder="Select state"
              options={states}
              value={form.state_id}
              onChange={(id) => setForm((f) => ({ ...f, state_id: id, city_id: '' }))}
            />
            <SearchableLocationSelect
              id="patient-address-city"
              label="City"
              placeholder={form.state_id ? 'Select city' : 'Select state first'}
              options={cities}
              value={form.city_id}
              onChange={(id) => {
                const city = cities.find((c) => String(c.id) === String(id));
                setForm((f) => ({
                  ...f,
                  city_id: id,
                  city: city?.name || f.city,
                }));
              }}
              disabled={!form.state_id}
            />
          </div>

          <textarea
            className="input-field"
            rows={3}
            placeholder="Full address *"
            value={form.full_address}
            onChange={(e) => setForm((f) => ({ ...f, full_address: e.target.value }))}
            required
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="input-field"
              placeholder="Landmark"
              value={form.landmark}
              onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
            />
            <input
              className="input-field"
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
            />
          </div>

          <input
            className="input-field"
            placeholder="City name (if not in list)"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />

          <button type="button" className="btn-outline text-sm inline-flex items-center gap-2" onClick={() => setMapOpen(true)}>
            <FaIcon icon="fa-map-pin" />
            Pin on map
          </button>

          {form.latitude != null && (
            <p className="text-xs text-slate-500 font-mono">
              {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
            </p>
          )}

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-primary-600"
              checked={form.is_primary}
              onChange={(e) => setForm((f) => ({ ...f, is_primary: e.target.checked }))}
            />
            Set as primary address for booking
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving…' : editingId ? 'Update address' : 'Save address'}
            </button>
            <button type="button" className="btn-outline text-sm" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <LocationMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={form.latitude}
        initialLng={form.longitude}
        onConfirm={handleMapConfirm}
      />
    </div>
  );
}
