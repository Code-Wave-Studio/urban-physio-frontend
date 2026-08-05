import { useEffect } from 'react';
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

export default function AnalyticsPrintReportModal({ open, onClose, reportData, loading }) {
  useEffect(() => {
    // Add print class to body when modal opens
    if (open) {
      document.body.classList.add('analytics-print-active');
    } else {
      document.body.classList.remove('analytics-print-active');
    }
    return () => document.body.classList.remove('analytics-print-active');
  }, [open]);

  if (!open) return null;

  const title = reportData?.report_title || 'Analytics & Business Intelligence Report';
  const clinicName = reportData?.clinic_name || 'The Urban Physio Clinic';
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
    window.print();
  };

  return (
    <GlassModal open={open} onClose={onClose} maxWidth="max-w-4xl">
      {/* Non-printable Modal Header with Print Controls */}
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
              disabled={loading || !rows.length}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <FaIcon icon="fa-print" />
              <span>Print Official Report</span>
            </button>
          </div>
        </div>
      </GlassModalHeader>

      <GlassModalBody className="p-4 sm:p-6 overflow-y-auto max-h-[80vh]">
        {loading ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <FaIcon icon="fa-circle-notch" className="animate-spin text-3xl text-teal-600" />
            <p className="text-sm font-medium">Preparing printable report data...</p>
          </div>
        ) : (
          <div
            id="printable-analytics-report"
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm text-slate-800 space-y-6"
          >
            {/* Print Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-teal-600 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-teal-800 font-extrabold text-xl tracking-tight">
                  <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center text-sm shadow">
                    UP
                  </span>
                  <span>THE URBAN PHYSIO</span>
                </div>
                <h1 className="text-lg font-bold text-slate-900 mt-2">{title}</h1>
                <p className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md inline-block">
                  {clinicName}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 space-y-1">
                <p>
                  <strong className="text-slate-700">Date Range:</strong> {fromDate} &mdash; {toDate}
                </p>
                <p>
                  <strong className="text-slate-700">Generated On:</strong> {generatedAt}
                </p>
                <p>
                  <strong className="text-slate-700">Scope:</strong> Business Intelligence &amp; Analytics
                </p>
              </div>
            </div>

            {/* Summary KPI Cards */}
            {kpis.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Executive Summary KPIs</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {kpis.map((kpi, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase truncate">{kpi.label}</p>
                      <p className="text-base font-bold text-slate-900 mt-1 truncate">{kpi.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formatted Data Table */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Detailed Data Breakdown</h4>
              {rows.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                        {headers.map((h, i) => (
                          <th key={i} className="py-2.5 px-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
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
                  No data available for the selected report filters.
                </div>
              )}
            </div>

            {/* Official Report Footer */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
              <p className="font-semibold text-slate-600">
                &copy; {new Date().getFullYear()} The Urban Physio Healthcare Platform. Confidential &mdash; For Clinic Management Use Only.
              </p>
              <p>Generated by AI Analytics &amp; Reporting Engine</p>
            </div>
          </div>
        )}
      </GlassModalBody>

      {/* Embedded CSS for Print Styling */}
      <style>{`
        @media print {
          /* Hide non-printable elements */
          body * {
            visibility: hidden !important;
          }
          .no-print, nav, header, sidebar, button, input, select, .glass-card-header {
            display: none !important;
          }
          #printable-analytics-report, #printable-analytics-report * {
            visibility: visible !important;
          }
          #printable-analytics-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: auto;
            margin: 15mm;
          }
        }
      `}</style>
    </GlassModal>
  );
}
