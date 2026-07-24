import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import InfoPageLayout from '../components/InfoPageLayout';
import FaIcon from '../components/FaIcon';
import { useContact } from '../contexts/ContactContext';
import { contact as contactApi } from '../services/api';
import ManagedPageSeo from '../components/seo/ManagedPageSeo';

export default function ContactPage() {
  const { email, phone, hours, form_subjects, loading: contactLoading } = useContact();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);

  const subjects = form_subjects?.length ? form_subjects : ['General enquiry'];
  const activeSubject = form.subject || subjects[0];

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast.error('Please enter a message (at least 10 characters)');
      return;
    }
    setSending(true);
    try {
      await contactApi.sendMessage({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: activeSubject,
        message: form.message,
      });
      toast.success('Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', phone: '', subject: subjects[0], message: '' });
    } catch (err) {
      toast.error(err.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
    <ManagedPageSeo
      fallbackTitle="Contact Us"
      fallbackDescription="Questions about booking, refunds, or your care? We’re here to help across India."
    />
    <InfoPageLayout
      title="Contact Us"
      subtitle="Questions about booking, refunds, or your care? We’re here to help across India."
      icon="fa-headset"
      accent="from-primary-600 to-orange-700"
      breadcrumb="Support"
    >
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card !p-5">
            <h2 className="font-bold text-slate-900 mb-4">Get in touch</h2>
            {contactLoading ? (
              <div className="h-32 animate-pulse bg-slate-100 rounded-xl" />
            ) : (
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                    <FaIcon icon="fa-envelope" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
                    <a href={`mailto:${email}`} className="font-medium text-primary-700 hover:underline">
                      {email}
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FaIcon icon="fa-phone" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Phone</p>
                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="font-medium text-slate-800">
                      {phone}
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <FaIcon icon="fa-clock" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Hours</p>
                    <p className="font-medium text-slate-800 text-sm">{hours}</p>
                  </div>
                </li>
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-orange-50 border border-primary-100 p-5">
            <p className="font-semibold text-slate-800 text-sm">Quick links</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-primary-700 font-medium hover:underline inline-flex items-center gap-1">
                  <FaIcon icon="fa-circle-question" className="text-xs" /> FAQ
                </Link>
              </li>
              <li>
                <Link to="/cancellation-help" className="text-primary-700 font-medium hover:underline inline-flex items-center gap-1">
                  <FaIcon icon="fa-calendar-xmark" className="text-xs" /> Cancellation help
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-primary-700 font-medium hover:underline inline-flex items-center gap-1">
                  <FaIcon icon="fa-file-contract" className="text-xs" /> Refund policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3 glass-card !p-6 md:!p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Send a message</h2>
          <p className="text-sm text-slate-600 mb-6">We will email you back at the address you provide.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                <input
                  className="input-field"
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  className="input-field"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 …"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                className="input-field"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <select
                className="input-field"
                value={activeSubject}
                onChange={(e) => set('subject', e.target.value)}
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                className="input-field"
                rows={5}
                required
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                placeholder="How can we help? Include booking ID if relevant (TUP-…)"
              />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full sm:w-auto">
              {sending ? 'Sending...' : 'Send message'}
            </button>
          </form>
        </div>
      </div>
    </InfoPageLayout>
    </>
  );
}
