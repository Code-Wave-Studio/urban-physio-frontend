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

function LicenseField({ icon, label, children }) {
  return (
    <div className="flex min-w-0 items-start gap-3.5">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-600"
        aria-hidden="true"
      >
        <FaIcon icon={icon} className="text-sm" />
      </div>
      <div className="min-w-0 pt-0.5">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
        <dd className="mt-1 break-words text-[15px] font-semibold leading-snug text-slate-900">{children}</dd>
      </div>
    </div>
  );
}

const TRUST_POINTS = [
  { icon: 'fa-shield-halved', title: 'Secure & Licensed', text: 'Genuine, license-protected software.' },
  { icon: 'fa-headset', title: 'Maintained', text: 'Actively supported by the developer.' },
  { icon: 'fa-scale-balanced', title: 'Compliant', text: 'Used under valid license terms.' },
];

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
        <div className="mx-auto max-w-3xl space-y-4" role="status" aria-live="polite">
          <span className="sr-only">Loading license details</span>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 bg-primary-200" />
            <div className="space-y-6 p-5 sm:p-7 md:p-8">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-100" />
                <div className="space-y-2">
                  <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
                  <div className="h-6 w-44 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
              </div>
              <div className="h-24 animate-pulse rounded-xl bg-amber-50" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-16px_rgba(15,23,42,0.18)]">
            <div className="h-1 bg-primary-600" aria-hidden="true" />

            <div className="p-5 sm:p-7 md:p-8">
              <header>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm shadow-primary-600/25"
                      aria-hidden="true"
                    >
                      <FaIcon icon="fa-certificate" className="text-xl" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600">
                        Certificate of License
                      </p>
                      <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        Product License
                      </h2>
                    </div>
                  </div>

                  <span
                    role="status"
                    className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-xs font-semibold leading-none sm:self-center ${
                      valid
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    <FaIcon icon={valid ? 'fa-circle-check' : 'fa-circle-xmark'} className="text-[13px]" />
                    {valid ? 'Active & Valid' : 'Invalid'}
                  </span>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
                  This certifies that the software powering this website is licensed to the entity named below and is
                  developed and maintained by {CODEWAVE_DEVELOPER}.
                </p>
              </header>

              <dl className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
                <LicenseField icon="fa-building" label="Licensee">
                  {data?.licensee || 'The Urban Physio'}
                </LicenseField>
                <LicenseField icon="fa-code" label="Developer">
                  <a
                    href={data?.developer_url || CODEWAVE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 underline-offset-2 transition-colors hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-sm"
                  >
                    {data?.developer || CODEWAVE_DEVELOPER}
                  </a>
                </LicenseField>
                <LicenseField icon="fa-shield-halved" label="License status">
                  <span className={valid ? 'text-emerald-700' : 'text-red-700'}>
                    {valid ? 'Verified & Active' : 'Not verified'}
                  </span>
                </LicenseField>
                {issued && (
                  <LicenseField icon="fa-calendar-day" label="Issued on">
                    {issued}
                  </LicenseField>
                )}
              </dl>

              <aside
                className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 sm:px-5"
                aria-label="Protected attribution"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800"
                    aria-hidden="true"
                  >
                    <FaIcon icon="fa-lock" className="text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-amber-950">Protected attribution</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-amber-950/90">
                      The footer credit <span className="font-semibold">&ldquo;{CODEWAVE_ATTRIBUTION}&rdquo;</span> is a
                      mandatory part of this license. Removing, hiding, or altering it will automatically disable the
                      website across both the frontend and the API.
                    </p>
                  </div>
                </div>
              </aside>

              <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Authorised developer
                  </p>
                  <CodeWaveAttribution
                    className="mt-1 break-words text-[15px] font-semibold leading-snug text-slate-900 [&_a]:text-primary-600 [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:text-primary-700 hover:[&_a]:underline"
                    variant="footer"
                  />
                </div>
                <button
                  type="button"
                  onClick={verify}
                  disabled={verifying}
                  aria-busy={verifying}
                  className="btn-primary min-h-11 w-full gap-2 px-5 py-2.5 text-sm disabled:pointer-events-none disabled:opacity-70 sm:w-auto sm:min-w-[10.5rem]"
                >
                  {verifying ? (
                    <>
                      <FaIcon icon="fa-spinner" className="fa-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      <FaIcon icon="fa-rotate" className="btn-icon" />
                      Verify license
                    </>
                  )}
                </button>
              </div>
            </div>
          </article>

          <ul className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">
            {TRUST_POINTS.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-micro md:hover:-translate-y-0.5 md:hover:border-primary-200 md:hover:shadow-md"
              >
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-600">
                  <FaIcon icon={item.icon} />
                </div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.text}</p>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md font-semibold text-primary-600 underline-offset-2 transition-colors hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <FaIcon icon="fa-arrow-left" /> Back to home
            </Link>
          </p>
        </div>
      )}
    </InfoPageLayout>
    </>
  );
}
