import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { careers } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { id: 'new', label: 'New', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'reviewing', label: 'Reviewing', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'hired', label: 'Hired / Partnered', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200' },
];

const TYPE_OPTIONS = [
  { id: '', label: 'All Types' },
  { id: 'physiotherapist', label: 'Physiotherapist' },
  { id: 'clinic', label: 'Clinic Partnership' },
];

function formatDt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminCareers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  const loadApplications = useCallback(() => {
    setLoading(true);
    const params = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    careers
      .applications(params)
      .then((res) => {
        setList(res.data || []);
      })
      .catch((e) => toast.error(e.message || 'Could not load applications'))
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredList = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((item) => {
      const text = [
        item.name,
        item.email,
        item.phone,
        item.city,
        item.specialization,
        item.experience,
        item.message,
        item.meta ? JSON.stringify(item.meta) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    });
  }, [list, search]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await careers.updateStatus(id, newStatus);
      toast.success('Status updated successfully');
      setList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      if (selectedApp?.id === id) {
        setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (e) {
      toast.error(e.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(() => {
    const total = list.length;
    const physio = list.filter((i) => i.applicant_type === 'physiotherapist').length;
    const clinic = list.filter((i) => i.applicant_type === 'clinic').length;
    const newCount = list.filter((i) => i.status === 'new').length;
    return { total, physio, clinic, newCount };
  }, [list]);

  return (
    <AdminDashboardLayout title="Career & Partnership Applications">
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold uppercase">
              <FaIcon icon="fa-briefcase" className="text-indigo-600 text-base" /> Total Applications
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">{counts.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold uppercase">
              <FaIcon icon="fa-user-doctor" className="text-teal-600 text-base" /> Physiotherapists
            </div>
            <p className="text-2xl font-bold text-teal-700 mt-2">{counts.physio}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold uppercase">
              <FaIcon icon="fa-hospital" className="text-purple-600 text-base" /> Clinic Partnerships
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-2">{counts.clinic}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold uppercase">
              <FaIcon icon="fa-bell" className="text-blue-600 text-base" /> New / Pending
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-2">{counts.newCount}</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <FaIcon icon="fa-magnifying-glass" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              className="input-field pl-10 py-2.5 text-sm"
              placeholder="Search by applicant name, email, phone, city, or specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="input-field py-2 text-sm max-w-[180px]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>

            <select
              className="input-field py-2 text-sm max-w-[170px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadApplications}
              className="btn-outline py-2 px-3 text-xs inline-flex items-center gap-1.5"
            >
              <FaIcon icon="fa-arrows-rotate" /> Refresh
            </button>
          </div>
        </div>

        {/* List Table */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 animate-pulse border">
            Loading applications...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
            <FaIcon icon="fa-folder-open" className="text-4xl text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No career applications found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Experience & Specialization</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((app) => {
                    const statusObj = STATUS_OPTIONS.find((s) => s.id === app.status) || STATUS_OPTIONS[0];
                    const isClinic = app.applicant_type === 'clinic';

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          <div>{app.name}</div>
                          {app.city && <span className="text-xs font-normal text-slate-500 flex items-center gap-1 mt-0.5"><FaIcon icon="fa-location-dot" className="text-[10px] text-slate-400" /> {app.city}</span>}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                              isClinic ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-teal-50 text-teal-700 border-teal-200'
                            }`}
                          >
                            <FaIcon icon={isClinic ? 'fa-hospital' : 'fa-user-doctor'} className="text-[10px]" />
                            {isClinic ? 'Clinic Partnership' : 'Physiotherapist'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-600">
                          <div><a href={`mailto:${app.email}`} className="text-indigo-600 hover:underline">{app.email}</a></div>
                          {app.phone && <div className="text-slate-500 mt-0.5"><a href={`tel:${app.phone}`} className="hover:underline">{app.phone}</a></div>}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-600 max-w-[200px] truncate">
                          {app.specialization || app.experience ? (
                            <div>
                              {app.specialization && <span className="font-medium text-slate-700">{app.specialization}</span>}
                              {app.experience && <span className="text-slate-500 block">{app.experience} exp</span>}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDt(app.created_at)}
                        </td>
                        <td className="py-4 px-4">
                          <select
                            disabled={updatingId === app.id}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer outline-none ${statusObj.color}`}
                            value={app.status || 'new'}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="btn-outline text-xs py-1 px-2.5 inline-flex items-center gap-1"
                          >
                            <FaIcon icon="fa-eye" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Application Details Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-indigo-700 to-violet-800 text-white flex justify-between items-start shrink-0">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    {selectedApp.applicant_type === 'clinic' ? 'Clinic Partnership Application' : 'Physiotherapist Application'}
                  </span>
                  <h2 className="text-2xl font-bold mt-1">{selectedApp.name}</h2>
                  <p className="text-xs text-indigo-100 mt-1">Submitted on {formatDt(selectedApp.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <FaIcon icon="fa-xmark" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm flex-1">
                {/* Contact Info */}
                <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Email Address</span>
                    <a href={`mailto:${selectedApp.email}`} className="font-semibold text-indigo-600 hover:underline">{selectedApp.email}</a>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Phone Number</span>
                    <a href={`tel:${selectedApp.phone}`} className="font-semibold text-slate-800 hover:underline">{selectedApp.phone || '—'}</a>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">City / Location</span>
                    <span className="font-semibold text-slate-800">{selectedApp.city || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Experience</span>
                    <span className="font-semibold text-slate-800">{selectedApp.experience || '—'}</span>
                  </div>
                </div>

                {/* Specialization & Extra Metadata */}
                {selectedApp.specialization && (
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Specialization</span>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-medium text-slate-800">
                      {selectedApp.specialization}
                    </div>
                  </div>
                )}

                {selectedApp.meta && Object.keys(selectedApp.meta).length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block mb-2">Additional Information</span>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.entries(selectedApp.meta).map(([key, val]) => (
                        <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-xs text-slate-400 font-semibold uppercase block capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-slate-800">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                {selectedApp.message && (
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Applicant Message</span>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                      {selectedApp.message}
                    </div>
                  </div>
                )}

                {/* Status Selector */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Update Application Status</span>
                  <select
                    className="input-field py-1.5 px-3 text-sm font-semibold max-w-[200px]"
                    value={selectedApp.status || 'new'}
                    onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="btn-outline px-5 py-2 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
