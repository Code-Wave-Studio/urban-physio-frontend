import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContact } from '../contexts/ContactContext';
import { whatsappChatUrl, whatsappDigits } from '../utils/whatsapp';
import { bookHomeVisitUrl, bookTelePhysioUrl } from '../utils/bookUrl';
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

const BOOK_OPTIONS = [
  { to: bookHomeVisitUrl(), label: 'Home Visit', icon: 'fa-house-medical' },
  { to: bookTelePhysioUrl(), label: 'TeleRehab', icon: 'fa-video' },
  { to: '/doctors', label: 'Find Physio', icon: 'fa-user-doctor' },
  { to: '/clinics', label: 'Find Clinic', icon: 'fa-hospital' },
];

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
  const [bookMenuOpen, setBookMenuOpen] = useState(false);
  const hideAll = isBookingPage(pathname);
  const showFloating = isMarketingPage(pathname) && !isStaffDashboard(pathname) && !hideAll;

  const waDigits = whatsappDigits(whatsapp);
  const waUrl = showFloating ? whatsappChatUrl(whatsapp, HOME_VISIT_WA) : null;
  const telHref = phone ? `tel:${String(phone).replace(/\s/g, '')}` : null;

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
    setBookMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!openFab && !bookMenuOpen) return undefined;
    const onPointerDown = (e) => {
      if (!e.target.closest?.('.fab-rail')) {
        setOpenFab(null);
        setBookMenuOpen(false);
        return;
      }
      if (bookMenuOpen && !e.target.closest?.('.fab-book-wrap')) {
        setBookMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openFab, bookMenuOpen]);

  useEffect(() => {
    if (!bookMenuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setBookMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [bookMenuOpen]);

  const onFabActivate = (id) => (e) => {
    if (!isTouchLike()) return;
    if (openFab !== id) {
      e.preventDefault();
      setOpenFab(id);
      setBookMenuOpen(false);
    }
  };

  const toggleBookMenu = () => {
    setOpenFab(null);
    setBookMenuOpen((open) => !open);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!showFloating || hiddenByOverlay) return null;

  return (
    <div className="floating-actions floating-actions--rail" aria-label="Quick actions">
      <div className="fab-rail" role="navigation" aria-label="Book, call, or WhatsApp">
        <div className={`fab-book-wrap ${bookMenuOpen ? 'is-open' : ''}`}>
          <div
            id="fab-book-menu"
            className="fab-book-menu"
            role="menu"
            aria-label="Booking options"
            aria-hidden={!bookMenuOpen}
            inert={!bookMenuOpen ? true : undefined}
          >
            {BOOK_OPTIONS.map((option) => (
              <Link
                key={option.to}
                to={option.to}
                role="menuitem"
                className="fab-book-option"
                tabIndex={bookMenuOpen ? 0 : -1}
                onClick={() => setBookMenuOpen(false)}
              >
                <span className="fab-book-option-icon" aria-hidden>
                  <FaIcon icon={option.icon} />
                </span>
                <span>{option.label}</span>
              </Link>
            ))}
          </div>

          <button
            type="button"
            className={`fab-rail-btn fab-rail-book ${bookMenuOpen ? 'is-open' : ''}`}
            title="Book a Session"
            aria-label="Book a Session"
            aria-haspopup="menu"
            aria-expanded={bookMenuOpen}
            aria-controls="fab-book-menu"
            onClick={toggleBookMenu}
          >
            <span className="fab-rail-icon" aria-hidden>
              <FaIcon icon="fa-calendar-check" />
            </span>
            <span className="fab-rail-label" aria-hidden>
              Book a Session
            </span>
          </button>
        </div>

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
