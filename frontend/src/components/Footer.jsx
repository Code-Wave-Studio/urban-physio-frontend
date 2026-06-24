import { Link } from 'react-router-dom';
import FaIcon from './FaIcon';
import FooterCookieSettings from './FooterCookieSettings';
import { ALL_POLICIES } from '../constants/policyPages';
import { useContact } from '../contexts/ContactContext';
import { displayContactText } from '../utils/contactText';
import { SITE_LOGO_SRC } from '../constants/siteBrand';

const QUICK_LINKS = [
  { to: '/doctors', label: 'Find Doctors', icon: 'fa-user-doctor' },
  { to: '/clinics', label: 'Find Clinics', icon: 'fa-hospital' },
  { to: '/treatments', label: 'Treatments', icon: 'fa-kit-medical' },
  { to: '/conditions', label: 'Conditions', icon: 'fa-notes-medical' },
  { to: '/book', label: 'Book Appointment', icon: 'fa-calendar-check' },
];

const SUPPORT_LINKS = [
  { to: '/about', label: 'About Us', icon: 'fa-building' },
  { to: '/faq', label: 'FAQ', icon: 'fa-circle-question' },
  { to: '/contact', label: 'Contact Us', icon: 'fa-envelope' },
  { to: '/cancellation-help', label: 'Cancellation Help', icon: 'fa-calendar-xmark' },
];

const CODEWAVE_URL = 'https://codewavestudio.space/';

function FooterLinkColumn({ title, links }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-300/90 mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="text-sm text-primary-100/90 hover:text-white transition inline-flex items-center gap-2 group"
            >
              <FaIcon
                icon={item.icon}
                className="text-[10px] text-orange-400/80 w-3.5 group-hover:text-orange-300 transition"
              />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const contact = useContact();
  const email = displayContactText(contact.email);
  const phone = displayContactText(contact.phone);
  const hours = displayContactText(contact.hours);
  const address = displayContactText(contact.address);
  const footer_tagline = displayContactText(contact.footer_tagline);

  return (
    <footer className="site-footer relative mt-12 md:mt-20 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-orange-950 to-orange-900" />
      <div className="absolute inset-0 opacity-[0.35] bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.15),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand + contact strip */}
        <div className="pt-10 pb-8 md:pt-14 md:pb-10 border-b border-white/10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-start">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center bg-white rounded-2xl px-4 py-2.5 shadow-xl shadow-black/25 mb-5">
                <img
                  src={SITE_LOGO_SRC}
                  alt="The Urban Physio"
                  className="h-11 sm:h-12 w-auto max-w-[200px] object-contain"
                />
              </div>
              <p className="text-primary-200/85 max-w-md mt-1 text-sm leading-relaxed">{footer_tagline}</p>
              {address && (
                <p className="text-primary-300/70 text-xs mt-3 flex items-start gap-2 max-w-md">
                  <FaIcon icon="fa-location-dot" className="mt-0.5 shrink-0 text-orange-400/80" />
                  {address}
                </p>
              )}
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-3">
              <a
                href={`mailto:${email}`}
                className="footer-contact-card group"
              >
                <span className="footer-contact-icon">
                  <FaIcon icon="fa-envelope" />
                </span>
                <span className="footer-contact-label">Email</span>
                <span className="footer-contact-value break-all">{email}</span>
              </a>
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="footer-contact-card group"
              >
                <span className="footer-contact-icon">
                  <FaIcon icon="fa-phone" />
                </span>
                <span className="footer-contact-label">Phone</span>
                <span className="footer-contact-value">{phone}</span>
              </a>
              <div className="footer-contact-card">
                <span className="footer-contact-icon">
                  <FaIcon icon="fa-clock" />
                </span>
                <span className="footer-contact-label">Hours</span>
                <span className="footer-contact-value leading-snug">{hours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10">
          <FooterLinkColumn title="Quick Links" links={QUICK_LINKS} />
          <FooterLinkColumn title="Support" links={SUPPORT_LINKS} />
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-300/90 mb-4">Legal</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {ALL_POLICIES.map((p) => (
                <li key={p.key}>
                  <Link
                    to={p.path}
                    className="text-sm text-primary-100/90 hover:text-white transition inline-flex items-center gap-2 group"
                  >
                    <FaIcon
                      icon={p.icon}
                      className="text-[10px] text-orange-400/80 w-3.5 shrink-0 group-hover:text-orange-300"
                    />
                    <span className="leading-snug">{p.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm">
          <p className="text-primary-200/75 order-2 sm:order-1 text-center sm:text-left">
            © {new Date().getFullYear()} The Urban Physio. All rights reserved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3 sm:gap-5 order-1 sm:order-2">
            <FooterCookieSettings />
            <p className="text-primary-200/80 text-center sm:text-right">
              Designed &amp; Developed by{' '}
              <a
                href={CODEWAVE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                CodeWave Studio
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
