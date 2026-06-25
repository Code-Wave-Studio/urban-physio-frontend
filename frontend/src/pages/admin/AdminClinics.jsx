import { useEffect, useMemo, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import GlassModal, { GlassModalBody, GlassModalFooter, GlassModalHeader } from '../../components/GlassModal';
import LocationMapModal from '../../components/LocationMapModal';
import SearchableLocationSelect from '../../components/SearchableLocationSelect';
import ClinicLogo from '../../components/ClinicLogo';
import ClinicLogoUpload from '../../components/ClinicLogoUpload';
import ClinicGalleryUpload from '../../components/clinic/ClinicGalleryUpload';
import {
  ClinicOpeningHoursFields,
  ClinicLocationFields,
  ClinicProfileDetailsFields,
  ClinicSocialLinksFields,
  ClinicStatisticsFields,
  ClinicTagListFields,
} from '../../components/clinic/ClinicProfileFormSections';
import {
  buildClinicPayload,
  clinicRecordToForm,
  emptyClinicForm,
} from '../../utils/clinicProfileUtils';
import { admin, doctors as doctorsApi, location } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

function StatusBadge({ status }) {
  const s = status || 'pending';
  return <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[s] || STATUS_STYLE.pending}`}>{s}</span>;
}

function ClinicRow({ clinic, onApprove, onReject, onEdit, onDelete, onManageDoctors }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/50 hover:bg-white/70 transition p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <ClinicLogo clinic={clinic} size="lg" />
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900 truncate">{clinic.name}</p>
            <StatusBadge status={clinic.approval_status} />
            {!clinic.is_active && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{clinic.address}</p>
          <p className="text-xs text-slate-500 mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {clinic.city_name && (
              <span className="inline-flex items-center gap-1">
                <FaIcon icon="fa-location-dot" className="text-slate-400" /> {clinic.city_name}
                {clinic.state_name ? `, ${clinic.state_name}` : ''}
              </span>
            )}
            {clinic.phone && (
              <span className="inline-flex items-center gap-1">
                <FaIcon icon="fa-phone" className="text-slate-400" /> {clinic.phone}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <FaIcon icon="fa-user-doctor" className="text-slate-400" /> {clinic.doctor_count || 0} doctors
            </span>
          </p>
          {clinic.submitted_by_email && (
            <p className="text-xs text-slate-500 mt-2">
              Submitted by:{' '}
              <span className="font-medium text-slate-700">
                Dr. {clinic.submitted_by_first_name} {clinic.submitted_by_last_name}
              </span>{' '}
              · {clinic.submitted_by_email}
            </p>
          )}
          {clinic.approval_status === 'rejected' && clinic.rejection_reason && (
            <p className="text-xs text-red-700 mt-2">
              <span className="font-semibold">Reason:</span> {clinic.rejection_reason}
            </p>
          )}
        </div>
        </div>

        <div className="admin-table-scroll flex flex-nowrap md:flex-wrap gap-2 md:justify-end shrink-0 pb-1 md:pb-0">
          <button type="button" className="btn-outline text-sm inline-flex items-center gap-1.5" onClick={() => onManageDoctors(clinic)}>
            <FaIcon icon="fa-user-doctor" />
            Assign Doctors
          </button>
          <button type="button" className="btn-outline text-sm" onClick={() => onEdit(clinic)}>
            Edit
          </button>
          {clinic.approval_status === 'pending' && (
            <>
              <button type="button" className="btn-primary text-sm bg-emerald-600 hover:bg-emerald-700" onClick={() => onApprove(clinic)}>
                Approve
              </button>
              <button type="button" className="btn-outline text-sm border-amber-200 text-amber-800 hover:bg-amber-50" onClick={() => onReject(clinic)}>
                Reject
              </button>
            </>
          )}
          <button type="button" className="btn-outline text-sm border-red-200 text-red-700 hover:bg-red-50" onClick={() => onDelete(clinic)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminFormSection({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-slate-50/80 border-b border-slate-100"
      >
        <span className="font-semibold text-slate-800 text-sm inline-flex items-center gap-2">
          <FaIcon icon={icon} className="text-primary-600" />
          {title}
        </span>
        <FaIcon icon={open ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-slate-400 text-xs" />
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

function ClinicFormModal({ open, onClose, initial, onSave }) {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateId, setStateId] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => emptyClinicForm());

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSocial = (key, value) =>
    setForm((f) => ({ ...f, social_links: { ...f.social_links, [key]: value } }));
  const setHours = (key, value) => {
    const slots = value.trim()
      ? value.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    setForm((f) => ({
      ...f,
      opening_hours: { ...f.opening_hours, [key]: slots },
    }));
  };

  useEffect(() => {
    location.states().then((res) => setStates(res.data || []));
  }, []);

  useEffect(() => {
    if (stateId) location.cities(stateId).then((res) => setCities(res.data || []));
    else setCities([]);
  }, [stateId]);

  useEffect(() => {
    if (!open) return;
    if (!initial?.id) {
      setForm(emptyClinicForm());
      setStateId('');
      return;
    }
    setLoading(true);
    admin
      .clinicGet(initial.id)
      .then((res) => {
        const c = res.data ?? res;
        setForm(clinicRecordToForm(c));
        if (c.state_id) setStateId(String(c.state_id));
        else if (c.city_id && states.length) {
          const city = cities.find((x) => String(x.id) === String(c.city_id));
          if (city?.state_id) setStateId(String(city.state_id));
        }
      })
      .catch(() => toast.error('Could not load clinic profile'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  const submit = async (e) => {
    e.preventDefault();
    await onSave(buildClinicPayload(form));
  };

  return (
    <GlassModal open={open} onClose={onClose} size="xl" titleId="admin-clinic-form">
      <form onSubmit={submit} className="flex flex-col min-h-0 flex-1">
        <GlassModalHeader
          titleId="admin-clinic-form"
          title={initial?.id ? 'Edit clinic profile' : 'Create clinic'}
          subtitle="Manage all clinic content — banner photos, hours, services, stats and more."
          icon="fa-hospital"
          accent="primary"
          onClose={onClose}
        />
        <GlassModalBody className="space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center text-slate-500">
              <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
              <p className="text-sm mt-3">Loading clinic…</p>
            </div>
          ) : (
            <>
              <AdminFormSection title="Basic details" icon="fa-hospital">
                <ClinicLogoUpload
                  logo={form.logo}
                  name={form.name}
                  clinicId={initial?.id || null}
                  onUploaded={(url) => set('logo', url)}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Clinic name</label>
                    <input className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input className="input-field" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea className="input-field" rows={3} value={form.address} onChange={(e) => set('address', e.target.value)} required />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <SearchableLocationSelect
                    label="State"
                    placeholder="Select state"
                    options={states}
                    value={stateId}
                    onChange={(id) => {
                      setStateId(id);
                      set('city_id', '');
                    }}
                  />
                  <SearchableLocationSelect
                    label="City"
                    placeholder={stateId ? 'Select city' : 'Select state first'}
                    options={cities}
                    value={form.city_id || ''}
                    onChange={(id) => set('city_id', id)}
                    disabled={!stateId}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                    <input className="input-field" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email (optional)</label>
                    <input type="email" className="input-field" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
                  </div>
                </div>
                <ClinicLocationFields form={form} set={set} onPickMap={() => setMapOpen(true)} />
              </AdminFormSection>

              <AdminFormSection title="About, cover & website" icon="fa-circle-info">
                <ClinicProfileDetailsFields form={form} set={set} setHours={setHours} />
              </AdminFormSection>

              <AdminFormSection title="Opening hours" icon="fa-clock">
                <ClinicOpeningHoursFields form={form} setHours={setHours} />
              </AdminFormSection>

              <AdminFormSection title="Social media" icon="fa-share-nodes" defaultOpen={false}>
                <ClinicSocialLinksFields form={form} setSocial={setSocial} />
              </AdminFormSection>

              <AdminFormSection title="Services & equipment" icon="fa-hand-holding-medical" defaultOpen={false}>
                <ClinicTagListFields form={form} set={set} />
              </AdminFormSection>

              <AdminFormSection title="Clinic statistics" icon="fa-chart-simple" defaultOpen={false}>
                <ClinicStatisticsFields form={form} set={set} />
              </AdminFormSection>

              <AdminFormSection title="Banner photos (max 10)" icon="fa-images">
                <p className="text-xs text-slate-500 -mt-1 mb-2">
                  These photos auto-scroll on the clinic profile banner. Cover image shows first.
                </p>
                <ClinicGalleryUpload
                  images={form.image_urls}
                  clinicId={initial?.id || null}
                  onChange={(urls) => set('image_urls', urls)}
                  max={10}
                />
              </AdminFormSection>
            </>
          )}
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-outline text-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary text-sm ml-auto" disabled={loading}>
            Save
          </button>
        </GlassModalFooter>
      </form>

      <LocationMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={form.latitude}
        initialLng={form.longitude}
        onConfirm={({ lat, lng }) => {
          set('latitude', lat);
          set('longitude', lng);
        }}
      />
    </GlassModal>
  );
}

function ClinicDoctorsModal({ open, onClose, clinic }) {
  const [list, setList] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDoctorId, setAddDoctorId] = useState('');
  const [managerUpdating, setManagerUpdating] = useState(null);

  const load = async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const res = await admin.clinicDoctors(clinic.id);
      setList(res.data || []);
      const dres = await doctorsApi.list({ verified: 0 });
      setDoctorList(dres.data || []);
    } catch (e) {
      toast.error(e.message || 'Could not load clinic doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clinic?.id]);

  const attach = async () => {
    if (!addDoctorId) return;
    try {
      await admin.clinicAttachDoctor(clinic.id, parseInt(addDoctorId, 10), 0);
      toast.success('Doctor attached');
      setAddDoctorId('');
      load();
    } catch (e) {
      toast.error(e.message || 'Attach failed');
    }
  };

  const toggleManager = async (doctorId, isCurrentlyManager) => {
    setManagerUpdating(doctorId);
    try {
      if (isCurrentlyManager) {
        await admin.clinicClearManager(clinic.id);
        toast.success('Full edit access removed');
      } else {
        await admin.clinicSetManager(clinic.id, doctorId);
        toast.success('Full edit access granted');
      }
      load();
    } catch (e) {
      toast.error(e.message || 'Could not update clinic manager');
    } finally {
      setManagerUpdating(null);
    }
  };

  const detach = async (doctorId) => {
    try {
      await admin.clinicDetachDoctor(clinic.id, doctorId);
      toast.success('Doctor detached');
      load();
    } catch (e) {
      toast.error(e.message || 'Detach failed');
    }
  };

  return (
    <GlassModal open={open} onClose={onClose} size="lg" titleId="clinic-doctors-modal">
      <GlassModalHeader
        titleId="clinic-doctors-modal"
        title={clinic?.name || 'Assign doctors'}
        subtitle="Attach doctors to this clinic. Tick Full edit access for one doctor who can fully manage the clinic."
        icon="fa-user-doctor"
        accent="primary"
        onClose={onClose}
      />
      <GlassModalBody className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white/60 p-4">
          <p className="font-semibold text-slate-800 text-sm mb-2">Attach doctor</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select className="input-field" value={addDoctorId} onChange={(e) => setAddDoctorId(e.target.value)}>
              <option value="">Select doctor</option>
              {doctorList.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.first_name} {d.last_name} — {d.specialization || '—'}
                </option>
              ))}
            </select>
            <button type="button" className="btn-primary text-sm" onClick={attach} disabled={!addDoctorId}>
              Attach
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse h-24 bg-slate-200 rounded-xl" />
        ) : list.length === 0 ? (
          <p className="text-sm text-slate-600">No doctors attached yet.</p>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white/60">
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <span>Doctor</span>
              <span className="text-center w-36">Full edit access</span>
              <span className="text-right w-20">Action</span>
            </div>
            {list.map((d) => (
              <div
                key={d.doctor_id}
                className={`grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 sm:items-center p-4 border-b border-slate-100 last:border-0 ${
                  d.is_clinic_manager ? 'bg-emerald-50/60' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    Dr. {d.first_name} {d.last_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{d.specialization || '—'} · {d.email}</p>
                </div>

                <label
                  className={`inline-flex items-center justify-center sm:justify-start gap-2.5 cursor-pointer select-none rounded-xl border px-3 py-2.5 w-full sm:w-36 transition ${
                    d.is_clinic_manager
                      ? 'border-emerald-300 bg-emerald-100/80 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40'
                  } ${managerUpdating === d.doctor_id ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={!!d.is_clinic_manager}
                    disabled={managerUpdating === d.doctor_id}
                    onChange={() => toggleManager(d.doctor_id, !!d.is_clinic_manager)}
                  />
                  <span className="text-xs font-semibold whitespace-nowrap">Full edit access</span>
                </label>

                <div className="flex sm:justify-end shrink-0">
                  <button
                    type="button"
                    className="btn-outline text-sm border-red-200 text-red-700 hover:bg-red-50 w-full sm:w-auto"
                    onClick={() => detach(d.doctor_id)}
                    disabled={managerUpdating === d.doctor_id}
                  >
                    Detach
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassModalBody>
    </GlassModal>
  );
}

export default function AdminClinics() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editClinic, setEditClinic] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectClinic, setRejectClinic] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [doctorsOpen, setDoctorsOpen] = useState(false);
  const [doctorsClinic, setDoctorsClinic] = useState(null);

  const load = () => {
    setLoading(true);
    admin
      .clinics({ ...(status ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}) })
      .then((res) => setList(res.data || []))
      .catch((e) => toast.error(e.message || 'Could not load clinics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  const stats = useMemo(() => {
    return {
      total: list.length,
      pending: list.filter((c) => c.approval_status === 'pending').length,
      approved: list.filter((c) => c.approval_status === 'approved').length,
      rejected: list.filter((c) => c.approval_status === 'rejected').length,
    };
  }, [list]);

  const approve = async (c) => {
    try {
      await admin.clinicApprove(c.id);
      toast.success('Clinic approved');
      load();
    } catch (e) {
      toast.error(e.message || 'Approve failed');
    }
  };

  const reject = (c) => {
    setRejectClinic(c);
    setRejectReason('');
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectClinic) return;
    if (!rejectReason.trim()) {
      toast.error('Please add a rejection reason');
      return;
    }
    try {
      await admin.clinicReject(rejectClinic.id, rejectReason.trim());
      toast.success('Clinic rejected');
      setRejectOpen(false);
      setRejectClinic(null);
      load();
    } catch (e) {
      toast.error(e.message || 'Reject failed');
    }
  };

  const openEdit = (c) => {
    setEditClinic(c || { name: '', address: '', city_id: '', phone: '', email: '' });
    setEditOpen(true);
  };

  const saveClinic = async (payload) => {
    try {
      if (editClinic?.id) {
        await admin.clinicUpdate(editClinic.id, payload);
        toast.success('Clinic updated');
      } else {
        await admin.clinicCreate(payload);
        toast.success('Clinic created');
      }
      setEditOpen(false);
      setEditClinic(null);
      load();
    } catch (e) {
      toast.error(e.message || 'Save failed');
    }
  };

  const del = async (c) => {
    if (!window.confirm('Delete this clinic?')) return;
    try {
      await admin.clinicDelete(c.id);
      toast.success('Clinic deleted');
      load();
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const manageDoctors = (c) => {
    setDoctorsClinic(c);
    setDoctorsOpen(true);
  };

  return (
    <AdminDashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Clinics</h1>
          <p className="text-sm text-slate-600 mt-1">Approve doctor-submitted clinics, manage details, and attach doctors.</p>
        </div>
        <button type="button" className="btn-primary text-sm inline-flex items-center gap-2" onClick={() => openEdit(null)}>
          <FaIcon icon="fa-plus" /> Create clinic
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          ['Total', stats.total, 'text-slate-800'],
          ['Pending', stats.pending, 'text-amber-700'],
          ['Approved', stats.approved, 'text-emerald-700'],
          ['Rejected', stats.rejected, 'text-red-700'],
        ].map(([label, val, color]) => (
          <div key={label} className="card !p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="card !p-4 mb-6 space-y-3">
        <div className="relative">
          <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clinic name, address, phone..." />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['', 'All'],
            ['pending', 'Pending'],
            ['approved', 'Approved'],
            ['rejected', 'Rejected'],
          ].map(([id, label]) => (
            <button
              key={id || 'all'}
              type="button"
              onClick={() => setStatus(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                status === id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
          <button type="button" className="ml-auto text-xs text-slate-600 hover:text-primary-700" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card text-center py-16">
          <FaIcon icon="fa-hospital" className="text-4xl text-slate-300 mb-3" />
          <p className="text-slate-700 font-semibold">No clinics found</p>
          <p className="text-sm text-slate-500 mt-1">Try changing filters or create a clinic.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <ClinicRow
              key={c.id}
              clinic={c}
              onApprove={approve}
              onReject={reject}
              onEdit={openEdit}
              onDelete={del}
              onManageDoctors={manageDoctors}
            />
          ))}
        </div>
      )}

      <ClinicFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editClinic || {}}
        onSave={saveClinic}
      />

      <GlassModal open={rejectOpen} onClose={() => setRejectOpen(false)} size="md" titleId="reject-clinic">
        <GlassModalHeader
          titleId="reject-clinic"
          title={rejectClinic ? `Reject: ${rejectClinic.name}` : 'Reject clinic'}
          subtitle="Add a clear reason. Doctor will see this and can resubmit updates."
          icon="fa-ban"
          accent="primary"
          onClose={() => setRejectOpen(false)}
        />
        <GlassModalBody className="space-y-3">
          <textarea className="input-field" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." />
        </GlassModalBody>
        <GlassModalFooter>
          <button type="button" className="btn-outline" onClick={() => setRejectOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn-primary ml-auto bg-red-600 hover:bg-red-700" onClick={confirmReject}>
            Reject
          </button>
        </GlassModalFooter>
      </GlassModal>

      <ClinicDoctorsModal open={doctorsOpen} onClose={() => setDoctorsOpen(false)} clinic={doctorsClinic} />
    </AdminDashboardLayout>
  );
}

