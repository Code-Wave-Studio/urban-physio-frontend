import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import AssessmentBuilder from '../../components/erp/AssessmentBuilder';
import useClinicPortal from '../../hooks/useClinicPortal';
import { erpAssessments } from '../../services/api';

function TemplateRow({ template, onDuplicate, onDelete, onEdit }) {
  const STATUS_BADGE = {
    published: 'bg-green-100 text-green-700',
    draft:     'bg-amber-100 text-amber-700',
    archived:  'bg-slate-100 text-slate-500',
  };
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
      <div className="min-w-0">
        <p className="font-medium text-sm text-slate-900 truncate">{template.name}</p>
        <p className="text-[11px] text-slate-400">v{template.version} · Updated {String(template.updated_at || '').slice(0, 10)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[template.status] || ''}`}>
          {template.status}
        </span>
        <button type="button" onClick={() => onEdit(template.id)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Edit">
          <FaIcon icon="fa-solid fa-pen" className="text-xs text-teal-600" />
        </button>
        <button type="button" onClick={() => onDuplicate(template.id)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Duplicate">
          <FaIcon icon="fa-solid fa-copy" className="text-xs text-slate-500" />
        </button>
        <button type="button" onClick={() => onDelete(template.id)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Delete">
          <FaIcon icon="fa-solid fa-trash" className="text-xs text-red-400" />
        </button>
      </div>
    </div>
  );
}

export default function ClinicAssessmentBuilderPage() {
  const { templateId } = useParams();
  const navigate       = useNavigate();
  const { clinicId }   = useClinicPortal();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);

  const loadTemplates = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await erpAssessments.listTemplates({});
      setTemplates(res.data || res || []);
    } catch { toast.error('Could not load templates'); }
    finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const duplicate = async (id) => {
    try {
      const res = await erpAssessments.duplicateTemplate(id);
      toast.success('Template duplicated');
      loadTemplates();
      navigate(`/clinic-portal/settings/assessments/${res.id}`);
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await erpAssessments.deleteTemplate(id);
      toast.success('Deleted');
      loadTemplates();
      if (String(templateId) === String(id)) navigate('/clinic-portal/settings/assessments');
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  return (
    <ClinicPortalShell
      title="Assessment Builder"
      subtitle="Design dynamic physiotherapy assessment forms"
      actions={
        <div className="portal-page-actions">
          <Link to="/clinic-portal/settings/assessments/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <FaIcon icon="fa-solid fa-plus" />
            New Template
          </Link>
        </div>
      }
    >
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Template List */}
        <div className="lg:col-span-1 glass-card !p-4">
          <h2 className="font-bold text-sm mb-3 text-slate-700">Templates</h2>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />)}</div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No templates yet.</p>
          ) : (
            <div>
              {templates.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  onEdit={(id) => navigate(`/clinic-portal/settings/assessments/${id}`)}
                  onDuplicate={duplicate}
                  onDelete={remove}
                />
              ))}
            </div>
          )}
        </div>

        {/* Builder */}
        <div className="lg:col-span-2">
          {templateId === 'new' || templateId ? (
            <AssessmentBuilder
              clinicId={clinicId}
              templateId={templateId === 'new' ? null : Number(templateId)}
              onSaved={(newId) => { loadTemplates(); navigate(`/clinic-portal/settings/assessments/${newId}`); }}
            />
          ) : (
            <div className="glass-card !p-8 flex flex-col items-center justify-center gap-3 text-center min-h-[300px]">
              <FaIcon icon="fa-solid fa-clipboard-list" className="text-4xl text-slate-200" />
              <p className="text-slate-500 font-medium">Select a template to edit or create a new one</p>
              <Link to="/clinic-portal/settings/assessments/new" className="btn-primary text-sm">
                Create Template
              </Link>
            </div>
          )}
        </div>
      </div>
    </ClinicPortalShell>
  );
}
