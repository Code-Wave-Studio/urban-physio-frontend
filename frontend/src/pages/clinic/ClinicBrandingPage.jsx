import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

export default function ClinicBrandingPage() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [form, setForm] = useState({
    primary_color: '#0d9488',
    secondary_color: '#0f172a',
    accent_color: '#14b8a6',
    tagline: '',
    branch_name: '',
    pdf_header_text: '',
    pdf_footer_text: '',
    show_logo_on_pdf: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.getBranding(clinicId);
      const data = res.data || res || {};
      setForm((old) => ({
        ...old,
        ...data,
        pdf_header_text: data.pdf_header_text || data.pdf_header || '',
        pdf_footer_text: data.pdf_footer_text || data.pdf_footer || '',
        show_logo_on_pdf: data.show_logo_on_pdf !== undefined ? Boolean(Number(data.show_logo_on_pdf)) : true,
      }));
    } catch (error) {
      toast.error(error.message || 'Could not load branding');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  if (!boot && (!isAdminMode || !(can('branding.manage') || can('profile.manage')))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await clinicPortal.saveBranding(clinicId, {
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        accent_color: form.accent_color,
        tagline: form.tagline || '',
        branch_name: form.branch_name || '',
        pdf_header_text: form.pdf_header_text || '',
        pdf_footer_text: form.pdf_footer_text || '',
        show_logo_on_pdf: form.show_logo_on_pdf,
      });
      toast.success('Branding saved');
    } catch (error) {
      toast.error(error.message || 'Could not save branding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClinicPortalShell
      title="Branding"
      subtitle="Clinic logo and colour theme for PDFs and patient-facing screens"
      actions={(
        <div className="portal-page-actions">
          <Link to="/clinic-portal/profile" className="btn-outline inline-flex items-center gap-2">
            <FaIcon icon="fa-image" />
            <span className="hidden sm:inline">Logo & profile</span>
            <span className="sm:hidden">Profile</span>
          </Link>
        </div>
      )}
    >
      {boot || loading ? <div className="glass-card h-72 animate-pulse" /> : (
        <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <section className="glass-card !p-4 sm:!p-5 space-y-5">
            <div><h2 className="font-bold text-slate-900">Colour theme</h2><p className="text-xs text-slate-500 mt-1">Used on clinic PDFs and public patient screens.</p></div>
            {[['primary_color', 'Primary colour'], ['secondary_color', 'Secondary colour'], ['accent_color', 'Accent colour']].map(([key, label]) => (
              <label key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-sm font-medium">
                {label}
                <div className="flex items-center gap-2">
                  <input type="text" pattern="#[0-9a-fA-F]{6}" className="input-field !w-28 font-mono text-xs" value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  <input type="color" className="w-11 h-11 rounded-lg cursor-pointer shrink-0" value={form[key] || '#000000'} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              </label>
            ))}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h2 className="font-bold">Intake form header</h2>
              <p className="text-xs text-slate-500 -mt-2">Shown on the public QR intake form. Logo is managed in Clinic Profile.</p>
              <label className="block text-sm font-medium">
                Tagline
                <input
                  className="input-field mt-1"
                  value={form.tagline || ''}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="e.g. Expert physio care near you"
                />
              </label>
              <label className="block text-sm font-medium">
                Branch name / location
                <input
                  className="input-field mt-1"
                  value={form.branch_name || ''}
                  onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                  placeholder="e.g. Andheri West · Mumbai"
                />
              </label>
            </div>
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h2 className="font-bold">PDF text</h2>
              <label className="block text-sm font-medium">
                Header
                <textarea
                  className="input-field mt-1"
                  rows={3}
                  value={form.pdf_header_text || ''}
                  onChange={(e) => setForm({ ...form, pdf_header_text: e.target.value })}
                  placeholder="Clinic address, phone, registration details…"
                />
              </label>
              <label className="block text-sm font-medium">
                Footer
                <textarea
                  className="input-field mt-1"
                  rows={3}
                  value={form.pdf_footer_text || ''}
                  onChange={(e) => setForm({ ...form, pdf_footer_text: e.target.value })}
                  placeholder="Confidentiality notice or care instructions…"
                />
              </label>
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>{saving ? 'Saving…' : 'Save branding'}</button>
          </section>
          <section className="glass-card !p-4 sm:!p-5 self-start">
            <h2 className="font-bold mb-3">PDF preview</h2>
            <div className="aspect-[1/1.3] max-w-md mx-auto rounded-xl border bg-white shadow-sm p-4 sm:p-6 flex flex-col" style={{ borderTop: `8px solid ${form.primary_color}` }}>
              <div className="flex justify-between border-b pb-4" style={{ borderColor: form.accent_color }}><div><p className="font-bold text-lg" style={{ color: form.secondary_color }}>The Urban Physio Clinic</p><p className="text-[10px] text-slate-500 whitespace-pre-wrap">{form.pdf_header_text || 'Your clinic header appears here'}</p></div><div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><FaIcon icon="fa-image" /></div></div>
              <div className="flex-1 pt-5"><p className="text-xs font-bold uppercase" style={{ color: form.primary_color }}>Progress Report</p><div className="mt-4 space-y-2">{[100, 85, 92, 70].map((width, index) => <div key={index} className="h-2 bg-slate-100 rounded" style={{ width: `${width}%` }} />)}</div></div>
              <p className="text-[9px] text-slate-400 border-t pt-3 whitespace-pre-wrap">{form.pdf_footer_text || 'Your PDF footer appears here'}</p>
            </div>
          </section>
        </form>
      )}
    </ClinicPortalShell>
  );
}
