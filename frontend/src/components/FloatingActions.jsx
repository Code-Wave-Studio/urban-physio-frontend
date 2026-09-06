import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContact } from '../contexts/ContactContext';
import { whatsappChatUrl, whatsappDigits } from '../utils/whatsapp';
import { bookHomeVisitUrl } from '../utils/bookUrl';
import FaIcon from './FaIcon';

import { FLOATING_ACTIONS_EVENT } from '../utils/floatingActionsBus';

function isTouchLike() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
}

/** Floating CTAs — home + PhysioAtHome + TelePhysio landing. */
function isMarketingPage(pathname) {
  return pathname === '/' || pathname === '/home-physiotherapy' || pathname === '/telephysio';
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
  const [openFab, setOpenFab] = useState(null);
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

  useEffect(() => {
    setOpenFab(null);
  }, [pathname]);

  useEffect(() => {
    if (!openFab) return undefined;
    const onPointerDown = (e) => {
      if (!e.target.closest?.('.fab-rail')) setOpenFab(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openFab]);

  const onFabActivate = (id) => (e) => {
    if (!isTouchLike()) return;
    if (openFab !== id) {
      e.preventDefault();
      setOpenFab(id);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!showFloating || hiddenByOverlay) return null;

  return (
    <div className="floating-actions floating-actions--rail" aria-label="Quick actions">
      <div className="fab-rail" role="navigation" aria-label="Book, call, or WhatsApp">
        <Link
          to={bookHref}
          className={`fab-rail-btn fab-rail-book ${openFab === 'book' ? 'is-open' : ''}`}
          title="Book a Session"
          aria-label="Book a home physiotherapy session"
          onClick={onFabActivate('book')}
        >
          <span className="fab-rail-icon" aria-hidden>
            <FaIcon icon="fa-calendar-check" />
          </span>
          <span className="fab-rail-label" aria-hidden>
            Book a Session
          </span>
        </Link>

        {telHref && (
          <a
            href={telHref}
            className={`fab-rail-btn fab-rail-call ${openFab === 'call' ? 'is-open' : ''}`}
            title={phone ? `Call ${phone}` : 'Call Us'}
            aria-label={phone ? `Call us at ${phone}` : 'Call us'}
            onClick={onFabActivate('call')}
          >
            <span className="fab-rail-icon" aria-hidden>
              <FaIcon icon="fa-phone" />
            </span>
            <span className="fab-rail-label" aria-hidden>
              Call Us
            </span>
          </a>
        )}

        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`fab-rail-btn fab-rail-wa ${openFab === 'wa' ? 'is-open' : ''}`}
            title={whatsapp || 'WhatsApp'}
            aria-label={`Chat on WhatsApp${waDigits ? ` (${whatsapp})` : ''}`}
            onClick={onFabActivate('wa')}
          >
            <span className="fab-rail-icon" aria-hidden>
              <FaIcon icon="fa-whatsapp" brand />
            </span>
            <span className="fab-rail-label" aria-hidden>
              WhatsApp
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
