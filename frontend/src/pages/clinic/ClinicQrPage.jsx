import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

const LABELS = {
  intake: ['Patient intake', 'Register new or returning patients at the front desk'],
  booking: ['Book appointment', 'Open the clinic booking experience for walk-ins'],
  report: ['Progress report', 'Patients can open their visit progress reports'],
};

function appOriginPath(path) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${base}${clean}`;
}

function purposeUrl(purpose, token) {
  // Always use the current SPA origin + Vite basename (never the API host)
  if (purpose === 'report') return appOriginPath(`/clinic-report/${token}`);
  if (purpose === 'booking') return appOriginPath(`/clinic-intake/${token}?intent=booking`);
  return appOriginPath(`/c/${token}`);
}

function qrImageUrl(url, size = 240) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(url)}`;
}

export default function ClinicQrPage() {
  const { clinicId, can, isAdminMode, loading: boot } = useClinicPortal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    setError('');
    try {
      const res = await clinicPortal.qrInfo(clinicId);
      setData(res.data || res);
    } catch (err) {
      setData(null);
      setError(err.message || 'Could not load QR codes');
      toast.error(err.message || 'Could not load QR codes');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId, load]);

  const regenerate = async () => {
    if (!window.confirm('Regenerate the intake QR? Previously printed intake codes will stop working.')) return;
    setRegenerating(true);
    try {
      await clinicPortal.qrRegenerate(clinicId);
      toast.success('Intake QR regenerated');
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not regenerate QR');
    } finally {
      setRegenerating(false);
    }
  };

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const download = (url, name) => {
    const a = document.createElement('a');
    a.href = qrImageUrl(url, 480);
    a.download = `${name || 'clinic-qr'}.png`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  };

  const tokens = data?.tokens || {};
  const tokenEntries = Object.keys(tokens);
  const branding = data?.branding;

  if (!boot && !can('qr.view')) {
    return <Navigate to="/clinic-portal" replace />;
  }

  return (
    <ClinicPortalShell
      title="Clinic QR Codes"
      subtitle="Printable links for intake, bookings and progress reports"
      actions={
        <div className="portal-page-actions print:hidden">
          <button type="button" className="btn-outline" onClick={load} disabled={loading}>
            <FaIcon icon="fa-rotate" className="mr-1.5" /> Refresh
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()} disabled={!tokenEntries.length}>
            <FaIcon icon="fa-print" className="mr-1.5" /> Print
          </button>
        </div>
      }
    >
      {boot || loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => <div key={n} className="glass-card h-96 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="glass-card text-center py-12">
          <FaIcon icon="fa-triangle-exclamation" className="text-4xl text-amber-400 mb-3" />
          <p className="font-semibold text-slate-800">Could not load QR codes</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
          <button type="button" className="btn-primary mt-5" onClick={load}>Try again</button>
        </div>
      ) : !tokenEntries.length ? (
        <div className="glass-card text-center py-12 text-slate-500">
          <FaIcon icon="fa-qrcode" className="text-4xl text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No QR codes yet</p>
          <p className="text-sm mt-1">Generate printable codes for this clinic.</p>
          <button type="button" className="btn-primary mt-4" onClick={load}>Generate QR codes</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-card !p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <FaIcon icon="fa-hospital" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{branding?.name || 'Your clinic'}</p>
                <p className="text-xs text-slate-500">Print and place these at reception, waiting area, or treatment rooms.</p>
              </div>
            </div>
            <ul className="text-xs text-slate-500 space-y-1 print:hidden shrink-0">
              <li className="flex items-center gap-1.5"><FaIcon icon="fa-check" className="text-teal-600" /> Intake = new patient registration</li>
              <li className="flex items-center gap-1.5"><FaIcon icon="fa-check" className="text-teal-600" /> Booking = open appointment flow</li>
              <li className="flex items-center gap-1.5"><FaIcon icon="fa-check" className="text-teal-600" /> Report = progress report portal</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(LABELS).map(([purpose, [title, desc]]) => {
              const item = tokens[purpose];
              if (!item) return null;
              const url = purposeUrl(purpose, item.token);
              const qrUrl = qrImageUrl(url);
              return (
                <section key={purpose} className="glass-card !p-4 sm:!p-5 text-center break-inside-avoid flex flex-col min-w-0">
                  <p className="text-[10px] uppercase tracking-wide font-bold text-teal-700">{purpose}</p>
                  <h2 className="font-bold text-slate-900 mt-1">{title}</h2>
                  <p className="text-xs text-slate-500 mt-1 min-h-10">{desc}</p>
                  <img
                    src={qrUrl}
                    alt={`${title} QR code`}
                    className="w-[200px] sm:w-[220px] h-[200px] sm:h-[220px] max-w-full mx-auto my-4 rounded-xl border border-slate-100 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 truncate" title={url}>{url}</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4 print:hidden mt-auto">
                    <button type="button" className="btn-outline text-xs !py-2" onClick={() => copy(url)}>
                      <FaIcon icon="fa-copy" className="mr-1" /> Copy
                    </button>
                    <button type="button" className="btn-outline text-xs !py-2" onClick={() => download(url, `${purpose}-qr`)}>
                      <FaIcon icon="fa-download" className="mr-1" /> Save
                    </button>
                    {purpose === 'intake' && isAdminMode && can('qr.manage') && (
                      <button type="button" className="btn-primary text-xs !py-2" disabled={regenerating} onClick={regenerate}>
                        <FaIcon icon="fa-rotate" className="mr-1" /> {regenerating ? '…' : 'Regenerate'}
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </ClinicPortalShell>
  );
}
