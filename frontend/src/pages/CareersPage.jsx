import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import InfoPageLayout from '../components/InfoPageLayout';
import FaIcon from '../components/FaIcon';
import { careers } from '../services/api';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';

const BENEFITS = [
  { icon: 'fa-users', title: 'Reach more patients', text: 'Get discovered by thousands of patients searching for physiotherapy near them.' },
  { icon: 'fa-magnifying-glass-chart', title: 'Increase visibility', text: 'SEO-optimised profiles put your practice in front of the right people.' },
  { icon: 'fa-calendar-check', title: 'Online bookings', text: 'Accept appointments 24/7 with automated scheduling and reminders.' },
  { icon: 'fa-laptop-medical', title: 'Digital practice management', text: 'Manage appointments, documents, and treatment plans from one dashboard.' },
  { icon: 'fa-heart-pulse', title: 'Better patient engagement', text: 'Share exercises, reports, and progress timelines to keep patients on track.' },
  { icon: 'fa-shield-halved', title: 'Secure platform', text: 'Role-based access, encrypted storage, and full audit logs protect your data.' },
  { icon: 'fa-bullhorn', title: 'Marketing support', text: 'Benefit from platform-wide campaigns, featured listings, and reviews.' },
  { icon: 'fa-arrow-trend-up', title: 'Growth opportunities', text: 'Scale from a solo practice to a multi-clinic operation with our tools.' },
];

const VERIFICATION_STEPS = [
  { icon: 'fa-file-arrow-up', title: 'Submit application', text: 'Apply online with your professional details and documents.' },
  { icon: 'fa-id-card-clip', title: 'Credential check', text: 'We verify your qualification, registration, and identity.' },
  { icon: 'fa-clipboard-check', title: 'Profile review', text: 'Our team reviews your profile for quality and completeness.' },
  { icon: 'fa-circle-check', title: 'Go live', text: 'Once approved, your verified profile is live for bookings.' },
];

const REGISTRATION_STEPS = [
  { icon: 'fa-user-plus', title: 'Create your account', text: 'Register as a physiotherapist or list your clinic.' },
  { icon: 'fa-address-card', title: 'Complete your profile', text: 'Add your specialisations, services, hours, and photos.' },
  { icon: 'fa-sliders', title: 'Set availability & pricing', text: 'Configure slots, consultation types, and fees.' },
  { icon: 'fa-rocket', title: 'Start receiving patients', text: 'Get bookings and manage your practice digitally.' },
];

const PHYSIO_DOCS = [
  'Government photo ID (Aadhaar / PAN / Passport)',
  'Physiotherapy degree / diploma certificate',
  'Professional registration / council number',
  'Recent passport-size photograph',
  'Proof of experience (optional)',
];

const CLINIC_DOCS = [
  'Clinic registration / establishment proof',
  'Owner / authorised person ID proof',
  'Clinic address proof',
  'GST certificate (if applicable)',
  'Clinic photos & logo',
];

const FAQS = [
  { q: 'Who can join The Urban Physio?', a: 'Licensed physiotherapists and registered physiotherapy clinics across India can join. We verify credentials before approval.' },
  { q: 'Is there a fee to join?', a: 'Creating a profile is free. Commission or subscription terms are shared transparently during onboarding — see our registration terms.' },
  { q: 'How long does verification take?', a: 'Most applications are reviewed within 2–5 business days once all documents are submitted.' },
  { q: 'Can I manage multiple clinics?', a: 'Yes. Doctors can list and manage multiple clinics, and clinic tools are expanding continuously.' },
  { q: 'How do patients find me?', a: 'Your verified profile appears in search, city landing pages, and doctor/clinic listings, optimised for discovery.' },
  { q: 'How do I get paid?', a: 'Payouts and payment settings are configured in your dashboard. Details are covered in the registration terms.' },
];

const EMPTY_FORM = {
  applicant_type: 'physiotherapist',
  name: '',
  email: '',
  phone: '',
  city: '',
  experience: '',
  specialization: '',
  clinic_name: '',
  message: '',
};

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
      {eyebrow && (
        <span className="inline-block text-primary-600 font-semibold text-sm uppercase tracking-wider mb-2">{eyebrow}</span>
      )}
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-slate-600 mt-3">{subtitle}</p>}
    </div>
  );
}

