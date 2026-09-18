import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';

const ENV_OPTIONS = [
  { value: 'sandbox', label: 'Sandbox' },
  { value: 'production', label: 'Production' },
];

const emptyForm = () => ({
  enabled: false,
  environment: 'sandbox',
  base_url: 'https://data.kinestex.com',
  company_name: '',
  api_key: '',
});

export default function AdminKinesteX() {
  const [form, setForm] = useState(emptyForm);
  const [meta, setMeta] = useState({
    configured: false,
    api_key_configured: false,
    company_name_configured: false,
    api_key_source: 'database',
    sources: {},
    updated_at: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    admin
      .kinestexSettings()
      .then((res) => {
        const d = res.data || res || {};
        setForm({
          enabled: !!d.enabled,
          environment: d.environment === 'production' ? 'production' : 'sandbox',
          base_url: d.base_url || 'https://data.kinestex.com',
          company_name: d.company_name || '',
          api_key: '',
        });
        setMeta({
          configured: !!d.configured,
          api_key_configured: !!d.api_key_configured,
          company_name_configured: !!d.company_name_configured,
          api_key_source: d.api_key_source || 'database',
          sources: d.sources || {},
          updated_at: d.updated_at || null,
        });
        setShowApiKey(false);
      })
      .catch((e) => toast.error(e.message || 'Could not load KinesteX settings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        enabled: !!form.enabled,
        environment: form.environment,
        base_url: form.base_url.trim(),
        company_name: form.company_name.trim(),
      };
      // Only send api_key when admin typed a replacement value.
      if (form.api_key.trim()) {
        payload.api_key = form.api_key.trim();
      }
      const res = await admin.updateKinesteXSettings(payload);
      const d = res.data || res || {};
      setForm((f) => ({
        ...f,
        enabled: !!d.enabled,
        environment: d.environment === 'production' ? 'production' : 'sandbox',
        base_url: d.base_url || f.base_url,
        company_name: d.company_name || '',
        api_key: '',
      }));
      setMeta({
        configured: !!d.configured,
        api_key_configured: !!d.api_key_configured,
        company_name_configured: !!d.company_name_configured,
        api_key_source: d.api_key_source || 'database',
        sources: d.sources || {},
        updated_at: d.updated_at || null,
      });
      toast.success('KinesteX settings saved');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = form.enabled
    ? meta.configured
      ? 'Enabled'
      : 'Enabled (incomplete credentials)'
    : 'Disabled';

  const statusClass = form.enabled
    ? meta.configured
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <AdminDashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-1">Integrations</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">KinesteX AI Integration</h1>
          <p className="text-slate-600 text-sm">
            Configure server-side credentials for AI-monitored rehabilitation. Secrets never leave the API —
            leave the API key blank to keep the current value.
          </p>
        </div>

        {loading ? (
          <div className="glass-card h-64 animate-pulse bg-white/40" />
        ) : (
          <form onSubmit={save} className="glass-card !p-6 md:!p-8 space-y-6">
            <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FaIcon icon="fa-person-walking" className="text-primary-600" />
                  Status
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Integration is active for patients only when enabled and fully configured.
                </p>
              </div>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusClass}`}>
                <span className={`w-2 h-2 rounded-full ${form.enabled && meta.configured ? 'bg-emerald-500' : form.enabled ? 'bg-amber-500' : 'bg-slate-400'}`} />
                {statusLabel}
              </span>
            </section>

            <section>
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-800">Enable KinesteX</span>
                  <p className="text-xs text-slate-500 mt-0.5">Master switch for AI monitoring features (future phases).</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.enabled}
                  onClick={() => set('enabled', !form.enabled)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${form.enabled ? 'bg-primary-600' : 'bg-slate-300'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${form.enabled ? 'translate-x-5' : ''}`}
                  />
                </button>
              </label>
            </section>

            <section className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">Environment</label>
                <select
                  className="input w-full"
                  value={form.environment}
                  onChange={(e) => set('environment', e.target.value)}
                >
                  {ENV_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {meta.sources?.environment === 'env' && (
                  <p className="text-[11px] text-amber-700 mt-1">Overridden by KINESTEX_ENVIRONMENT</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">API Base URL</label>
                <input
                  className="input w-full font-mono text-sm"
                  value={form.base_url}
                  onChange={(e) => set('base_url', e.target.value)}
                  placeholder="https://data.kinestex.com"
                  autoComplete="off"
                />
                {meta.sources?.base_url === 'env' && (
                  <p className="text-[11px] text-amber-700 mt-1">Overridden by KINESTEX_BASE_URL</p>
                )}
              </div>
            </section>

            <section>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Company name</label>
              <input
                className="input w-full"
                value={form.company_name}
                onChange={(e) => set('company_name', e.target.value)}
                placeholder="Your KinesteX company name"
                autoComplete="organization"
                maxLength={200}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Required by the KinesteX SDK (`companyName`).{' '}
                {meta.company_name_configured ? (
                  <span className="text-emerald-700 font-medium">Configured</span>
                ) : (
                  <span className="text-amber-700 font-medium">Not set</span>
                )}
                {meta.sources?.company_name === 'env' && ' · env override active'}
              </p>
            </section>

            <section>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-sm font-semibold text-slate-800">API Key</label>
                <span className={`text-[11px] font-semibold ${meta.api_key_configured ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {meta.api_key_configured
                    ? `Configured${meta.api_key_source === 'env' ? ' (env)' : ''}`
                    : 'Not configured'}
                </span>
              </div>
              <div className="relative">
                <input
                  className="input w-full font-mono text-sm pr-24"
                  type={showApiKey ? 'text' : 'password'}
                  value={form.api_key}
                  onChange={(e) => set('api_key', e.target.value)}
                  placeholder={meta.api_key_configured ? '•••••••••••••••  (leave blank to keep)' : 'Paste KinesteX API key'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1"
                  onClick={() => setShowApiKey((v) => !v)}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Stored server-side only. Used as <code className="text-[10px] bg-slate-100 px-1 rounded">x-api-key</code> for
                verify-api-key / session minting. Leaving this field empty keeps the existing key.
                {meta.api_key_source === 'env' && (
                  <span className="block text-amber-700 mt-0.5">
                    Runtime key is currently taken from KINESTEX_API_KEY (env overrides database).
                  </span>
                )}
              </p>
            </section>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Credential notes</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Official KinesteX auth uses a company API key — no separate API secret.</li>
                <li>Results are delivered via SDK callbacks; no webhook secret is required.</li>
                <li>Optional env overrides: KINESTEX_API_KEY, KINESTEX_COMPANY_NAME, KINESTEX_BASE_URL, KINESTEX_ENVIRONMENT, KINESTEX_ENABLED.</li>
              </ul>
              {meta.updated_at && (
                <p className="pt-1 text-slate-400">Last updated: {meta.updated_at}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <FaIcon icon="fa-spinner" className="fa-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  <>
                    <FaIcon icon="fa-floppy-disk" className="mr-2" />
                    Save Settings
                  </>
                )}
              </button>
              <button type="button" className="btn-secondary" onClick={load} disabled={saving || loading}>
                Reload
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
