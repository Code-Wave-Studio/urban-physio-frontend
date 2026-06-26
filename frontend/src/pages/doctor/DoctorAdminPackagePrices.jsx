import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { doctors } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import toast from 'react-hot-toast';

export default function DoctorAdminPackagePrices() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    doctors.adminPackagePrices
      .list()
      .then((res) => setList(res.data || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (row) => {
    const price = Number(row._price ?? row.price ?? row.catalog_price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Enter a valid price');
      return;
    }
    setSavingId(row.package_id);
    try {
      await doctors.adminPackagePrices.update(row.package_id, {
        price,
        mrp_price: Number(row._mrp ?? row.mrp_price ?? price),
        is_enabled: row._enabled ?? row.is_enabled ?? 1,
      });
      toast.success('Price saved');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not save');
    } finally {
      setSavingId(null);
    }
  };

  const patchRow = (packageId, fields) => {
    setList((rows) =>
      rows.map((r) => (r.package_id === packageId ? { ...r, ...fields } : r))
    );
  };

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Platform package pricing</h1>
        <p className="text-slate-600 text-sm mt-1 max-w-2xl">
          Admin-created packages are shared across all doctors. You cannot edit package details — only set your own
          price for patients booking with you.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <div className="glass-card p-8 text-center text-slate-600">No admin packages available yet.</div>
      ) : (
        <div className="space-y-4">
          {list.map((row) => (
            <article key={row.package_id} className="glass-card p-4 md:p-5">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-slate-900">{row.name}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-sky-800 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-full">
                      Admin package
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{row.short_description || '—'}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {row.total_sessions} sessions · {row.duration_days} days · {row.consultation_type}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Suggested catalog price: ₹{Number(row.catalog_price || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[20rem]">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Your price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      className="input-field !py-2 mt-1"
                      value={row._price ?? row.price ?? row.catalog_price ?? ''}
                      onChange={(e) => patchRow(row.package_id, { _price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">MRP (₹)</label>
                    <input
                      type="number"
                      min={0}
                      className="input-field !py-2 mt-1"
                      value={row._mrp ?? row.mrp_price ?? row.catalog_price ?? ''}
                      onChange={(e) => patchRow(row.package_id, { _mrp: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col justify-end gap-2">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-primary-600"
                        checked={Boolean(Number(row._enabled ?? row.is_enabled ?? 1))}
                        onChange={(e) => patchRow(row.package_id, { _enabled: e.target.checked ? 1 : 0 })}
                      />
                      Offer to patients
                    </label>
                    <button
                      type="button"
                      className="btn-primary text-sm !py-2"
                      disabled={savingId === row.package_id}
                      onClick={() => save(row)}
                    >
                      {savingId === row.package_id ? 'Saving…' : 'Save price'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-6 flex items-start gap-2">
        <FaIcon icon="fa-circle-info" className="mt-0.5 shrink-0" />
        To create your own packages with custom names and sessions, go to My packages (requires admin approval).
      </p>
    </DashboardLayout>
  );
}
