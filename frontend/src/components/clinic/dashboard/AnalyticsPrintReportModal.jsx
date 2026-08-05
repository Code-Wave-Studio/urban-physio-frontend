import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import FaIcon from '../../FaIcon';
import GlassModal, { GlassModalBody, GlassModalHeader } from '../../GlassModal';

function formatDateLabel(dStr) {
  if (!dStr) return 'All Time';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dStr;
  }
}

export default function AnalyticsPrintReportModal({ open, onClose, reportData, loading, clinicDetails = {} }) {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.classList.add('tup-report-modal-open');
    } else {
      document.body.classList.remove('tup-report-modal-open');
    }
    return () => document.body.classList.remove('tup-report-modal-open');
  }, [open]);

  if (!open) return null;

  const title = reportData?.report_title || 'Analytics & Business Intelligence Report';
  const clinicName = reportData?.clinic_name || clinicDetails?.name || 'The Urban Physio Clinic';
  const branchName = clinicDetails?.branch_name || clinicDetails?.city || '';
  const clinicAddress = clinicDetails?.address || clinicDetails?.location || '';
  const clinicLogo = clinicDetails?.logo_url || '';
  const headers = reportData?.headers || [];
  const rows = reportData?.rows || [];
  const kpis = reportData?.summary_kpis || [];
  const fromDate = formatDateLabel(reportData?.from);
  const toDate = formatDateLabel(reportData?.to);
  const generatedAt = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 150);
  };

  const reportMarkup = (
    <div
      id="urban-physio-print-root"
      className="bg-white p-6 sm:p-8 text-slate-800 space-y-6"
    >
      {/* Official Clinic Report Header */}
      <div className="border-b-2 border-teal-600 pb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {clinicLogo ? (
              <img src={clinicLogo} alt={clinicName} className="h-10 max-w-[120px] object-contain" />
            ) : (
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                UP
              </span>
            )}
            <div>
              <p className="text-base font-extrabold text-teal-800 tracking-tight uppercase">{clinicName}</p>
              {branchName && <p className="text-xs text-slate-500 font-semibold">{branchName}</p>}
            </div>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 mt-3">{title}</h1>
          {clinicAddress && <p className="text-xs text-slate-500">{clinicAddress}</p>}
        </div>

        <div className="text-right text-xs space-y-1 bg-slate-50 border border-slate-200/80 p-3 rounded-xl min-w-[210px]">
          <p className="text-slate-500">
            <strong className="text-slate-800">Date Range:</strong> {fromDate} &mdash; {toDate}
          </p>
          <p className="text-slate-500">
            <strong className="text-slate-800">Generated On:</strong> {generatedAt}
          </p>
          <p className="text-slate-500">
            <strong className="text-slate-800">System:</strong> The Urban Physio BI Engine
          </p>
        </div>
      </div>

      {/* Executive Summary KPIs */}
      {kpis.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Executive Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80">
                <p className="text-[11px] font-semibold text-slate-500 uppercase truncate">{kpi.label}</p>
                <p className="text-base font-bold text-slate-900 mt-1 truncate">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Data Table */}
      <div className="space-y-2">
        <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Detailed Analytics Breakdown</h4>
        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
                  {headers.map((h, i) => (
                    <th key={i} className="py-2.5 px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    {headers.map((h, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3 text-slate-800 font-medium">
                        {row[h] !== undefined && row[h] !== null ? String(row[h]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500 border rounded-xl border-dashed">
            No report data available for the selected filters.
          </div>
        )}
      </div>

      {/* Printable Footer */}
      <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
        <p className="font-semibold text-slate-600">
          &copy; {new Date().getFullYear()} The Urban Physio Healthcare Platform. Confidential &mdash; For Internal Management Use Only.
        </p>
        <p>Official Analytics &amp; Performance Report</p>
      </div>
    </div>
  );

  return (
    <>
      <GlassModal open={open} onClose={onClose} maxWidth="max-w-4xl">
        <GlassModalHeader className="no-print border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between gap-3 w-full pr-8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <FaIcon icon="fa-print" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Report Print Studio</h3>
                <p className="text-xs text-slate-500">Preview &amp; print publication-ready report document</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={loading || printing || !rows.length}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <FaIcon icon={printing ? 'fa-circle-notch' : 'fa-print'} className={printing ? 'animate-spin' : ''} />
                <span>{printing ? 'Preparing...' : 'Print Official Report'}</span>
              </button>
            </div>
          </div>
        </GlassModalHeader>

        <GlassModalBody className="p-4 sm:p-6 overflow-y-auto max-h-[78vh]">
          {loading ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <FaIcon icon="fa-circle-notch" className="animate-spin text-3xl text-teal-600" />
              <p className="text-sm font-medium">Preparing printable report data...</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {reportMarkup}
            </div>
          )}
        </GlassModalBody>
      </GlassModal>

      {/* React Portal to mount printable root directly under document.body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="tup-print-only-portal">
            {reportMarkup}
          </div>,
          document.body
        )}

      {/* Global & Print CSS */}
      <style>{`
        .tup-print-only-portal {
          display: none;
        }

        @media print {
          /* Hide all screen elements except the standalone print portal */
          body > *:not(.tup-print-only-portal) {
            display: none !important;
          }
          .tup-print-only-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          #urban-physio-print-root {
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm 12mm 15mm 12mm;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}
