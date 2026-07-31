import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import InfoPageLayout from '../components/InfoPageLayout';
import FaIcon from '../components/FaIcon';
import CodeWaveAttribution from '../core/CodeWaveAttribution';
import { CODEWAVE_ATTRIBUTION, CODEWAVE_DEVELOPER, CODEWAVE_URL } from '../core/codewaveLicense';
import { license as licenseApi } from '../services/api';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';

function fmtDate(value) {
  if (!value) return null;
  const dt = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function DetailRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
        <FaIcon icon={icon} className="text-sm" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <div className="text-slate-800 font-medium mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

export default function LicensePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const load = () => {
    setLoading(true);
    licenseApi
      .show()
      .then((res) => setData(res?.data ?? res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const verify = async () => {
    setVerifying(true);
    try {
      const res = await licenseApi.verify();
      const payload = res?.data ?? res;
      setData((prev) => ({ ...prev, ...payload }));
      toast.success('License verified — attribution intact');
    } catch (e) {
      toast.error(e?.message || 'License verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const valid = !!data?.valid;
  const issued = fmtDate(data?.issued_at);

  return (
    <>
    <ManagedPageSeo
      fallbackTitle="Software License"
      fallbackDescription="This platform is officially licensed software. The developer attribution is protected under the license agreement."
      noindex
    />
    <InfoPageLayout
      title="Software License"
      subtitle="This platform is officially licensed software. The developer attribution is protected under the license agreement."
      icon="fa-certificate"
      accent="from-slate-800 via-slate-900 to-primary-900"
      breadcrumb="Legal"
    >
      {loading ? (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
          <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          {/* Certificate */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            {/* decorative top band */}
            <div className="h-2 w-full bg-gradient-to-r from-primary-500 via-orange-500 to-primary-600" />

            {/* watermark seal */}
            <FaIcon
              icon="fa-shield-halved"
              className="pointer-events-none absolute -right-6 -bottom-6 text-[11rem] text-slate-50 select-none"
            />

            <div className="relative p-6 md:p-9">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <FaIcon icon="fa-certificate" className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600">Certificate of License</p>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">Product License</h2>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-sm font-semibold border ${
                    valid
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  <FaIcon icon={valid ? 'fa-circle-check' : 'fa-circle-xmark'} />
                  {valid ? 'Active & Valid' : 'Invalid'}
                </span>
              </div>

              <p className="text-slate-500 text-sm mt-5 leading-relaxed">
                This certifies that the software powering this website is licensed to the entity named below and is
                developed and maintained by {CODEWAVE_DEVELOPER}.
              </p>

              {/* details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 mt-4 divide-y sm:divide-y-0 divide-slate-100">
                <DetailRow icon="fa-building" label="Licensee">
                  {data?.licensee || 'The Urban Physio'}
                </DetailRow>
                <DetailRow icon="fa-code" label="Developer">
                  <a
                    href={data?.developer_url || CODEWAVE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {data?.developer || CODEWAVE_DEVELOPER}
                  </a>
                </DetailRow>
                <DetailRow icon="fa-shield-halved" label="License status">
                  <span className={valid ? 'text-emerald-700' : 'text-red-700'}>
                    {valid ? 'Verified & Active' : 'Not verified'}
                  </span>
                </DetailRow>
                {issued && (
                  <DetailRow icon="fa-calendar-day" label="Issued on">
                    {issued}
                  </DetailRow>
                )}
              </div>

              {/* protected attribution */}
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 md:p-5">
                <p className="font-semibold text-amber-900 flex items-center gap-2">
                  <FaIcon icon="fa-lock" /> Protected attribution
                </p>
                <p className="mt-2 text-sm text-amber-900/90 leading-relaxed">
                  The footer credit <span className="font-semibold">&ldquo;{CODEWAVE_ATTRIBUTION}&rdquo;</span> is a
                  mandatory part of this license. Removing, hiding, or altering it will automatically disable the website
                  across both the frontend and the API.
                </p>
              </div>

              {/* signature / attribution marker (required) */}
              <div className="mt-6 pt-5 border-t border-dashed border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Authorised developer</p>
                  <CodeWaveAttribution className="text-slate-800 font-semibold" variant="footer" />
                </div>
                <button
                  type="button"
                  onClick={verify}
                  disabled={verifying}
                  className="btn-primary self-start sm:self-auto"
                >
                  {verifying ? (
                    <FaIcon icon="fa-spinner" className="fa-spin mr-2" />
                  ) : (
                    <FaIcon icon="fa-rotate" className="mr-2" />
                  )}
                  Verify license
                </button>
              </div>
            </div>
          </div>

          {/* trust badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {[
              { icon: 'fa-shield-halved', title: 'Secure & Licensed', text: 'Genuine, license-protected software.' },
              { icon: 'fa-headset', title: 'Maintained', text: 'Actively supported by the developer.' },
              { icon: 'fa-scale-balanced', title: 'Compliant', text: 'Used under valid license terms.' },
            ].map((b) => (
              <div key={b.title} className="glass-card !p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-2">
                  <FaIcon icon={b.icon} />
                </div>
                <p className="font-semibold text-slate-800 text-sm">{b.title}</p>
                <p className="text-xs text-slate-500 mt-1">{b.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center">
            <Link to="/" className="text-primary-600 font-semibold hover:underline inline-flex items-center gap-1.5">
              <FaIcon icon="fa-arrow-left" /> Back to home
            </Link>
          </p>
        </div>
      )}
    </InfoPageLayout>
    </>
  );
}
