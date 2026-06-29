import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../FaIcon';
import AppointmentListRow from './AppointmentListRow';
import useAppointmentDeepLink from '../../hooks/useAppointmentDeepLink';
import { appointments, location } from '../../services/api';
import {
  computeStats,
  filterAppointments,
  groupByPending,
  sortAppointments,
} from '../../utils/appointmentListUtils';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending', highlight: true },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Done' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'rejected', label: 'Rejected' },
];

const TYPE_TABS = [
  { id: '', label: 'All types', icon: 'fa-layer-group' },
  { id: 'online', label: 'Online', icon: 'fa-video' },
  { id: 'clinic', label: 'Clinic', icon: 'fa-hospital' },
  { id: 'home_visit', label: 'Home', icon: 'fa-house-medical' },
];

/**
 * @param {{ view: 'admin' | 'doctor', title: string, subtitle: string, links: object[], defaultSort?: string }} props
 */
export default function AppointmentsManager({
  view,
  title,
  subtitle,
  links,
  defaultSort = 'pending_first',
}) {
  const [searchParams] = useSearchParams();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(defaultSort);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [updatingId, setUpdatingId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [filterCities, setFilterCities] = useState([]);
  const highlightId = useAppointmentDeepLink(list);

  useEffect(() => {
    if (view !== 'admin') return undefined;
    let cancelled = false;
    location
      .cities()
      .then((res) => {
        if (cancelled) return;
        const flat = (res.data || [])
          .map((c) => ({
            id: c.id,
            name: c.state_name ? `${c.name} (${c.state_name})` : c.name,
            state_id: c.state_id,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setFilterCities(flat);
      })
      .catch(() => {
        if (!cancelled) setFilterCities([]);
      });
    return () => {
      cancelled = true;
    };
  }, [view]);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (view === 'admin' && cityFilter) params.city_id = cityFilter;
    appointments
      .list(params)
      .then((res) => {
        const data = res.data || [];
        setList(data);
        if (view === 'doctor') {
          const pendingIds = data.filter((a) => a.status === 'pending').map((a) => a.id);
          setExpandedIds(new Set(pendingIds.slice(0, 3)));
        }
      })
      .catch((err) => toast.error(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [statusFilter, cityFilter, view]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!highlightId) return;
    setExpandedIds((prev) => new Set([...prev, highlightId]));
    const match = list.find((a) => a.id === highlightId);
    if (match && statusFilter && match.status !== statusFilter) {
      setStatusFilter('');
    }
  }, [highlightId, list, statusFilter]);

  const stats = useMemo(() => computeStats(list), [list]);

  const filtered = useMemo(
    () =>
      sortAppointments(
        filterAppointments(list, {
          search,
          typeFilter,
          payFilter,
          statusFilter: '',
          includeDoctorInSearch: view === 'admin',
        }),
        sortBy
      ),
    [list, search, typeFilter, payFilter, sortBy, view]
  );

  const { pending, rest, hasPending } = useMemo(() => groupByPending(filtered), [filtered]);

  const displayList = useMemo(() => {
    if (statusFilter) return filtered;
    if (sortBy === 'pending_first' && hasPending) return [...pending, ...rest];
    return filtered;
  }, [filtered, statusFilter, sortBy, hasPending, pending, rest]);

  const handleMarkOfflinePayment = async (id) => {
    setUpdatingId(id);
    try {
      await appointments.markOfflinePayment(id);
      toast.success('Offline payment marked as received');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not update payment');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await appointments.updateStatus(id, status);
      toast.success(`Status: ${status}`);
      load();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(displayList.map((a) => a.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const hasActiveFilters = Boolean(
    search.trim() || statusFilter || typeFilter || payFilter || cityFilter || sortBy !== defaultSort
  );

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setPayFilter('');
    setCityFilter('');
    setSortBy(defaultSort);
  };

  const renderList = (items, showPendingLabel = false) => (
    <div className="space-y-3">
      {showPendingLabel && items.length > 0 && (
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700 flex items-center gap-2 px-1">
          <FaIcon icon="fa-bell" />
          Needs action ({items.length})
        </p>
      )}
      {items.map((a) => (
        <AppointmentListRow
          key={a.id}
          appt={a}
          view={view}
          highlighted={highlightId === a.id}
          expanded={expandedIds.has(a.id)}
          onToggle={() => toggleExpand(a.id)}
          onStatusChange={handleStatusChange}
          onMarkOfflinePayment={view === 'doctor' ? handleMarkOfflinePayment : undefined}
          updating={updatingId === a.id}
        />
      ))}
    </div>
  );

  const Layout = view === 'admin' ? AdminDashboardLayout : DashboardLayout;
  const layoutProps = view === 'admin' ? {} : { links, variant: view === 'doctor' ? 'doctor' : undefined };

  return (
    <Layout {...layoutProps}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{title}</h1>
          <p className="text-slate-600 text-sm mt-1">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="btn-outline text-sm py-2 px-4 inline-flex items-center gap-2 shrink-0"
        >
          <FaIcon icon={`fa-arrows-rotate ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="glass-card py-3 px-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="glass-card py-3 px-4 border-amber-200/50 bg-amber-50/20">
          <p className="text-[10px] font-bold uppercase text-amber-700">Pending</p>
          <p className="text-2xl font-bold text-amber-800">{stats.pending}</p>
        </div>
        <div className="glass-card py-3 px-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">Today</p>
          <p className="text-2xl font-bold text-primary-700">{stats.today}</p>
        </div>
        <div className="glass-card py-3 px-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">Collected</p>
          <p className="text-xl font-bold text-emerald-700">
            ₹{stats.paidTotal.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Search — always visible, not sticky */}
      <div className="card !p-3 mb-3">
        <div className="relative">
          <FaIcon
            icon="fa-magnifying-glass"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 text-sm"
          />
          <input
            className="input-field pl-9 !py-2.5"
            placeholder="Search booking ID, patient, doctor, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Collapsible filters — scrolls with page (no sticky) */}
      <div className="card !p-0 mb-4 overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/60 transition"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <span className="text-sm font-semibold text-slate-800 inline-flex items-center gap-2">
            <FaIcon icon="fa-sliders" className="text-primary-600" />
            Filters & sort
            {hasActiveFilters && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                Active
              </span>
            )}
          </span>
          <span className="text-xs text-slate-500 shrink-0">
            {displayList.length} result{displayList.length !== 1 ? 's' : ''}
            <FaIcon icon={filtersOpen ? 'fa-chevron-up' : 'fa-chevron-down'} className="ml-2 text-slate-400" />
          </span>
        </button>

        {filtersOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_TABS.map((f) => (
                  <button
                    key={f.id || 'all'}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      statusFilter === f.id
                        ? 'bg-primary-600 text-white'
                        : f.highlight && stats.pending > 0
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {f.label}
                    {f.id === 'pending' && stats.pending > 0 && (
                      <span className="ml-1 opacity-90">({stats.pending})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Consultation type</p>
                <div className="flex flex-wrap gap-1.5">
                  {TYPE_TABS.map((t) => (
                    <button
                      key={t.id || 'all-types'}
                      type="button"
                      onClick={() => setTypeFilter(t.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition ${
                        typeFilter === t.id ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <FaIcon icon={t.icon} className="text-[10px]" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Payment</p>
                <select
                  className="input-field py-2 text-sm w-full"
                  value={payFilter}
                  onChange={(e) => setPayFilter(e.target.value)}
                >
                  <option value="">All payments</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Unpaid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Sort</p>
                <select
                  className="input-field py-2 text-sm w-full"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="pending_first">Pending first</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="amount">Highest amount</option>
                  <option value="patient">Patient A–Z</option>
                </select>
              </div>
            </div>

            {view === 'admin' && (
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Doctor city</p>
                <select
                  className="input-field py-2 text-sm w-full max-w-md"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  <option value="">All cities</option>
                  {filterCities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Filter by doctor&apos;s registered city.{' '}
                  <a href="/admin/locations" className="text-primary-600 font-medium hover:underline">
                    Manage locations →
                  </a>
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {hasActiveFilters && (
                <button type="button" onClick={clearAllFilters} className="text-xs font-semibold text-red-600 hover:underline">
                  Clear all filters
                </button>
              )}
              <span className="text-slate-300 hidden sm:inline">|</span>
              <button type="button" onClick={expandAll} className="text-xs font-semibold text-primary-600 hover:underline">
                Expand all
              </button>
              <button type="button" onClick={collapseAll} className="text-xs font-semibold text-slate-600 hover:underline">
                Collapse all
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl h-24 animate-pulse bg-white/40 border border-white/60" />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="glass-card text-center py-16 text-slate-600">
          <FaIcon icon="fa-calendar-xmark" className="text-4xl text-primary-500 mb-4" />
          <p className="font-medium">No appointments match your filters</p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="btn-outline text-sm mt-4"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-6 pb-8">
          {!statusFilter && sortBy === 'pending_first' && hasPending ? (
            <>
              {renderList(pending, true)}
              {rest.length > 0 && (
                <>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 px-1 pt-2">
                    Other appointments
                  </p>
                  {renderList(rest)}
                </>
              )}
            </>
          ) : (
            renderList(displayList)
          )}
        </div>
      )}
    </Layout>
  );
}
