import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

export default function ClinicNotificationsManagePage() {
  const { clinicId, isAdminMode, can, loading: boot } = useClinicPortal();
  const [tab, setTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState({ name: '', channel: 'email', audience: 'all', subject: '', message: '' });

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        clinicPortal.notificationTemplates(clinicId),
        clinicPortal.notificationCampaigns(clinicId),
      ]);
      const tpl = (t.data || t || []).map((row) => ({
        ...row,
        body: row.body_template || row.body || row.message || '',
      }));
      setTemplates(tpl);
      setCampaigns(c.data || c || []);
    } catch (error) {
      toast.error(error.message || 'Could not load notification settings');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  if (!boot && (!isAdminMode || !can('notifications.manage'))) {
    return <Navigate to="/clinic-portal/notifications" replace />;
  }

  const saveTemplate = async (template) => {
    try {
      await clinicPortal.saveNotificationTemplate(clinicId, template.id, {
        subject: template.subject || '',
        body_template: template.body || template.body_template || template.message || '',
        is_enabled: Boolean(Number(template.is_enabled)),
        mode: template.mode || 'auto',
        channels: template.channels_json
          ? (typeof template.channels_json === 'string'
            ? JSON.parse(template.channels_json)
            : template.channels_json)
          : ['in_app', 'email'],
      });
      toast.success('Template saved');
      load();
    } catch (error) {
      toast.error(error.message || 'Could not save template');
    }
  };

  const createCampaign = async (event) => {
    event.preventDefault();
    try {
      await clinicPortal.createCampaign(clinicId, {
        title: campaign.name,
        message: campaign.message,
        campaign_type: 'broadcast',
        channels: [campaign.channel === 'push' ? 'in_app' : campaign.channel],
        filters: { audience: campaign.audience },
        subject: campaign.subject || '',
      });
      toast.success('Campaign created');
      setCampaign({ name: '', channel: 'email', audience: 'all', subject: '', message: '' });
      load();
    } catch (error) {
      toast.error(error.message || 'Could not create campaign');
    }
  };

  const send = async (row) => {
    if (!window.confirm(`Send "${row.title || row.name}" now?`)) return;
    try {
      await clinicPortal.sendCampaign(clinicId, row.id);
      toast.success('Campaign queued');
      load();
    } catch (error) {
      toast.error(error.message || 'Could not send campaign');
    }
  };

  return (
    <ClinicPortalShell
      title="Notification Management"
      subtitle="Templates and patient communication campaigns"
      actions={(
        <Link to="/clinic-portal/notifications" className="btn-outline text-sm">
          <FaIcon icon="fa-inbox" className="mr-2" />
          Inbox
        </Link>
      )}
    >
      <div className="flex gap-2 mb-4">
        {[['templates', 'Templates'], ['campaigns', 'Campaigns']].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${tab === id ? 'bg-slate-900 text-white' : 'bg-white border'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {boot || loading ? (
        <div className="glass-card h-72 animate-pulse" />
      ) : tab === 'templates' ? (
        <div className="space-y-4">
          {templates.map((template, index) => (
            <section key={template.id} className="glass-card !p-5">
              <div className="grid md:grid-cols-[180px_1fr] gap-4">
                <div>
                  <p className="font-bold">{template.name || template.event_key}</p>
                  <p className="text-xs text-slate-500 capitalize mt-1">{template.mode || 'auto'}</p>
                  <label className="text-xs flex gap-2 mt-3">
                    <input
                      type="checkbox"
                      checked={Boolean(Number(template.is_enabled))}
                      onChange={(e) => setTemplates((old) => old.map((t, i) => (i === index ? { ...t, is_enabled: e.target.checked } : t)))}
                    />
                    Enabled
                  </label>
                </div>
                <div className="space-y-2">
                  <input
                    className="input-field"
                    placeholder="Subject"
                    value={template.subject || ''}
                    onChange={(e) => setTemplates((old) => old.map((t, i) => (i === index ? { ...t, subject: e.target.value } : t)))}
                  />
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="Message template"
                    value={template.body || ''}
                    onChange={(e) => setTemplates((old) => old.map((t, i) => (i === index ? { ...t, body: e.target.value } : t)))}
                  />
                  <div className="text-right">
                    <button type="button" className="btn-primary text-xs !py-2" onClick={() => saveTemplate(templates[index])}>
                      Save template
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ))}
          {!templates.length && <div className="glass-card text-center text-sm text-slate-500 py-12">No templates configured.</div>}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-5">
          <section className="glass-card !p-0 overflow-hidden">
            <div className="p-4 border-b"><h2 className="font-bold">Campaign history</h2></div>
            <div className="divide-y">
              {campaigns.map((row) => (
                <div key={row.id} className="p-4 flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{row.title || row.name}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {(Array.isArray(row.channels_json) ? row.channels_json.join(', ') : (typeof row.channels_json === 'string' ? row.channels_json : 'in_app'))}
                      {' · '}
                      {row.campaign_type || 'broadcast'}
                      {' · '}
                      {row.status || 'draft'}
                    </p>
                  </div>
                  {['draft', 'scheduled', null, undefined].includes(row.status) && (
                    <button type="button" onClick={() => send(row)} className="btn-outline text-xs !py-1.5">Send</button>
                  )}
                </div>
              ))}
              {!campaigns.length && <p className="py-12 text-center text-sm text-slate-500">No campaigns yet.</p>}
            </div>
          </section>
          <form onSubmit={createCampaign} className="glass-card !p-5 space-y-3 self-start">
            <h2 className="font-bold">New campaign</h2>
            <input className="input-field" required placeholder="Campaign name" value={campaign.name} onChange={(e) => setCampaign({ ...campaign, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="input-field" value={campaign.channel} onChange={(e) => setCampaign({ ...campaign, channel: e.target.value })}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="in_app">In-App</option>
              </select>
              <select className="input-field" value={campaign.audience} onChange={(e) => setCampaign({ ...campaign, audience: e.target.value })}>
                <option value="all">All patients</option>
                <option value="active_packages">Active packages</option>
                <option value="due">Payment due</option>
                <option value="inactive">Inactive patients</option>
              </select>
            </div>
            <input className="input-field" placeholder="Subject" value={campaign.subject} onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })} />
            <textarea className="input-field" required rows={6} placeholder="Message" value={campaign.message} onChange={(e) => setCampaign({ ...campaign, message: e.target.value })} />
            <button type="submit" className="btn-primary w-full justify-center">Create campaign</button>
          </form>
        </div>
      )}
    </ClinicPortalShell>
  );
}
