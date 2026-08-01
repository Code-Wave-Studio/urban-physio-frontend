import { Link } from 'react-router-dom';
import InfoPageLayout from '../components/InfoPageLayout';
import FaIcon from '../components/FaIcon';
import { CANCELLATION_STEPS, CANCELLATION_TIMELINE } from '../constants/supportPages';
import { useContact } from '../contexts/ContactContext';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';

const COLOR_MAP = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  red: 'border-red-200 bg-red-50 text-red-800',
  primary: 'border-primary-200 bg-primary-50 text-primary-800',
  violet: 'border-violet-200 bg-violet-50 text-violet-800',
};

export default function CancellationHelpPage() {
  const { email } = useContact();

  return (
    <>
    <ManagedPageSeo
      fallbackTitle="Cancellation Help"
      fallbackDescription="How to cancel a physiotherapy session, what refunds to expect, and how long payments take to return."
    />
    <InfoPageLayout
      title="Cancellation Help"
      subtitle="How to cancel a session, what refunds to expect, and how long payments take to return."
      icon="fa-calendar-xmark"
      accent="from-amber-500 to-orange-600"
      breadcrumb="Support"
      heroExtra={
        <Link
          to="/refund-policy"
          className="inline-flex items-center gap-2 bg-white text-amber-900 font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-50 text-sm shrink-0"
        >
          <FaIcon icon="fa-file-contract" />
          Full refund policy
        </Link>
      }
    >
      <div className="glass-card !p-5 md:!p-6 mb-8 border-amber-200/80 bg-amber-50/50">
        <p className="text-sm text-amber-950 leading-relaxed flex gap-2">
          <FaIcon icon="fa-circle-info" className="mt-0.5 shrink-0 text-amber-600" />
          <span>
            Refund amounts depend on <strong>who cancels</strong> and <strong>how much notice</strong> you give.
            Always include your <strong>booking ID</strong> (e.g. TUP-20250523-A1B2C3) when contacting support.
          </span>
        </p>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-4">Refund at a glance</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {CANCELLATION_TIMELINE.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-5 ${COLOR_MAP[item.color] || COLOR_MAP.primary}`}
          >
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
                <FaIcon icon={item.icon} />
              </span>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-lg font-bold mt-1">{item.refund}</p>
                <p className="text-sm mt-2 opacity-90 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-4">How to request a cancellation</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {CANCELLATION_STEPS.map((s) => (
          <div key={s.step} className="glass-card !p-5 relative">
            <span className="text-3xl font-black text-primary-100 absolute top-3 right-4">{s.step}</span>
            <span className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-3">
              <FaIcon icon={s.icon} />
            </span>
            <p className="font-semibold text-slate-900 text-sm">{s.title}</p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card !p-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-envelope" className="text-primary-600" />
            Email support
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Send cancellation requests to{' '}
            <a href={`mailto:${email}`} className="text-primary-700 font-medium hover:underline">
              {email}
            </a>{' '}
            with subject line: <em>Cancel booking [your TUP-ID]</em>.
          </p>
          <Link to="/contact" className="btn-outline text-sm mt-4 inline-flex">
            Contact form
          </Link>
        </div>
        <div className="glass-card !p-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-user" className="text-primary-600" />
            Patient dashboard
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            View upcoming and past appointments under your account. For refunds after payment, support must process
            per policy — pending bookings may be cancelled before doctor acceptance.
          </p>
          <Link to="/patient/appointments" className="btn-primary text-sm mt-4 inline-flex">
            My appointments
          </Link>
        </div>
      </div>
    </InfoPageLayout>
    </>
  );
}
