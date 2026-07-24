import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import ClinicLogo from '../../components/ClinicLogo';
import { doctors } from '../../services/api';
import { DOCTOR_NAV } from '../../constants/doctorNav';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  under_review: 'bg-sky-100 text-sky-800 border-sky-200',
};

const TABS = [
  { id: 'mine', label: 'My clinics', icon: 'fa-hospital' },
  { id: 'find', label: 'Find & join', icon: 'fa-magnifying-glass' },
  { id: 'invites', label: 'Invitations', icon: 'fa-envelope' },
  { id: 'requests', label: 'My requests', icon: 'fa-inbox' },
];

function StatusBadge({ status }) {
  const s = status || 'pending';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[s] || STATUS_STYLE.pending}`}>
      {String(s).replace('_', ' ')}
    </span>
  );
}

export default function DoctorClinics() {
  const [tab, setTab] = useState('mine');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [invites, setInvites] = useState([]);
  const [requests, setRequests] = useState([]);
  const [joinMessage, setJoinMessage] = useState({});
  const [busyId, setBusyId] = useState(null);

  const loadMine = useCallback(() => {
    setLoading(true);
    doctors
      .clinics()
      .then((res) => setList(res.data || []))
      .catch((e) => toast.error(e.message || 'Could not load clinics'))
      .finally(() => setLoading(false));
  }, []);

  const loadInvites = useCallback(() => {
    doctors
      .clinicInvites()
      .then((res) => setInvites(res.data || res || []))
      .catch(() => setInvites([]));
  }, []);

  const loadRequests = useCallback(() => {
    doctors
      .clinicJoinRequests()
      .then((res) => setRequests(res.data || res || []))
      .catch(() => setRequests([]));
  }, []);

  useEffect(() => {
    loadMine();
    loadInvites();
    loadRequests();
  }, [loadMine, loadInvites, loadRequests]);

  const filtered = useMemo(() => {
    if (!filter) return list;
    return list.filter((c) => String(c.approval_status) === filter);
  }, [list, filter]);

  const search = async (e) => {
    e?.preventDefault?.();
    setSearching(true);
    try {
      const res = await doctors.clinicNetworkSearch({ q: query.trim() });
      setSearchResults(res.data || res || []);
    } catch (err) {
      toast.error(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const requestJoin = async (clinicId) => {
    setBusyId(`join-${clinicId}`);
    try {
      await doctors.clinicRequestJoin({
        clinic_id: clinicId,
        message: joinMessage[clinicId] || '',
      });
      toast.success('Join request sent — waiting for clinic approval');
      setJoinMessage((m) => ({ ...m, [clinicId]: '' }));
      loadRequests();
      setTab('requests');
    } catch (err) {
      toast.error(err.message || 'Could not send request');
    } finally {
      setBusyId(null);
    }
  };

  const cancelRequest = async (id) => {
    setBusyId(`cancel-${id}`);
    try {
      await doctors.clinicCancelJoinRequest(id);
      toast.success('Request cancelled');
      loadRequests();
    } catch (err) {
      toast.error(err.message || 'Cancel failed');
    } finally {
      setBusyId(null);
    }
  };

  const respondInvite = async (token, accept) => {
    setBusyId(`inv-${token}`);
    try {
      await doctors.clinicRespondInvite(token, accept);
      toast.success(accept ? 'Joined clinic' : 'Invitation declined');
      loadInvites();
      loadMine();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const leaveClinic = async (clinicId, name) => {
    if (!window.confirm(`Leave “${name}”? You can request to join again later.`)) return;
    setBusyId(`leave-${clinicId}`);
    try {
      await doctors.clinicLeave(clinicId);
      toast.success('Left clinic');
      loadMine();
    } catch (err) {
      toast.error(err.message || 'Could not leave');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Clinics</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage clinics you own, join approved clinics, and respond to invitations.
          </p>
        </div>
        <Link to="/doctor/clinics/new" className="btn-primary text-sm inline-flex items-center gap-2">
          <FaIcon icon="fa-plus" />
          Add clinic
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition ${
              tab === t.id
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                : 'bg-white/70 text-slate-600 border border-slate-200 hover:border-primary-300'
            }`}
          >
            <FaIcon icon={t.icon} />
            {t.label}
            {t.id === 'invites' && invites.length > 0 && (
              <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-white/20 text-[10px] font-bold">
                {invites.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'mine' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
            {[
              ['', 'All'],
              ['pending', 'Pending'],
              ['approved', 'Approved'],
              ['rejected', 'Rejected'],
            ].map(([id, label]) => (
              <button
                key={id || 'all'}
                type="button"
                onClick={() => setFilter(id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white/70 text-slate-600 border border-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
            <button type="button" className="shrink-0 ml-auto text-xs text-primary-600 font-semibold hover:underline px-2" onClick={loadMine}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card text-center py-12 md:py-16 px-6">
              <FaIcon icon="fa-hospital" className="text-4xl text-slate-300 mb-3" />
              <p className="text-slate-700 font-semibold">No clinics found</p>
              <p className="text-sm text-slate-500 mt-1">Add your own clinic or join an existing one.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-5">
                <Link to="/doctor/clinics/new" className="btn-primary text-sm">
                  Add clinic
                </Link>
                <button type="button" className="btn-outline text-sm" onClick={() => setTab('find')}>
                  Find & join
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((c) => (
                <div key={c.id} className="glass-card !p-4 md:!p-5 border border-white/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0">
                      <ClinicLogo clinic={c} size="lg" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900 truncate">{c.name}</p>
                          {c.is_assigned && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200 font-semibold">
                              Assigned
                            </span>
                          )}
                          {c.is_owner && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-semibold">
                              Your clinic
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{c.address}</p>
                        <p className="text-xs text-slate-500 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                          {c.city_name && (
                            <span className="inline-flex items-center gap-1">
                              <FaIcon icon="fa-location-dot" className="text-slate-400" /> {c.city_name}
                            </span>
                          )}
                          {c.phone && (
                            <span className="inline-flex items-center gap-1">
                              <FaIcon icon="fa-phone" className="text-slate-400" /> {c.phone}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={c.approval_status} />
                  </div>

                  {c.approval_status === 'rejected' && c.rejection_reason && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                      <p className="font-semibold mb-1">Rejected</p>
                      <p className="text-red-800">{c.rejection_reason}</p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link to="/doctor/clinic-availability" className="btn-outline text-sm inline-flex items-center gap-2">
                      <FaIcon icon="fa-calendar-days" />
                      Set availability
                    </Link>
                    <Link to={`/doctor/clinics/new?edit=${c.id}`} className="btn-outline text-sm inline-flex items-center gap-2">
                      <FaIcon icon="fa-pen" />
                      {c.can_edit !== false ? (c.approval_status === 'approved' ? 'Edit profile' : 'Edit') : 'View'}
                    </Link>
                    {c.is_assigned && !c.is_owner && (
                      <button
                        type="button"
                        className="btn-outline text-sm text-rose-600 border-rose-200"
                        disabled={busyId === `leave-${c.id}`}
                        onClick={() => leaveClinic(c.id, c.name)}
                      >
                        Leave
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'find' && (
        <div className="space-y-4">
          <form onSubmit={search} className="glass-card !p-4 flex flex-col sm:flex-row gap-3">
            <input
              className="input-field flex-1"
              placeholder="Search approved clinics by name, city, address…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={searching}>
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>

          <div className="grid md:grid-cols-2 gap-4">
            {searchResults.map((c) => {
              const already = list.some((m) => Number(m.id) === Number(c.id));
              const pendingReq = requests.some(
                (r) => Number(r.clinic_id) === Number(c.id) && r.status === 'pending'
              );
              return (
                <div key={c.id} className="glass-card !p-4 space-y-3">
                  <div className="flex gap-3">
                    <ClinicLogo clinic={c} size="lg" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {c.city_name || 'India'}
                        {c.state_name ? `, ${c.state_name}` : ''} · {c.doctor_count || 0} doctors
                      </p>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{c.address}</p>
                    </div>
                  </div>
                  {already ? (
                    <p className="text-xs font-semibold text-emerald-700">Already linked</p>
                  ) : pendingReq ? (
                    <p className="text-xs font-semibold text-amber-700">Join request pending</p>
                  ) : (
                    <>
                      <input
                        className="input-field text-sm"
                        placeholder="Optional message to clinic"
                        value={joinMessage[c.id] || ''}
                        onChange={(e) => setJoinMessage((m) => ({ ...m, [c.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn-primary text-sm w-full"
                        disabled={busyId === `join-${c.id}`}
                        onClick={() => requestJoin(c.id)}
                      >
                        Request to join
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {!searching && searchResults.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-8">Search for a clinic to request joining.</p>
          )}
        </div>
      )}

      {tab === 'invites' && (
        <div className="space-y-3">
          {invites.map((inv) => (
            <div key={inv.id || inv.token} className="glass-card !p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{inv.clinic_name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {inv.city_name || '—'} · {inv.message || 'You were invited to join this clinic'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary !py-1.5 text-sm"
                  disabled={busyId === `inv-${inv.token}`}
                  onClick={() => respondInvite(inv.token, true)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn-outline !py-1.5 text-sm"
                  disabled={busyId === `inv-${inv.token}`}
                  onClick={() => respondInvite(inv.token, false)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
          {!invites.length && (
            <div className="glass-card text-center py-12 text-slate-500 text-sm">No pending invitations</div>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="glass-card !p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{r.clinic_name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {r.city_name || '—'} · <StatusBadge status={r.status} />
                  {r.message ? ` · ${r.message}` : ''}
                </p>
              </div>
              {r.status === 'pending' && (
                <button
                  type="button"
                  className="btn-outline !py-1.5 text-sm text-rose-600"
                  disabled={busyId === `cancel-${r.id}`}
                  onClick={() => cancelRequest(r.id)}
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
          {!requests.length && (
            <div className="glass-card text-center py-12 text-slate-500 text-sm">No join requests yet</div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
