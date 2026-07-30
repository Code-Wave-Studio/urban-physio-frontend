import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import IntakeFormBuilder from '../../components/clinic/IntakeFormBuilder';
import { IntakeFieldPreview } from '../../components/clinic/IntakePublicField';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';
import { getShowIf, parseOptions, parseValidation } from '../../utils/intakeFields';

function normalizeFields(list) {
  return (list || []).map((field) => {
    const validation = parseValidation(field);
    return {
      ...field,
      is_enabled: Boolean(Number(field.is_enabled)),
      is_required: Boolean(Number(field.is_required)),
      is_locked: Boolean(Number(field.is_locked)),
      options: parseOptions(field.options ?? field.options_json),
      show_if: getShowIf(field),
      rating_max: validation.rating_max || 5,
      validation,
    };
  });
}

export default function ClinicFormsPage() {
  const { clinicId, clinic, isAdminMode, can, loading: boot } = useClinicPortal();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [branding, setBranding] = useState(null);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [res, brandRes] = await Promise.all([
        clinicPortal.registrationFields(clinicId),
        clinicPortal.getBranding(clinicId).catch(() => null),
      ]);
      setFields(normalizeFields(res.data || res || []));
      setBranding(brandRes?.data || brandRes || null);
    } catch (error) {
      toast.error(error.message || 'Could not load form fields');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  const enabledCount = useMemo(() => fields.filter((f) => f.is_enabled).length, [fields]);
  const conditionalCount = useMemo(() => fields.filter((f) => getShowIf(f)).length, [fields]);

  if (!boot && (!isAdminMode || !can('forms.manage'))) {
    return <Navigate to="/clinic-portal" replace />;
  }

  const save = async () => {
    setSaving(true);
    try {
      await clinicPortal.saveRegistrationFields(clinicId, {
        fields: fields.map((field, index) => {
          const showIf = getShowIf(field);
          const validation = { ...parseValidation(field) };
          if (field.field_type === 'rating') {
            validation.rating_max = Math.max(2, Math.min(10, Number(field.rating_max || validation.rating_max || 5)));
          } else {
            delete validation.rating_max;
          }
          if (showIf?.field_key) validation.show_if = showIf;
          else delete validation.show_if;
          return {
            id: field.id,
            field_key: field.field_key,
            label: field.label,
            field_type: field.field_type || 'text',
            is_enabled: field.is_enabled,
            is_required: field.is_required,
            sort_order: index,
            options: parseOptions(field.options ?? field.options_json),
            show_if: showIf,
            validation,
            ...(field.field_type === 'rating' ? { rating_max: validation.rating_max } : {}),
          };
        }),
      });
      toast.success('Intake form saved');
      load();
    } catch (error) {
      toast.error(error.message || 'Could not save form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClinicPortalShell
      title="Intake Form Builder"
      subtitle="Drag fields, set types, and add show-if rules for your QR intake"
      actions={(
        <div className="portal-page-actions">
          <button
            type="button"
            className="btn-outline inline-flex items-center gap-2 text-xs"
            onClick={() => setShowPreview((v) => !v)}
          >
            <FaIcon icon={showPreview ? 'fa-eye-slash' : 'fa-eye'} />
            <span className="hidden sm:inline">{showPreview ? 'Hide preview' : 'Show preview'}</span>
          </button>
          <Link to="/clinic-portal/clinical-library" className="btn-outline inline-flex items-center gap-2">
            <FaIcon icon="fa-clipboard-list" />
            <span className="hidden sm:inline">Assessment templates</span>
            <span className="sm:hidden">Templates</span>
          </Link>
        </div>
      )}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="glass-card !p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Fields</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{fields.length}</p>
        </div>
        <div className="glass-card !p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Enabled</p>
          <p className="text-xl font-bold text-teal-700 mt-0.5">{enabledCount}</p>
        </div>
        <div className="glass-card !p-3 col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Conditionals</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{conditionalCount}</p>
        </div>
      </div>

      <div className={`grid gap-4 ${showPreview ? 'lg:grid-cols-[1.2fr_0.8fr]' : ''}`}>
        <div className="glass-card !p-0 overflow-hidden">
          {boot || loading ? (
            <div className="h-64 m-4 rounded-xl bg-slate-100 animate-pulse" />
          ) : (
            <IntakeFormBuilder fields={fields} onChange={setFields} />
          )}
          <div className="p-3 sm:p-4 border-t bg-slate-50 flex justify-stretch sm:justify-end">
            <button
              type="button"
              className="btn-primary w-full sm:w-auto"
              disabled={saving || loading}
              onClick={save}
            >
              {saving ? 'Saving…' : 'Save form'}
            </button>
          </div>
        </div>

        {showPreview && (
          <div className="glass-card !p-0 overflow-hidden h-fit lg:sticky lg:top-20">
            <div className="p-3 sm:p-4 border-b">
              <h2 className="font-bold">Live preview</h2>
              <p className="text-xs text-slate-500">How patients see enabled fields on QR intake</p>
            </div>
            <div
              className="p-3 sm:p-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${branding?.primary_color || '#0d9488'}, ${branding?.secondary_color || '#0f766e'})`,
              }}
            >
              <div className="flex items-start gap-3">
                {(branding?.logo_url || clinic?.logo_url || clinic?.logo) ? (
                  <img
                    src={branding?.logo_url || clinic?.logo_url || clinic?.logo}
                    alt=""
                    className="h-11 w-11 rounded-xl object-contain bg-white/95 p-0.5"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest opacity-80">Patient intake</p>
                  <p className="font-bold text-sm leading-tight">{clinic?.name || branding?.name || 'Clinic'}</p>
                  {branding?.tagline ? <p className="text-[11px] opacity-90 mt-0.5">{branding.tagline}</p> : null}
                  {branding?.branch_name ? (
                    <p className="text-[10px] mt-1 opacity-90">📍 {branding.branch_name}</p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              {boot || loading ? (
                <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />
              ) : (
                <>
                  <IntakeFieldPreview fields={fields} />
                  <label className="mt-4 flex items-start gap-2 text-[11px] text-slate-600 border border-slate-100 rounded-xl p-2.5 bg-slate-50">
                    <input type="checkbox" disabled checked readOnly className="mt-0.5" />
                    <span>
                      I agree to the Clinic&apos;s terms of service and consent to my medical profile being securely
                      managed via The Urban Physio platform. <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                    style={{ background: branding?.primary_color || '#0d9488' }}
                  >
                    Submit
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </ClinicPortalShell>
  );
}
