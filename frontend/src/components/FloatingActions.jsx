import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContact } from '../contexts/ContactContext';
import { whatsappChatUrl, whatsappDigits } from '../utils/whatsapp';
import FaIcon from './FaIcon';
import { useTeleRehabPageName } from '../hooks/useTeleRehabPageName';

import { FLOATING_ACTIONS_EVENT } from '../utils/floatingActionsBus';

function isTouchLike() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
const INTRO_STEP_MS = 340;
const INTRO_HOLD_MS = 1000;
const COLLAPSE_STEP_MS = 200;
const SUBMENU_EXIT_MS = 280;

/** Persistent first-visit flag. localStorage survives refresh and later visits. */
const INTRO_STORAGE_KEY = 'tup_fab_intro_complete';

const CLOSED_LABELS = { call: false, wa: false, book: false };
const CLOSED_SUBS = [false, false, false, false];

/**
 * Set once a sequence has started in this document. Survives route changes
 * without replaying, and is not set during React Strict Mode's discarded pass.
 */
let introConsumed = false;

function readIntroComplete() {
  try {
    return window.localStorage.getItem(INTRO_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeIntroComplete() {
  try {
    window.localStorage.setItem(INTRO_STORAGE_KEY, '1');
  } catch {
    /* storage unavailable — module flag still blocks a replay in this document */
  }
}

const HOME_VISIT_WA =
  "Hi, I'd like to book a home physiotherapy session";

const BOOK_OPTIONS = [
  { id: 'home', to: '/home-physiotherapy', label: 'Home Visit', icon: 'fa-house-medical' },
  { id: 'tele', to: '/telephysio', label: 'TeleRehab', icon: 'fa-video' },
  { id: 'physio', to: '/doctors', label: 'Find Physio', icon: 'fa-user-doctor' },
  { id: 'clinic', to: '/clinics', label: 'Find Clinic', icon: 'fa-hospital' },
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
  const telePageName = useTeleRehabPageName();
  const { whatsapp, phone } = useContact();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hiddenByOverlay, setHiddenByOverlay] = useState(false);
  const [openFab, setOpenFab] = useState(null);
  const [sequenceMode, setSequenceMode] = useState(false);
  const [shellOpen, setShellOpen] = useState(false);
  const [subVisible, setSubVisible] = useState(CLOSED_SUBS);
  const [labelVisible, setLabelVisible] = useState(CLOSED_LABELS);

  const hideAll = isBookingPage(pathname);
  const showFloating = isMarketingPage(pathname) && !isStaffDashboard(pathname) && !hideAll;

  const waDigits = whatsappDigits(whatsapp);
  const waText = pathname === '/telephysio'
    ? `Hi, I'd like to book a ${telePageName} online physiotherapy session`
    : HOME_VISIT_WA;
  const waUrl = showFloating ? whatsappChatUrl(whatsapp, waText) : null;
  const telHref = phone ? `tel:${String(phone).replace(/\s/g, '')}` : null;
  const hasCall = Boolean(telHref);
  const hasWa = Boolean(waUrl);
  const menuOpen = subVisible.some(Boolean);

  const hasCallRef = useRef(hasCall);
  const hasWaRef = useRef(hasWa);
  const subRef = useRef(subVisible);
  const labelRef = useRef(labelVisible);
  const openFabRef = useRef(openFab);
  const introRunningRef = useRef(false);
  const collapsingRef = useRef(false);
  const genRef = useRef(0);
  const seqTimersRef = useRef([]);
  const pathnameRef = useRef(pathname);
  hasCallRef.current = hasCall;
  hasWaRef.current = hasWa;
  subRef.current = subVisible;
  labelRef.current = labelVisible;
  openFabRef.current = openFab;

  const clearSeq = () => {
    seqTimersRef.current.forEach((id) => window.clearTimeout(id));
    seqTimersRef.current = [];
  };

  const schedule = (fn, ms, gen) => {
    const id = window.setTimeout(() => {
      seqTimersRef.current = seqTimersRef.current.filter((timerId) => timerId !== id);
      if (genRef.current !== gen) return;
      fn();
    }, ms);
    seqTimersRef.current.push(id);
  };

  const commitSubs = (next) => {
    subRef.current = next;
    setSubVisible(next);
  };

  const commitLabels = (next) => {
    labelRef.current = next;
    setLabelVisible(next);
  };

  const resetVisuals = () => {
    collapsingRef.current = false;
    setSequenceMode(false);
    setShellOpen(false);
    setOpenFab(null);
    openFabRef.current = null;
    commitSubs([...CLOSED_SUBS]);
    commitLabels({ ...CLOSED_LABELS });
  };

  const finishControlledMotion = () => {
    setSequenceMode(false);
    collapsingRef.current = false;
    introRunningRef.current = false;
  };

  /**
   * Hide submenu items from last to first, then collapse Book, WhatsApp, and Call.
   * `keepFab` stays expanded for the touch "reveal label, then activate" gesture.
   */
  const startCollapse = ({ keepFab = null } = {}) => {
    const gen = ++genRef.current;
    clearSeq();
    introRunningRef.current = false;
    collapsingRef.current = true;
    introConsumed = true;
    writeIntroComplete();

    const active = document.activeElement;
    if (active && active.closest?.('#fab-book-menu')) {
      document.getElementById('fab-book-trigger')?.focus();
    }

    if (prefersReducedMotion()) {
      setOpenFab(keepFab);
      openFabRef.current = keepFab;
      resetVisuals();
      if (keepFab) {
        setOpenFab(keepFab);
        openFabRef.current = keepFab;
      }
      return;
    }

    setSequenceMode(true);
    setOpenFab(keepFab);
    openFabRef.current = keepFab;

    const subsNow = [...subRef.current];
    const labelsNow = { ...labelRef.current };
    let delay = 0;

    if (subsNow.some(Boolean)) setShellOpen(true);

    for (let index = subsNow.length - 1; index >= 0; index -= 1) {
      if (!subsNow[index]) continue;
      const slot = index;
      const at = delay;
      delay += COLLAPSE_STEP_MS;
      schedule(() => {
        const next = [...subRef.current];
        next[slot] = false;
        commitSubs(next);
      }, at, gen);
    }

    if (subsNow.some(Boolean)) {
      const shellAt = Math.max(0, delay - COLLAPSE_STEP_MS) + SUBMENU_EXIT_MS;
      delay = Math.max(delay, shellAt);
      schedule(() => setShellOpen(false), shellAt, gen);
    } else {
      setShellOpen(false);
    }

    ['book', 'wa', 'call'].forEach((id) => {
      if (!labelsNow[id] || id === keepFab) return;
      const at = delay;
      delay += COLLAPSE_STEP_MS;
      schedule(() => {
        commitLabels({ ...labelRef.current, [id]: false });
      }, at, gen);
    });

    schedule(() => {
      finishControlledMotion();
      setOpenFab(keepFab);
      openFabRef.current = keepFab;
    }, delay + 40, gen);
  };

  const openMenu = () => {
    genRef.current += 1;
    clearSeq();
    introRunningRef.current = false;
    collapsingRef.current = false;
    introConsumed = true;
    writeIntroComplete();
    setSequenceMode(false);
    setShellOpen(true);
    setOpenFab(null);
    openFabRef.current = null;
    commitLabels({ ...labelRef.current, book: true });
    commitSubs([true, true, true, true]);
  };

  const toggleBookMenu = () => {
    if (subRef.current.some(Boolean) && !collapsingRef.current) {
      startCollapse();
      return;
    }
    openMenu();
  };

  const runIntroRef = useRef(() => {});
  runIntroRef.current = () => {
    if (introRunningRef.current) return;
    const gen = ++genRef.current;
    clearSeq();
    introRunningRef.current = true;
    collapsingRef.current = false;
    setSequenceMode(true);
    setShellOpen(false);
    setOpenFab(null);
    commitSubs([...CLOSED_SUBS]);
    commitLabels({ ...CLOSED_LABELS });

    const actions = [];
    if (hasCallRef.current) {
      actions.push(() => commitLabels({ ...labelRef.current, call: true }));
    }
    if (hasWaRef.current) {
      actions.push(() => commitLabels({ ...labelRef.current, wa: true }));
    }
    actions.push(() => commitLabels({ ...labelRef.current, book: true }));
    BOOK_OPTIONS.forEach((option, index) => {
      actions.push(() => {
        if (index === 0) setShellOpen(true);
        const next = [...subRef.current];
        next[index] = true;
        commitSubs(next);
      });
    });

    actions.forEach((action, index) => {
      schedule(action, index * INTRO_STEP_MS, gen);
    });

    const revealedAt = (actions.length - 1) * INTRO_STEP_MS;
    schedule(() => {
      writeIntroComplete();
    }, revealedAt, gen);

    schedule(() => {
      if (genRef.current !== gen || !introRunningRef.current) return;
      startCollapse();
    }, revealedAt + INTRO_HOLD_MS, gen);
  };

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
    if (pathnameRef.current === pathname) return undefined;
    pathnameRef.current = pathname;
    const wasRunning = introRunningRef.current;
    genRef.current += 1;
    clearSeq();
    introRunningRef.current = false;
    if (wasRunning) {
      introConsumed = true;
      writeIntroComplete();
    }
    resetVisuals();
    return undefined;
  }, [pathname]);

  useEffect(() => () => {
    const wasRunning = introRunningRef.current;
    genRef.current += 1;
    seqTimersRef.current.forEach((id) => window.clearTimeout(id));
    seqTimersRef.current = [];
    introRunningRef.current = false;
    collapsingRef.current = false;
    if (wasRunning) {
      introConsumed = true;
      writeIntroComplete();
    }
  }, []);

  useEffect(() => {
    if (!showFloating || hiddenByOverlay) return undefined;
    if (introConsumed || readIntroComplete()) return undefined;

    let cancelled = false;
    const kickoff = window.setTimeout(() => {
      if (cancelled || introConsumed || readIntroComplete()) return;
      introConsumed = true;
      if (prefersReducedMotion()) {
        writeIntroComplete();
        return;
      }
      runIntroRef.current();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(kickoff);
    };
  }, [showFloating, hiddenByOverlay]);

  useEffect(() => {
    if (!shellOpen && !openFab) return undefined;
    const onPointerDown = (e) => {
      if (e.target.closest?.('.fab-rail-btn') || e.target.closest?.('.fab-book-option')) return;
      if (!e.target.closest?.('.fab-rail')) {
        startCollapse();
        return;
      }
      if (shellOpen && subRef.current.some(Boolean) && !e.target.closest?.('.fab-book-wrap')) {
        startCollapse();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [shellOpen, openFab]);

  useEffect(() => {
    if (!shellOpen && !menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') startCollapse();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shellOpen, menuOpen]);

  const onFabActivate = (id) => (e) => {
    if (!isTouchLike()) {
      if (subRef.current.some(Boolean) || introRunningRef.current) startCollapse();
      return;
    }
    if (openFabRef.current !== id) {
      e.preventDefault();
      startCollapse({ keepFab: id });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  if (!showFloating || hiddenByOverlay) return null;

  const bookLabelOpen = labelVisible.book;
  const callLabelOpen = openFab === 'call' || labelVisible.call;
  const waLabelOpen = openFab === 'wa' || labelVisible.wa;

  return (
    <div className="floating-actions floating-actions--rail" aria-label="Quick actions">
      <div className="fab-rail" role="navigation" aria-label="Book a session, WhatsApp, or call">
        <div className={`fab-book-wrap${shellOpen ? ' is-open' : ''}${sequenceMode ? ' is-sequenced' : ''}`}>
          <div
            id="fab-book-menu"
            className="fab-book-menu"
            role="menu"
            aria-label="Booking options"
            aria-hidden={!shellOpen}
            inert={!shellOpen ? true : undefined}
          >
            {BOOK_OPTIONS.map((option, index) => {
              const shown = sequenceMode ? subVisible[index] : menuOpen;
              return (
                <div
                  key={option.id}
                  className={`fab-book-option-slot${sequenceMode && shown ? ' is-in' : ''}`}
                >
                  <Link
                    to={option.to}
                    role="menuitem"
                    className="fab-book-option"
                    aria-label={option.id === 'tele' ? telePageName : option.label}
                    tabIndex={shown ? 0 : -1}
                    aria-hidden={!shown}
                    inert={!shown ? true : undefined}
                    onClick={() => {
                      introConsumed = true;
                      writeIntroComplete();
                      genRef.current += 1;
                      clearSeq();
                      introRunningRef.current = false;
                      collapsingRef.current = false;
                      resetVisuals();
                    }}
                  >
                    <span className="fab-book-option-icon" aria-hidden>
                      <FaIcon icon={option.icon} />
                    </span>
                    <span>{option.id === 'tele' ? telePageName : option.label}</span>
                  </Link>
                </div>
              );
            })}
          </div>

          <button
            id="fab-book-trigger"
            type="button"
            className={`fab-rail-btn fab-rail-book${bookLabelOpen ? ' is-open' : ''}`}
            title="Book a Session"
            aria-label="Book a Session"
            aria-haspopup="menu"
            aria-expanded={shellOpen}
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

        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`fab-rail-btn fab-rail-wa${waLabelOpen ? ' is-open' : ''}`}
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

        {telHref && (
          <a
            href={telHref}
            className={`fab-rail-btn fab-rail-call${callLabelOpen ? ' is-open' : ''}`}
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