export default function CareersPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isClinic = form.applicant_type === 'clinic';

  const scrollToApply = () => {
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Please fill in name, email and phone');
      return;
    }
    setSubmitting(true);
    try {
      const res = await careers.apply(form);
      toast.success(res.message || 'Application submitted!');
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.message || 'Could not submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const heroExtra = (
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={scrollToApply} className="btn-glass">
        <FaIcon icon="fa-paper-plane" className="mr-2" /> Apply Now
      </button>
      <Link to="/doctor/register" className="btn-glass">
        <FaIcon icon="fa-user-doctor" className="mr-2" /> Register as Physio
      </Link>
    </div>
  );

  return (
    <>
    <ManagedPageSeo
      fallbackTitle="Careers & Partnerships"
      fallbackDescription="Grow your physiotherapy practice with India's modern digital care platform. Join as a physiotherapist or partner your clinic with The Urban Physio."
    />
    <InfoPageLayout
      title="Careers & Partnerships"
      subtitle="Grow your physiotherapy practice with India's modern digital care platform. Join as a physiotherapist or partner your clinic with The Urban Physio."
      icon="fa-briefcase"
      accent="from-primary-600 to-orange-700"
      breadcrumb="Careers"
      heroExtra={heroExtra}
    >
      {/* Join options */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card flex flex-col">
          <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-4">
            <FaIcon icon="fa-user-doctor" className="text-xl" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Join as a Physiotherapist</h3>
          <p className="text-slate-600 mt-2 flex-1">
            Independent practitioners get a verified profile, online bookings, and digital tools to manage patients and grow.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link to="/doctor/register" className="btn-primary">
              <FaIcon icon="fa-arrow-right" className="mr-2" /> Get started
            </Link>
            <Link to="/doctor-registration-terms" className="text-primary-600 font-medium self-center hover:underline">
              View terms
            </Link>
          </div>
        </div>

        <div className="glass-card flex flex-col">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
            <FaIcon icon="fa-hospital" className="text-xl" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Join as a Clinic</h3>
          <p className="text-slate-600 mt-2 flex-1">
            List your clinic, showcase your team and facilities, and receive online bookings with powerful management tools.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                set('applicant_type', 'clinic');
                scrollToApply();
              }}
              className="btn-primary"
            >
              <FaIcon icon="fa-arrow-right" className="mr-2" /> Partner with us
            </button>
            <Link to="/clinic-registration-terms" className="text-primary-600 font-medium self-center hover:underline">
              View terms
            </Link>
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="mt-12 md:mt-16">
        <SectionHeading
          eyebrow="Why Join"
          title="Why join The Urban Physio"
          subtitle="We combine patient reach, modern software, and a trusted brand so you can focus on care while we help you grow."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="glass-card h-full">
              <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
                <FaIcon icon={b.icon} className="text-lg" />
              </div>
              <h4 className="font-semibold text-slate-900">{b.title}</h4>
              <p className="text-sm text-slate-600 mt-1.5">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Registration process */}
      <section className="mt-12 md:mt-16">
        <SectionHeading eyebrow="Get Started" title="Registration process" subtitle="Four simple steps to start receiving patients." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REGISTRATION_STEPS.map((s, i) => (
            <div key={s.title} className="glass-card relative h-full">
              <span className="absolute top-4 right-4 text-4xl font-black text-primary-100 select-none">{i + 1}</span>
              <div className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center mb-3">
                <FaIcon icon={s.icon} className="text-lg" />
              </div>
              <h4 className="font-semibold text-slate-900">{s.title}</h4>
              <p className="text-sm text-slate-600 mt-1.5">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verification process */}
      <section className="mt-12 md:mt-16">
        <SectionHeading eyebrow="Trust & Safety" title="Verification process" subtitle="Every professional is verified to keep patients safe and your brand trusted." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VERIFICATION_STEPS.map((s) => (
            <div key={s.title} className="glass-card h-full text-center">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mb-3 mx-auto">
                <FaIcon icon={s.icon} className="text-lg" />
              </div>
              <h4 className="font-semibold text-slate-900">{s.title}</h4>
              <p className="text-sm text-slate-600 mt-1.5">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Required documents */}
      <section className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-user-doctor" className="text-primary-600" /> Documents — Physiotherapist
          </h3>
          <ul className="mt-4 space-y-2.5">
            {PHYSIO_DOCS.map((d) => (
              <li key={d} className="flex items-start gap-2.5 text-sm text-slate-700">
                <FaIcon icon="fa-circle-check" className="text-emerald-500 mt-0.5 shrink-0" /> {d}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-hospital" className="text-teal-600" /> Documents — Clinic
          </h3>
          <ul className="mt-4 space-y-2.5">
            {CLINIC_DOCS.map((d) => (
              <li key={d} className="flex items-start gap-2.5 text-sm text-slate-700">
                <FaIcon icon="fa-circle-check" className="text-emerald-500 mt-0.5 shrink-0" /> {d}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Future growth */}
      <section className="mt-12 md:mt-16">
        <div className="glass-dark rounded-2xl p-6 md:p-10 text-white text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-4">
            <FaIcon icon="fa-seedling" /> Future Growth
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">Build a practice that grows with you</h2>
          <p className="text-white/85 mt-3 max-w-2xl mx-auto">
            From a single therapist to a network of clinics — as The Urban Physio grows, so do you. We're continuously adding
            clinic management, analytics, patient engagement, and automation tools to help you scale.
          </p>
          <button type="button" onClick={scrollToApply} className="btn-glass mt-6">
            <FaIcon icon="fa-paper-plane" className="mr-2" /> Apply to join
          </button>
        </div>
      </section>

      {/* FAQs */}
      <section className="mt-12 md:mt-16">
        <SectionHeading eyebrow="FAQs" title="Frequently asked questions" />
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="glass-card !p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
              >
                <span className="font-semibold text-slate-900">{f.q}</span>
                <FaIcon icon={openFaq === i ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-slate-400 shrink-0" />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-slate-600 text-sm leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Apply form */}
      <section id="apply" className="mt-12 md:mt-16 scroll-mt-24">
        <SectionHeading eyebrow="Apply Now" title="Start your application" subtitle="Tell us about yourself and our team will reach out." />
        <form onSubmit={submit} className="glass-card max-w-3xl mx-auto">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 mb-5">
            {[
              { key: 'physiotherapist', label: 'Physiotherapist', icon: 'fa-user-doctor' },
              { key: 'clinic', label: 'Clinic', icon: 'fa-hospital' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => set('applicant_type', t.key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  form.applicant_type === t.key ? 'bg-white shadow text-primary-700' : 'text-slate-500'
                }`}
              >
                <FaIcon icon={t.icon} className="mr-1.5" /> {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="doc-label">{isClinic ? 'Contact person name' : 'Full name'} *</label>
              <input className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" />
            </div>
            {isClinic && (
              <div className="sm:col-span-2">
                <label className="doc-label">Clinic name</label>
                <input className="input-field" value={form.clinic_name} onChange={(e) => set('clinic_name', e.target.value)} placeholder="Clinic name" />
              </div>
            )}
            <div>
              <label className="doc-label">Email *</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="doc-label">Phone *</label>
              <input className="input-field" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Mobile number" />
            </div>
            <div>
              <label className="doc-label">City</label>
              <input className="input-field" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
            </div>
            <div>
              <label className="doc-label">{isClinic ? 'Years operating' : 'Experience'}</label>
              <input className="input-field" value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 5 years" />
            </div>
            <div className="sm:col-span-2">
              <label className="doc-label">{isClinic ? 'Services offered' : 'Specialisation'}</label>
              <input
                className="input-field"
                value={form.specialization}
                onChange={(e) => set('specialization', e.target.value)}
                placeholder={isClinic ? 'e.g. Ortho, Neuro, Sports rehab' : 'e.g. Sports physiotherapy'}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="doc-label">Message</label>
              <textarea
                className="input-field"
                rows={4}
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                placeholder="Tell us a little about yourself or your clinic"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mt-5 flex-wrap">
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <FaIcon icon="fa-lock" className="text-primary-600" /> Your information is secure and only used for onboarding.
            </p>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <FaIcon icon="fa-spinner" className="fa-spin mr-2" /> : <FaIcon icon="fa-paper-plane" className="mr-2" />}
              Submit application
            </button>
          </div>
        </form>
      </section>
    </InfoPageLayout>
    </>
  );
}
