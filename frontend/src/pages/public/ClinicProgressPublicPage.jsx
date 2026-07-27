import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import FaIcon from '../../components/FaIcon';
import { clinicQr } from '../../services/api';

function title(value) {
  return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function Value({ value }) {
  if (value == null || value === '') return <span className="text-slate-400">—</span>;
  if (Array.isArray(value)) return <span>{value.join(', ')}</span>;
  if (typeof value === 'object') {
    return (
      <div className="grid sm:grid-cols-2 gap-2 mt-2">
        {Object.entries(value).map(([key, item]) => (
          <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase text-slate-400">{title(key)}</p>
            <Value value={item} />
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

export default function ClinicProgressPublicPage() {
  const { token: pathToken } = useParams();
  const [search] = useSearchParams();
  const token = pathToken || search.get('token') || '';
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    clinicQr.progress(token)
      .then((res) => setReport(res.data || res))
      .catch((err) => setError(err.message || 'Report not found'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <main className="min-h-screen bg-slate-100 p-6"><div className="max-w-4xl mx-auto bg-white h-[70vh] rounded-2xl animate-pulse" /></main>;
  if (error) return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-md"><FaIcon icon="fa-file-circle-xmark" className="text-4xl text-rose-500" /><h1 className="text-xl font-bold mt-4">Report unavailable</h1><p className="text-sm text-slate-500 mt-2">{error}</p></div></main>;

  const payload = report?.payload || {};
  const patient = payload.patient || payload.patient_details || {};
  const clinic = payload.clinic || {};
  const entries = Object.entries(payload).filter(([key]) => !['patient', 'patient_details', 'clinic'].includes(key));

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-6 print:bg-white print:p-0">
      <article className="max-w-4xl mx-auto bg-white shadow-sm rounded-2xl overflow-hidden print:shadow-none print:rounded-none">
        <header className="border-b-4 border-teal-600 px-6 py-5 sm:px-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-teal-700">Progress report</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{clinic.name || payload.clinic_name || 'The Urban Physio'}</h1>
            <p className="text-xs text-slate-500 mt-1">{title(report.report_type || 'Clinical progress')}</p>
          </div>
          {clinic.logo_url && <img src={clinic.logo_url} alt="" className="h-14 w-14 object-contain" />}
          <button type="button" onClick={() => window.print()} className="btn-outline text-sm print:hidden"><FaIcon icon="fa-print" className="mr-2" />Print</button>
        </header>
        <div className="px-6 py-6 sm:px-10">
          <section className="grid sm:grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">
            <div><p className="text-[10px] uppercase text-slate-400">Patient</p><p className="font-semibold">{patient.name || payload.patient_name || 'Patient'}</p></div>
            <div><p className="text-[10px] uppercase text-slate-400">Report date</p><p className="font-semibold">{new Date(report.created_at).toLocaleDateString('en-IN')}</p></div>
            <div><p className="text-[10px] uppercase text-slate-400">Reference</p><p className="font-mono text-xs break-all">{payload.reference || token.slice(0, 12)}</p></div>
          </section>
          <div className="mt-6 space-y-5">
            {entries.map(([key, value]) => (
              <section key={key} className="break-inside-avoid">
                <h2 className="font-bold text-slate-900 border-b border-slate-200 pb-2">{title(key)}</h2>
                <div className="text-sm text-slate-700 mt-3"><Value value={value} /></div>
              </section>
            ))}
            {!entries.length && <p className="text-center text-slate-500 py-12">No report details are available.</p>}
          </div>
        </div>
        <footer className="px-6 py-4 sm:px-10 bg-slate-50 text-[11px] text-slate-400">{payload.footer || 'This report is intended for the patient and their treating care team.'}</footer>
      </article>
    </main>
  );
}
