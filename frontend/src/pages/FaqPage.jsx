import { Link } from 'react-router-dom';
import InfoPageLayout from '../components/InfoPageLayout';
import FaqSection from '../components/FaqSection';
import FaIcon from '../components/FaIcon';
import { SITE_FAQS } from '../constants/supportPages';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';

export default function FaqPage() {
  return (
    <>
    <ManagedPageSeo
      fallbackTitle="Frequently Asked Questions"
      fallbackDescription="Everything you need to know about booking, sessions, payments, and care on The Urban Physio."
    />
    <InfoPageLayout
      title="Frequently Asked Questions"
      subtitle="Everything you need to know about booking, sessions, payments, and care on The Urban Physio."
      icon="fa-circle-question"
      accent="from-orange-600 to-primary-600"
      breadcrumb="Help Centre"
      heroExtra={
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-50 text-sm"
          >
            <FaIcon icon="fa-envelope" />
            Contact us
          </Link>
          <Link
            to="/cancellation-help"
            className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-white/20 text-sm"
          >
            Cancellation help
          </Link>
        </div>
      }
    >
      <div className="mb-8 grid sm:grid-cols-3 gap-3">
        {[
          { icon: 'fa-calendar-check', label: 'Booking', to: '/book' },
          { icon: 'fa-rotate-left', label: 'Cancellations', to: '/cancellation-help' },
          { icon: 'fa-file-contract', label: 'Policies', to: '/refund-policy' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="glass-card !p-4 flex items-center gap-3 hover:border-primary-200 transition group"
          >
            <span className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition">
              <FaIcon icon={item.icon} />
            </span>
            <span className="font-medium text-slate-800 group-hover:text-primary-700">{item.label}</span>
            <FaIcon icon="fa-arrow-right" className="ml-auto text-slate-400 text-xs" />
          </Link>
        ))}
      </div>

      <FaqSection
        items={SITE_FAQS}
        title="All questions"
        subtitle="Tap a question to expand the answer. Can’t find what you need? Our support team is one message away."
        showContact={false}
      />

      <div className="mt-10 glass-card !p-6 md:!p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">Still need help?</h2>
        <p className="text-slate-600 mt-2 text-sm max-w-lg mx-auto">
          Reach out by email or phone — we typically respond within 24 hours on business days.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          <Link to="/contact" className="btn-primary text-sm">
            Contact support
          </Link>
          <Link to="/book" className="btn-outline text-sm">
            Book appointment
          </Link>
        </div>
      </div>
    </InfoPageLayout>
    </>
  );
}
