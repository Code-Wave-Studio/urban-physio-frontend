import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContact } from '../contexts/ContactContext';
import { whatsappChatUrl, whatsappDigits } from '../utils/whatsapp';
import { bookHomeVisitUrl } from '../utils/bookUrl';
import FaIcon from './FaIcon';

import { FLOATING_ACTIONS_EVENT } from '../utils/floatingActionsBus';

/** Floating CTAs — home + PhysioAtHome landing. */
function isMarketingPage(pathname) {
  return pathname === '/' || pathname === '/home-physiotherapy';
}

/** No floating actions on staff dashboards (doctor / admin). */
function isStaffDashboard(pathname) {
  return /^\/(doctor|admin)(\/|$)/.test(pathname);
}

function isBookingPage(pathname) {
  return (
    pathname === '/book' ||
    pathname.startsWith('/emergency/book') ||
    pathname.startsWith('/packages/book/') ||
    /^\/doctors\/[^/]+\/book$/.test(pathname)
  );
}

const SCROLL_SHOW_AFTER = 320;
const HOME_VISIT_WA =
  "Hi, I'd like to book a home physiotherapy session";

function IconArrowUp({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  );
}

export default function FloatingActions() {
  const { pathname } = useLocation();
  const { whatsapp, phone } = useContact();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hiddenByOverlay, setHiddenByOverlay] = useState(false);
  const hideAll = isBookingPage(pathname);
  const showFloating = isMarketingPage(pathname) && !isStaffDashboard(pathname) && !hideAll;

  const waDigits = whatsappDigits(whatsapp);
  const waUrl = showFloating ? whatsappChatUrl(whatsapp, HOME_VISIT_WA) : null;
  const telHref = phone ? `tel:${String(phone).replace(/\s/g, '')}` : null;
  const bookHref = bookHomeVisitUrl();

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > SCROLL_SHOW_AFTER);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onOverlay = (e) => setHiddenByOverlay(Boolean(e.detail?.hidden));
    window.addEventListener(FLOATING_ACTIONS_EVENT, onOverlay);
    return () => window.removeEventListener(FLOATING_ACTIONS_EVENT, onOverlay);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!showFloating || hiddenByOverlay) return null;

  return (
    <div className="floating-actions floating-actions--rail" aria-label="Quick actions">
      <div className="fab-rail" role="navigation" aria-label="Book, call, or WhatsApp">
        <Link to={bookHref} className="fab-rail-btn fab-rail-book" title="Book a Session">
          <span className="fab-rail-icon" aria-hidden>
            <FaIcon icon="fa-calendar-check" />
          </span>
          <span className="fab-rail-label">Book a Session</span>
          <span className="sr-only">Book a home physiotherapy session</span>
        </Link>

        {telHref && (
          <a href={telHref} className="fab-rail-btn fab-rail-call" title={phone ? `Call ${phone}` : 'Call Us'}>
            <span className="fab-rail-icon" aria-hidden>
              <FaIcon icon="fa-phone" />
            </span>
            <span className="fab-rail-label">Call Us</span>
            <span className="sr-only">{phone ? `Call us at ${phone}` : 'Call us'}</span>
          </a>
        )}

        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fab-rail-btn fab-rail-wa"
            title={whatsapp || 'WhatsApp'}
          >
            <span className="fab-rail-icon" aria-hidden>
              <FaIcon icon="fa-whatsapp" brand />
            </span>
            <span className="fab-rail-label">WhatsApp</span>
            <span className="sr-only">
              Chat on WhatsApp{waDigits ? ` (${whatsapp})` : ''}
            </span>
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={scrollToTop}
        className={`fab fab-scroll-top ${showScrollTop ? 'fab-scroll-top--visible' : ''}`}
        aria-label="Scroll to top"
        title="Back to top"
      >
        <IconArrowUp />
      </button>
    </div>
  );
}
