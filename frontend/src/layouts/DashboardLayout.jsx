import Navbar from '../components/Navbar';
import { CODEWAVE_LICENSE_MARKER, CODEWAVE_URL } from '../core/codewaveLicense';

function PortalCreditFooter() {
  return (
    <footer className="mt-10 pt-4 border-t border-slate-200/60 text-center select-none">
      <p
        data-codewave-license={CODEWAVE_LICENSE_MARKER}
        className="text-[10px] sm:text-[11px] text-slate-400/85 leading-relaxed tracking-wide"
      >
        © {new Date().getFullYear()} The Urban Physio. All rights reserved.
        <span className="mx-1.5 text-slate-300/80 hidden sm:inline" aria-hidden>
          ·
        </span>
        <span className="block sm:inline mt-0.5 sm:mt-0">
          Designed &amp; Developed by{' '}
          <a
            href={CODEWAVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500/90 hover:text-teal-700 underline-offset-2 hover:underline transition"
          >
            CodeWave Studio
          </a>
        </span>
      </p>
    </footer>
  );
}

export default function DashboardLayout({
  children,
  brandLogoSrc = null,
  brandLogoAlt = 'The Urban Physio',
}) {
  return (
    <div className="min-h-screen relative admin-shell">
      <Navbar
        portalMode
        logoSrc={brandLogoSrc || undefined}
        logoAlt={brandLogoAlt}
      />

      <div className="admin-main-wrap">
        <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 animate-fade-in min-w-0">
          {children}
          <PortalCreditFooter />
        </main>
      </div>
    </div>
  );
}
