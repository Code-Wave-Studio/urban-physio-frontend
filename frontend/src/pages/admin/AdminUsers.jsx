import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import LocationMapModal from '../../components/LocationMapModal';
import GlassModal, { GlassModalHeader } from '../../components/GlassModal';
import FaIcon from '../../components/FaIcon';
import AdminUserListRow from '../../components/admin/AdminUserListRow';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const ROLE_TABS = [
  { id: '', label: 'All users' },
  { id: 'doctor', label: 'Doctors' },
  { id: 'patient', label: 'Patients' },
  { id: 'admin', label: 'Admins' },
];

const STATUS_TABS = [
  { id: '', label: 'Any status' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
];

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [unverifiedOnly, setUnverifiedOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [locDoctor, setLocDoctor] = useState(null);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.status = statusFilter;
    if (search.trim()) params.search = search.trim();
    if (verifiedOnly) params.verified = '1';
    if (unverifiedOnly) params.verified = '0';

    admin
      .users(params)
      .then((res) => setUsers(res.data || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [roleFilter, statusFilter, search, verifiedOnly, unverifiedOnly]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    const next = {};
    if (roleFilter) next.role = roleFilter;
    if (search.trim()) next.search = search.trim();
    setSearchParams(next, { replace: true });
  }, [roleFilter, search, setSearchParams]);

  const stats = useMemo(() => {
    const doctors = users.filter((u) => u.role_slug === 'doctor');
    return {
      total: users.length,
      doctors: doctors.length,
      patients: users.filter((u) => u.role_slug === 'patient').length,
      inactive: users.filter((u) => !u.is_active).length,
      unverified: doctors.filter((u) => u.doctor_id && !Number(u.is_verified)).length,
    };
  }, [users]);

  const toggleExpand = async (user) => {
    if (expandedId === user.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(user.id);
    if (!detailsCache[user.id]) {
      setDetailLoadingId(user.id);
      try {
        const res = await admin.userDetail(user.id);
        setDetailsCache((c) => ({ ...c, [user.id]: res.data }));
      } catch {
        toast.error('Could not load user details');
      } finally {
        setDetailLoadingId(null);
      }
    }
  };

  const refreshUserDetail = async (userId) => {
    const res = await admin.userDetail(userId);
    setDetailsCache((c) => ({ ...c, [userId]: res.data }));
  };

  const approveDoctorServices = async (doctorId, serviceType = null) => {
    setActionLoading(true);
    try {
      await admin.approveDoctorServices(doctorId, serviceType ? { service_type: serviceType } : {});
      toast.success(serviceType ? 'Service approved' : 'All pending services approved');
      if (expandedId) await refreshUserDetail(expandedId);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const rejectDoctorServices = async (doctorId, serviceType = null) => {
    const reason = window.prompt('Rejection reason (optional):', 'Not approved at this time');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await admin.rejectDoctorServices(doctorId, {
        ...(serviceType ? { service_type: serviceType } : {}),
        reason: reason || 'Not approved',
      });
      toast.success('Service change rejected');
      if (expandedId) await refreshUserDetail(expandedId);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const verifyDoctor = async (u, verified) => {
    if (!u.doctor_id) return;
    setActionLoading(true);
    try {
      await admin.verifyDoctor(u.doctor_id, verified);
      toast.success(verified ? 'Doctor verified' : 'Verification revoked');
      setDetailsCache((c) => {
        const next = { ...c };
        delete next[u.id];
        return next;
      });
      load();
      if (expandedId === u.id) {
        const res = await admin.userDetail(u.id);
        setDetailsCache((c) => ({ ...c, [u.id]: res.data }));
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActive = async (u) => {
    setActionLoading(true);
    try {
      await admin.updateUserStatus(u.id, u.is_active ? 0 : 1);
      toast.success(u.is_active ? 'Account deactivated' : 'Account activated');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openLocation = (u) => {
    setLocDoctor(u);
    setAddress(u.address || '');
    setLat(u.latitude ? parseFloat(u.latitude) : null);
    setLng(u.longitude ? parseFloat(u.longitude) : null);
  };

  const saveLocation = async () => {
    if (!locDoctor?.doctor_id) return;
    try {
      await admin.updateDoctorLocation(locDoctor.doctor_id, {
        address,
        latitude: lat,
        longitude: lng,
      });
      toast.success('Doctor location updated');
      setLocDoctor(null);
      setDetailsCache((c) => {
        const next = { ...c };
        delete next[locDoctor.id];
        return next;
      });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Manage Users</h1>
        <p className="text-slate-600 text-sm mt-1">
          View full profiles, verify doctors, and manage accounts. Click a row to expand all details.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          ['Total', stats.total, 'fa-users', 'text-slate-800'],
          ['Doctors', stats.doctors, 'fa-user-doctor', 'text-violet-600'],
          ['Patients', stats.patients, 'fa-user-injured', 'text-sky-600'],
          ['Unverified', stats.unverified, 'fa-clock', 'text-amber-600'],
          ['Inactive', stats.inactive, 'fa-ban', 'text-red-600'],
        ].map(([label, val, icon, color]) => (
          <div key={label} className="card !p-4">
            <div className="flex items-center gap-2">
              <FaIcon icon={icon} className={`${color} opacity-80`} />
              <p className="text-xs text-slate-500">{label}</p>
            </div>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card mb-6 space-y-4 !p-4">
        <div className="relative">
          <FaIcon icon="fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 text-sm" />
          <input
            type="search"
            className="input-field pl-10"
            placeholder="Search name, email, phone, specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {ROLE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setRoleFilter(t.id);
                setVerifiedOnly(false);
                setUnverifiedOnly(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                roleFilter === t.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatusFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === t.id ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
          {(roleFilter === 'doctor' || roleFilter === '') && (
            <>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <button
                type="button"
                onClick={() => {
                  setUnverifiedOnly(false);
                  setVerifiedOnly((v) => !v);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  verifiedOnly ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                Verified only
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerifiedOnly(false);
                  setUnverifiedOnly((v) => !v);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  unverifiedOnly ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                Pending verification
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-16">
          <FaIcon icon="fa-users-slash" className="text-4xl text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No users match your filters</p>
          <p className="text-sm text-slate-500 mt-1">Try changing search or role filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 px-1">
            Showing {users.length} user{users.length !== 1 ? 's' : ''} — click to expand full profile
          </p>
          {users.map((u) => (
            <AdminUserListRow
              key={u.id}
              user={u}
              expanded={expandedId === u.id}
              onToggle={() => toggleExpand(u)}
              detail={detailsCache[u.id]}
              detailLoading={detailLoadingId === u.id}
              onVerify={(user) => verifyDoctor(user, 1)}
              onRevokeVerify={(user) => verifyDoctor(user, 0)}
              onToggleActive={toggleActive}
              onOpenLocation={openLocation}
              onApproveServices={approveDoctorServices}
              onRejectServices={rejectDoctorServices}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      <GlassModal open={!!locDoctor} onClose={() => setLocDoctor(null)} size="md" titleId="admin-doctor-location-title">
        {locDoctor && (
          <>
            <GlassModalHeader
              titleId="admin-doctor-location-title"
              title={`Dr. ${locDoctor.first_name} ${locDoctor.last_name}`}
              subtitle="Practice address & map pin for bookings"
              icon="fa-map-location-dot"
              accent="primary"
              onClose={() => setLocDoctor(null)}
            />
            <div className="p-5 md:p-6 space-y-3">
              <textarea
                className="input-field"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full clinic / practice address..."
              />
              <button
                type="button"
                className="btn-outline w-full text-sm inline-flex items-center justify-center gap-2"
                onClick={() => setMapOpen(true)}
              >
                <FaIcon icon="fa-map" />
                Pick on map
              </button>
              {lat != null && (
                <p className="text-xs text-slate-500 rounded-lg bg-white/70 border border-white/80 px-3 py-2">
                  <FaIcon icon="fa-location-dot" className="text-primary-600 mr-1" />
                  {lat.toFixed(5)}, {lng?.toFixed(5)}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" className="btn-outline flex-1" onClick={() => setLocDoctor(null)}>
                  Cancel
                </button>
                <button type="button" className="btn-primary flex-1" onClick={saveLocation}>
                  Save location
                </button>
              </div>
            </div>
          </>
        )}
      </GlassModal>

      <LocationMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={lat}
        initialLng={lng}
        onConfirm={({ lat: la, lng: ln }) => {
          setLat(la);
          setLng(ln);
        }}
      />
    </AdminDashboardLayout>
  );
}
