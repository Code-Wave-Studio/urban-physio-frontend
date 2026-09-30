import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];
const SOURCES = ['website', 'service_page', 'plan_page', 'whatsapp', 'call', 'campaign', 'manual', 'other'];
const STATUS_STYLE = {
  new: 'bg-sky-100 text-sky-800',
  contacted: 'bg-amber-100 text-amber-800',
  qualified: 'bg-violet-100 text-violet-800',
  converted: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-slate-200 text-slate-700',
};
const LIMIT = 20;

function formatWhen(d) {
  if (!d) return '—';
  const dt = new Date(String(d).replace(' ', 'T'));
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function label(s) {
  return String(s || '').replace(/_/g, ' ');
}

function LeadPanel({ id, onClose, onChanged }) {
  const [lead, setLead] = useState(null);
  const [status, setStatus] = useState('new');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await admin.leadShow(id);
      setLead(res.data);
      setStatus(res.data.status);
      setNotes(res.data.admin_notes || '');
    } catch (e) {
      toast.error(e.message || 'Could not load lead');
      onClose();
    }
  }, [id, onClose]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      if (status !== lead.status) {
        await admin.leadUpdateStatus(id, { status, admin_notes: notes });
      } else if ((lead.admin_notes || '') !== notes) {
        await admin.leadUpdateNotes(id, notes);
      } else {
        toast('Nothing changed');
        return;
      }
      toast.success('Lead updated');
      await load();
      onChanged();
    } catch (e) {
      toast.error(e.message || 'Could not update lead');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this lead? It will be hidden from the list.')) return;
    setBusy(true);
    try {
      await admin.leadDelete(id);
      toast.success('Lead deleted');
      onChanged();
      onClose();
    } catch (e) {
      toast.error(e.message || 'Could not delete lead');
      setBusy(false);
    }
  };

  const row = (k, v) => (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-slate-500">{k}</dt>
      <dd className="text-sm text-slate-900 break-words">{v || '—'}</dd>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[125] flex justify-end bg-slate-900/50" role="dialog" aria-modal="true" aria-label="Lead details">
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto overflow-x-hidden shadow-2xl">
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Lead #{id}</p>
            <h2 className="text-lg font-bold text-slate-900 break-words">{lead?.name || '…'}</h2>
            {lead && <span className={`badge ${STATUS_STYLE[lead.status]}`}>{lead.status}</span>}
          </div>
          <button type="button" onClick={onClose} className="btn-icon p-2 text-slate-500 hover:text-slate-900" aria-label="Close">
            <FaIcon icon="fa-xmark" />
          </button>
        </div>
        {!lead ? (
          <div className="p-4">
            <div className="glass-card h-24 animate-pulse" />
          </div>
        ) : (
          <div className="p-4 space-y-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {row('Phone', lead.phone && <a className="text-primary-700 underline" href={`tel:${lead.phone}`}>{lead.phone}</a>)}
              {row('Email', lead.email && <a className="text-primary-700 underline" href={`mailto:${lead.email}`}>{lead.email}</a>)}
              {row('Source', label(lead.source))}
              {row('Campaign', lead.campaign)}
              {row('Service / plan', lead.item_title && `${lead.item_title} (${lead.item_type})`)}
              {row('Page', lead.page_slug)}
              {row('Language', lead.language_code)}
              {row('Received', formatWhen(lead.created_at))}
              {row('Consent to contact', lead.consent_given ? 'Yes' : 'No')}
              {row('Last status change', lead.status_changed_at ? `${formatWhen(lead.status_changed_at)}${lead.status_changed_by_name ? ` by ${lead.status_changed_by_name}` : ''}` : null)}
            </dl>
            {lead.message && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Message</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap break-words glass-card !p-3">{lead.message}</p>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label htmlFor="lead-status" className="block text-xs font-semibold text-slate-600 mb-1">
                  Status
                </label>
                <select id="lead-status" className="input-field w-full" value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lead-notes" className="block text-xs font-semibold text-slate-600 mb-1">
                  Internal notes
                </label>
                <textarea id="lead-notes" rows={4} maxLength={5000} className="input-field w-full" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary !px-4 !py-2 text-sm" disabled={busy} onClick={save}>
                  Save
                </button>
                <button type="button" className="btn-danger !px-4 !py-2 text-sm" disabled={busy} onClick={remove}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLeads() {
  const [filters, setFilters] = useState({ q: '', status: '', source: '', campaign: '', date_from: '', date_to: '' });
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState({ items: [], total: 0 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    document.title = 'Leads | The Urban Physio Admin';
  }, []);

  const loadSummary = useCallback(() => {
    admin
      .leadsSummary()
      .then((r) => setSummary(r.data))
      .catch(() => setSummary(null));
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset };
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await admin.leadsList(params);
      setData(res.data || { items: [], total: 0 });
    } catch (e) {
      toast.error(e.message || 'Could not load leads');
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    const t = setTimeout(loadList, filters.q || filters.campaign ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadList, filters.q, filters.campaign]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const closePanel = useCallback(() => setSelectedId(null), []);
  const onChanged = useCallback(() => {
    loadList();
    loadSummary();
  }, [loadList, loadSummary]);

  const setFilter = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setOffset(0);
  };

  return (
    <AdminDashboardLayout>
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Leads</h1>
        <p className="text-slate-600 text-sm mt-1">Enquiries from service and plan pages and campaigns. Visible to admins only.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setFilter('status', '')}
            className={`glass-card !p-3 text-left ${filters.status === '' ? 'ring-2 ring-primary-400' : ''}`}
          >
            <p className="text-xs text-slate-500">All</p>
            <p className="text-xl font-bold text-slate-900">{summary.total}</p>
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter('status', filters.status === s ? '' : s)}
              className={`glass-card !p-3 text-left ${filters.status === s ? 'ring-2 ring-primary-400' : ''}`}
            >
              <p className="text-xs text-slate-500 capitalize">{s}</p>
              <p className="text-xl font-bold text-slate-900">{summary.by_status?.[s] ?? 0}</p>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <input className="input-field min-w-0 lg:col-span-2" placeholder="Search name, phone, email, service, campaign" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} aria-label="Search leads" />
        <select className="input-field" value={filters.source} onChange={(e) => setFilter('source', e.target.value)} aria-label="Filter by source">
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <input className="input-field min-w-0" placeholder="Campaign (exact)" value={filters.campaign} onChange={(e) => setFilter('campaign', e.target.value)} aria-label="Filter by campaign" />
        <input type="date" className="input-field min-w-0" value={filters.date_from} onChange={(e) => setFilter('date_from', e.target.value)} aria-label="From date" />
        <input type="date" className="input-field min-w-0" value={filters.date_to} onChange={(e) => setFilter('date_to', e.target.value)} aria-label="To date" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-16 animate-pulse" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="glass-card text-center py-10 px-6">
          <FaIcon icon="fa-inbox" className="text-4xl text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No leads match.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.items.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setSelectedId(l.id)}
                className="glass-card !p-3 w-full text-left flex flex-col sm:flex-row sm:items-center gap-2 border border-white/80 hover:border-primary-300 min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 break-words">{l.name}</p>
                  <p className="text-sm text-slate-600 break-words">
                    {l.phone}
                    {l.item_title ? ` · ${l.item_title}` : ''}
                  </p>
                  <p className="text-xs text-slate-500 break-words">
                    {label(l.source)}
                    {l.campaign ? ` · ${l.campaign}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${STATUS_STYLE[l.status]}`}>{l.status}</span>
                  <time className="text-xs text-slate-500">{formatWhen(l.created_at)}</time>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2 mt-4 text-sm text-slate-600">
        <span>
          {data.total === 0 ? 0 : offset + 1}–{Math.min(offset + LIMIT, data.total)} of {data.total}
        </span>
        <div className="flex gap-2">
          <button type="button" className="btn-outline !px-3 !py-1.5 text-sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))}>
            Previous
          </button>
          <button type="button" className="btn-outline !px-3 !py-1.5 text-sm" disabled={offset + LIMIT >= data.total} onClick={() => setOffset(offset + LIMIT)}>
            Next
          </button>
        </div>
      </div>

      {/* Portal: <main> is animated (own stacking context), so the slide-over must live on <body> to sit above the fixed site header. */}
      {selectedId && createPortal(
        <LeadPanel id={selectedId} onClose={closePanel} onChanged={onChanged} />,
        document.body
      )}
    </AdminDashboardLayout>
  );
}
