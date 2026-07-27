import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import useClinicPortal from '../../hooks/useClinicPortal';
import { clinicPortal } from '../../services/api';

const LABELS = {
  intake: ['Patient intake', 'Register new or returning patients'],
  booking: ['Book appointment', 'Open the clinic booking experience'],
  report: ['Progress report', 'Open a patient progress report'],
};

function purposeUrl(purpose, token, publicUrl) {
  if (publicUrl) return publicUrl.startsWith('http') ? publicUrl : `${window.location.origin}${publicUrl}`;
  if (purpose === 'report') return `${window.location.origin}/clinic-report/${token}`;
  if (purpose === 'booking') return `${window.location.origin}/clinic-intake/${token}?intent=booking`;
  return `${window.location.origin}/c/${token}`;
}

export default function ClinicQrPage() {
  const { clinicId, can, isAdminMode, loading: boot } = useClinicPortal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicPortal.qrInfo(clinicId);
      setData(res.data || res);
    } catch (error) {
      toast.error(error.message || 'Could not load QR codes');
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
    } catch (error) {
      toast.error(error.message || 'Could not regenerate QR');
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

  const tokens = data?.tokens || {};

  return (
    <ClinicPortalShell
      title="Clinic QR Codes"
      subtitle="Printable links for intake, bookings and progress reports"
      actions={
        <button type="button" className="btn-outline text-sm" onClick={() => window.print()}>
          <FaIcon icon="fa-print" className="mr-2" /> Print
        </button>
      }
    >
      {boot || loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => <div key={n} className="glass-card h-96 animate-pulse" />)}
        </div>
      ) : !Object.keys(tokens).length ? (
        <div className="glass-card text-center py-12 text-slate-500">
          <FaIcon icon="fa-qrcode" className="text-4xl text-slate-300 mb-3" />
          <p>No QR codes are available for this clinic.</p>
          <button type="button" className="btn-outline mt-4" onClick={load}>Try again</button>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.branding?.name && (
            <div className="glass-card !p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <FaIcon icon="fa-hospital" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{data.branding.name}</p>
                <p className="text-xs text-slate-500">Share only the QR code appropriate for the patient journey.</p>
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(LABELS).map(([purpose, [title, desc]]) => {
              const item = tokens[purpose];
              if (!item) return null;
              const url = purposeUrl(purpose, item.token, item.public_url);
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
              return (
                <section key={purpose} className="glass-card !p-5 text-center break-inside-avoid">
                  <p className="text-xs uppercase tracking-wide font-bold text-teal-700">{purpose}</p>
                  <h2 className="font-bold text-slate-900 mt-1">{title}</h2>
                  <p className="text-xs text-slate-500 mt-1 min-h-8">{desc}</p>
                  <img
                    src={qrUrl}
                    alt={`${title} QR code`}
                    className="w-[220px] h-[220px] max-w-full mx-auto my-4 rounded-xl border border-slate-100"
                  />
                  <p className="text-[11px] text-slate-400 truncate" title={url}>{url}</p>
                  <div className="flex justify-center gap-2 mt-4 print:hidden">
                    <button type="button" className="btn-outline text-xs !py-2" onClick={() => copy(url)}>
                      <FaIcon icon="fa-copy" className="mr-1" /> Copy link
                    </button>
                    {purpose === 'intake' && isAdminMode && can('qr.manage') && (
                      <button type="button" className="btn-primary text-xs !py-2" disabled={regenerating} onClick={regenerate}>
                        <FaIcon icon="fa-rotate" className="mr-1" /> {regenerating ? 'Regenerating…' : 'Regenerate'}
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
