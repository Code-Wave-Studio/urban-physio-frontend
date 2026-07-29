import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { erpProtocols } from '../../services/api';

const STATUS_BADGE = {
  published: 'bg-green-100 text-green-700',
  draft:     'bg-amber-100 text-amber-700',
  archived:  'bg-slate-100 text-slate-500',
};

function TemplateForm({ templateId, clinicId, onSaved }) {
  const [form, setForm]     = useState({ name: '', description: '', status: 'draft', schema: [] });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!templateId);

  useEffect(() => {
    if (!templateId) return;
    erpProtocols.getTemplate(templateId)
      .then((r) => {
        const d = r.data || r;
        setForm({ name: d.name, description: d.description || '', status: d.status, schema: d.schema || [] });
      })
      .catch(() => toast.error('Could not load template'))
      .finally(() => setLoading(false));
  }, [templateId]);

  const save = async (status) => {
    setSaving(true);
    try {
      const payload = { ...form, status: status || form.status };
      if (templateId) {
        await erpProtocols.updateTemplate(templateId, payload);
        toast.success('Protocol template updated');
      } else {
        const r = await erpProtocols.createTemplate(payload);
        toast.success('Template created');
        onSaved?.(r.id);
      }
      if (status) setForm((p) => ({ ...p, status }));
    } catch (e) { toast.error(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />;

  return (
    <div className="glass-card !p-5 space-y-4">
      <h2 className="font-bold text-slate-900">
        {templateId ? 'Edit Protocol Template' : 'New Protocol Template'}
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-500">Template Name *</label>
          <input className="w-full border rounded-xl px-3 py-2 text-sm mt-1" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-slate-500">Status</label>
          <select className="w-full border rounded-xl px-3 py-2 text-sm mt-1" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500">Description</label>
        <textarea className="w-full border rounded-xl px-3 py-2 text-sm mt-1 resize-none" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => save()} disabled={saving} className="btn-outline text-sm">
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        {form.status !== 'published' && (
          <button type="button" onClick={() => save('published')} disabled={saving} className="btn-primary text-sm">
            Publish
          </button>
        )}
      </div>
    </div>
  );
}

export default function ClinicProtocolBuilderPage() {
  const { templateId } = useParams();
  const navigate       = useNavigate();
  const { clinicId }   = useClinicPortal();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);

  const loadTemplates = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await erpProtocols.listTemplates({});
      setTemplates(res.data || res || []);
    } catch { toast.error('Could not load templates'); }
    finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const duplicate = async (id) => {
    try {
      const r = await erpProtocols.duplicateTemplate(id);
      toast.success('Duplicated');
      loadTemplates();
      navigate(`/clinic-portal/settings/protocols/${r.id}`);
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await erpProtocols.deleteTemplate(id);
      toast.success('Deleted');
      loadTemplates();
      if (String(templateId) === String(id)) navigate('/clinic-portal/settings/protocols');
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  return (
    <ClinicPortalShell
      title="Protocol Builder"
      subtitle="Design treatment protocol templates"
      actions={
        <div className="portal-page-actions">
          <Link to="/clinic-portal/settings/protocols/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <FaIcon icon="fa-solid fa-plus" />
            New Protocol
          </Link>
        </div>
      }
    >
      <div className="grid lg:grid-cols-3 gap-5">
        {/* List */}
        <div className="lg:col-span-1 glass-card !p-4">
          <h2 className="font-bold text-sm mb-3 text-slate-700">Protocol Templates</h2>
          {loading ? (
            <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />)}</div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No templates yet.</p>
          ) : (
            <div>
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-3 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_BADGE[t.status] || ''}`}>{t.status}</span>
                      <span className="text-[10px] text-slate-400">v{t.version}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => navigate(`/clinic-portal/settings/protocols/${t.id}`)} className="p-1.5 rounded-lg hover:bg-slate-100">
                      <FaIcon icon="fa-solid fa-pen" className="text-xs text-teal-600" />
                    </button>
                    <button type="button" onClick={() => duplicate(t.id)} className="p-1.5 rounded-lg hover:bg-slate-100">
                      <FaIcon icon="fa-solid fa-copy" className="text-xs text-slate-400" />
                    </button>
                    <button type="button" onClick={() => remove(t.id)} className="p-1.5 rounded-lg hover:bg-slate-100">
                      <FaIcon icon="fa-solid fa-trash" className="text-xs text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {templateId === 'new' || templateId ? (
            <TemplateForm
              templateId={templateId === 'new' ? null : Number(templateId)}
              clinicId={clinicId}
              onSaved={(id) => { loadTemplates(); navigate(`/clinic-portal/settings/protocols/${id}`); }}
            />
          ) : (
            <div className="glass-card !p-8 flex flex-col items-center justify-center gap-3 text-center min-h-[300px]">
              <FaIcon icon="fa-solid fa-notes-medical" className="text-4xl text-slate-200" />
              <p className="text-slate-500 font-medium">Select a template or create a new one</p>
              <Link to="/clinic-portal/settings/protocols/new" className="btn-primary text-sm">Create Template</Link>
            </div>
          )}
        </div>
      </div>
    </ClinicPortalShell>
  );
}
