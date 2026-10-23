import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { serviceCatalogue } from '../../services/api';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { useContact } from '../../contexts/ContactContext';
import { whatsappChatUrl } from '../../utils/whatsapp';
import { ANALYTICS_EVENTS, trackEvent } from '../../utils/analytics';
import { setMobileBookbarVisible } from '../../utils/floatingActionsBus';
import {
  applyChipFilter,
  bookingContext,
  bookingDestinationNote,
  chipInterest,
  fillBookingTemplate,
  formatInr,
  homeQuickPickCopy,
  orderChipsForVisit,
  rankQuickPicks,
  readViewHistory,
  rememberView,
  resolveServiceBookingUrl,
  sourceChipFromVisit,
  subtitleForPick,
  isSafeBookingUrl,
} from './serviceCatalogueModel';
import BookingChoiceDialog from './BookingChoiceDialog';
import './serviceCatalogue.css';

const VIEW_KEY = 'tup_recent_services';
const LAYOUT_KEY = 'tup_layout_';
const BOOKING_CHOICE_LABELS = {
  book: 'Book Video Session',
  whatsapp: 'Book via WhatsApp',
  call: 'Call us',
};
const ICONS = {
  'back-neck-pain-relief': 'fa-bars-staggered',
  'post-surgery-rehab': 'fa-shield-halved',
  'elderly-care-physio': 'fa-user-group',
  'knee-pain-therapy': 'fa-person-walking',
  'shoulder-frozen-shoulder': 'fa-hand',
  'neuro-stroke-rehab': 'fa-brain',
  'sports-injury-rehab': 'fa-person-running',
  'cupping-therapy': 'fa-circle',
  'kinesio-taping': 'fa-grip-lines',
  'chiropractic-care': 'fa-staff-snake',
  'graston-therapy': 'fa-wrench',
  'hijama-wet-cupping': 'fa-droplet',
  'sports-massage': 'fa-hand',
  'basic-physiotherapy': 'fa-user-doctor',
  'advanced-physiotherapy': 'fa-user-doctor',
};

function pairsFor(item) {
  return item.oftenBookedWith?.length ? item.oftenBookedWith : item.bookingPairs || [];
}

function iconFor(item) {
  return ICONS[item.slug] || 'fa-house-medical';
}

function imageSrc(item) {
  return item?.imageUrl ? (resolveMediaUrl(item.imageUrl) || item.imageUrl) : '';
}

function serviceImages(item) {
  const rows = [];
  const push = (url, alt) => {
    const raw = String(url || '').trim();
    if (!isSafeBookingUrl(raw)) return;
    const src = resolveMediaUrl(raw) || raw;
    if (!src || rows.some((row) => row.src === src)) return;
    rows.push({ src, alt: alt || item?.title || 'Service image' });
  };
  push(item?.imageUrl, item?.imageAlt || item?.title);
  (Array.isArray(item?.gallery) ? item.gallery : []).forEach((url) => push(url, item?.imageAlt || item?.title));
  return rows;
}

function ServiceImageGallery({ item }) {
  const images = serviceImages(item);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState({});
  useEffect(() => {
    setIndex(0);
    setFailed({});
  }, [item?.id]);
  const visible = images.filter((image) => !failed[image.src]);
  if (visible.length === 0) {
    return (
      <div className="svc-sheet-hero" aria-hidden="true">
        <FaIcon icon={iconFor(item)} />
      </div>
    );
  }
  const safeIndex = Math.min(index, visible.length - 1);
  const current = visible[safeIndex];
  const markFailed = () => setFailed((prev) => ({ ...prev, [current.src]: true }));
  if (visible.length === 1) {
    return (
      <div className="svc-sheet-hero">
        <img src={current.src} alt={current.alt} onError={markFailed} />
      </div>
    );
  }
  return (
    <div>
      <div className="svc-sheet-hero">
        <img src={current.src} alt={`${current.alt} (${safeIndex + 1} of ${visible.length})`} onError={markFailed} />
        <button
          type="button"
          className="svc-sheet-nav prev"
          aria-label="Previous image"
          onClick={() => setIndex((value) => (value - 1 + visible.length) % visible.length)}
        >
          <FaIcon icon="fa-chevron-left" />
        </button>
        <button
          type="button"
          className="svc-sheet-nav next"
          aria-label="Next image"
          onClick={() => setIndex((value) => (value + 1) % visible.length)}
        >
          <FaIcon icon="fa-chevron-right" />
        </button>
      </div>
      <div className="svc-sheet-thumbs" aria-label="Service images">
        {visible.map((image, imageIndex) => (
          <button
            key={image.src}
            type="button"
            aria-label={`Show image ${imageIndex + 1}`}
            aria-current={imageIndex === safeIndex ? 'true' : undefined}
            onClick={() => setIndex(imageIndex)}
          >
            <img src={image.src} alt="" onError={() => setFailed((prev) => ({ ...prev, [image.src]: true }))} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ServiceDetailDrawer({ detail, chips, bookLabel, canBook, note, panelRef, onClose, onBook, onChip }) {
  const meta = [detail.durationLabel, detail.rating != null ? `★ ${Number(detail.rating).toFixed(1)}` : '', 'At your home'].filter(Boolean);
  return (
    <div className="svc-sheet-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        id="home-svc-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-svc-title"
        aria-describedby="home-svc-summary"
        className="svc-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="svc-sheet-head">
          <span className="svc-sheet-handle" aria-hidden="true" />
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 id="home-svc-title" className="text-xl font-bold">{detail.title}</h2>
            <button type="button" className="svc-sheet-close" onClick={onClose} aria-label="Close service details">×</button>
          </div>
        </div>
        <div id="home-svc-summary" className="svc-sheet-body">
          <ServiceImageGallery item={detail} />
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.badge ? <span className="rounded-full bg-[#e8eef6] px-2 py-0.5 text-[11px] font-semibold text-[#1d1d1f]">{detail.badge}</span> : null}
            {detail.price?.showOffer ? <span className="rounded-full bg-[#ff6f61] px-2 py-0.5 text-[11px] font-semibold text-white">{detail.price.percent}% off</span> : null}
            {detail.aiGuided ? <span className="rounded-full bg-[#e8e8ed] px-2 py-0.5 text-[11px] font-semibold">AI-guided</span> : null}
          </div>
          {detail.benefit ? <p className="mt-3 text-sm text-[#6e6e73]">{detail.benefit}</p> : null}
          {meta.length ? <p className="mt-2 text-xs text-[#6e6e73]">{meta.join(' · ')}</p> : null}
          {detail.price?.display != null ? (
            <p className="svc-accent mt-4 bg-[#f3f7fc] p-3">
              <span className="text-2xl font-bold">{formatInr(detail.price.display)}</span>
              {detail.price.showOffer ? <span className="ml-2 text-sm text-[#6e6e73] line-through">{formatInr(detail.price.regular)}</span> : null}
              {detail.unitLabel ? <span className="mt-1 block text-xs text-[#6e6e73]">{detail.unitLabel}</span> : null}
              {detail.price.showOffer ? <span className="mt-2 inline-flex rounded-full bg-[#fff1ef] px-2 py-0.5 text-xs font-semibold text-[#c9483b]">You save {formatInr(detail.price.save)}</span> : null}
            </p>
          ) : (
            <p className="mt-4 text-sm text-[#6e6e73]">Fee confirmed when you book</p>
          )}
          {detail.clinicalNote ? <p className="mt-4 text-sm">{detail.clinicalNote}</p> : null}
          {detail.included?.length ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">What&apos;s included</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{detail.included.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          ) : null}
          {detail.goodFit?.length ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">A good fit when</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{detail.goodFit.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          ) : null}
          {detail.seeDoctor?.length ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">See a doctor first if</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{detail.seeDoctor.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          ) : null}
          {detail.chipKeys?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.chipKeys.map((key) => {
                const chip = (chips || []).find((row) => row.key === key);
                if (!chip) return null;
                return (
                  <button key={key} type="button" className="svc-chip px-2 py-1 text-xs" onClick={() => onChip(key)}>
                    {chip.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          {detail.disclaimer ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{detail.disclaimer}</p> : null}
        </div>
        <div className="svc-sheet-foot">
          {note ? <p className="mb-2 text-center text-xs text-[#6e6e73]">{note}</p> : null}
          <button
            type="button"
            className="svc-btn inline-flex w-full items-center justify-center gap-2 px-3 py-3 text-sm font-semibold"
            disabled={!canBook}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onBook();
            }}
          >
            <FaIcon icon="fa-calendar" /> {bookLabel}
          </button>
          {!canBook ? <p className="mt-2 text-center text-xs text-[#6e6e73]">Booking is not available for this service yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function HomePhysioServiceBlock() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { phone, whatsapp } = useContact();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [views, setViews] = useState(() => readViewHistory(VIEW_KEY));
  const [selectedChip, setSelectedChip] = useState(() => searchParams.get('chip') || '');
  const [chipOrder, setChipOrder] = useState(null);
  const [activeSection, setActiveSection] = useState('');
  const [detail, setDetail] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [packageId, setPackageId] = useState('');
  const [sticky, setSticky] = useState(null);
  const [layouts, setLayouts] = useState({});
  const [expanded, setExpanded] = useState({});
  const sourceChip = useRef('');
  const openedSlug = useRef('');
  const panelRef = useRef(null);
  const sheetRef = useRef(null);
  const returnFocus = useRef(null);

  useEffect(() => {
    const visible = Boolean(sticky) && !detail;
    setMobileBookbarVisible(visible, 'home-services');
    return () => setMobileBookbarVisible(false, 'home-services');
  }, [sticky, detail]);

  useEffect(() => {
    let cancelled = false;
    serviceCatalogue
      .public('home_physiotherapy')
      .then((res) => {
        if (cancelled) return;
        const payload = res.data || res;
        setData(payload);
        sourceChip.current = sourceChipFromVisit(payload.chips || [], searchParams);
        const requested = searchParams.get('chip') || '';
        if (requested && (payload.chips || []).some((chip) => chip.key === requested)) {
          setSelectedChip(requested);
        }
        const stored = {};
        (payload.sections || []).forEach((section) => {
          try {
            const saved = localStorage.getItem(`${LAYOUT_KEY}${section.id}`);
            if (saved === 'grid' || saved === 'carousel') stored[section.id] = saved;
          } catch {
            /* layout stays on the admin default */
          }
        });
        setLayouts(stored);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Services could not be loaded');
      });
    return () => {
      cancelled = true;
    };
    // Chip order and the source chip are read once from this visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chipsByItemId = useMemo(() => {
    const map = {};
    (data?.items || []).forEach((item) => {
      map[item.id] = (item.chipKeys || []).map((key) => ({ key, isPrimary: key === item.primaryChipKey }));
    });
    return map;
  }, [data]);

  useEffect(() => {
    if (!data?.chips || chipOrder) return;
    const interest = chipInterest(readViewHistory(VIEW_KEY), chipsByItemId, sourceChip.current);
    setChipOrder(orderChipsForVisit(data.chips, interest));
  }, [data, chipsByItemId, chipOrder]);

  const visibleSections = useMemo(
    () => applyChipFilter(data?.sections || [], selectedChip),
    [data, selectedChip]
  );

  const picks = useMemo(() => {
    if (!data?.blocks?.showQuickPicks) return [];
    const pool = selectedChip
      ? (data.items || []).filter((item) => (item.chipKeys || []).includes(selectedChip))
      : data?.items || [];
    const pairsByItemId = {};
    (data.items || []).forEach((item) => {
      pairsByItemId[item.id] = pairsFor(item);
    });
    return rankQuickPicks({
      items: pool,
      chipsByItemId,
      selectedChipKey: selectedChip,
      sourceChipKey: sourceChip.current,
      recentViews: views,
      pairsByItemId,
    });
  }, [data, selectedChip, chipsByItemId, views]);

  const chipLabel = (chipOrder || data?.chips || []).find((chip) => chip.key === selectedChip)?.label || '';
  const copy = homeQuickPickCopy({
    selectedChipLabel: chipLabel,
    recentTitle: selectedChip ? '' : views[0]?.title || '',
    hasSourceChip: Boolean(sourceChip.current),
    blocks: data?.blocks,
  });

  useEffect(() => {
    if (!data?.items?.length) return undefined;
    const previous = document.getElementById('home-services-jsonld');
    previous?.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'home-services-jsonld';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Home Physiotherapy services',
      itemListElement: data.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Service',
          name: item.title,
          description: item.benefit,
          ...(item.imageUrl ? { image: item.imageUrl } : {}),
          provider: { '@type': 'MedicalBusiness', name: 'The Urban Physio' },
          ...(item.price?.display != null
            ? {
                offers: {
                  '@type': 'Offer',
                  price: item.price.display,
                  priceCurrency: 'INR',
                  ...(item.offerEndsAt ? { priceValidUntil: item.offerEndsAt } : {}),
                },
              }
            : {}),
        },
      })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [data]);

  useEffect(() => {
    const slug = searchParams.get('service');
    if (!slug || !data?.items || openedSlug.current === slug) return;
    const item = data.items.find((row) => row.slug === slug);
    if (!item) return;
    openedSlug.current = slug;
    openDetail(item, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, searchParams]);

  useEffect(() => {
    const nodes = [...document.querySelectorAll('[data-home-svc]')];
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.getAttribute('data-home-svc') || '');
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.15, 0.4] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [visibleSections]);

  useEffect(() => {
    if (!detail && !sheet) return undefined;
    const node = sheet ? sheetRef.current : panelRef.current;
    if (!node) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...node.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')];
    focusable()[0]?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (sheet) {
          setSheet(null);
          if (!detail) returnFocus.current?.focus?.();
        } else {
          closeDetail();
        }
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
    // closeDetail reads the latest search params from the render that opened the dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, sheet]);

  function chooseChip(key) {
    const next = selectedChip === key ? '' : key;
    setSelectedChip(next);
    const params = new URLSearchParams(searchParams);
    if (next) params.set('chip', next);
    else params.delete('chip');
    setSearchParams(params, { replace: true });
    trackEvent(ANALYTICS_EVENTS.CHIP_SELECT, {
      chip_id: next || 'cleared',
      chip_label: next || 'cleared',
      section: 'home-physio-services',
    });
  }

  function openDetail(item, bookNow) {
    setViews(rememberView(item, VIEW_KEY));
    setDetail(item);
    setPackageId(item.packages?.[0] ? String(item.packages[0].id) : '');
    const params = new URLSearchParams(searchParams);
    params.set('service', item.slug);
    setSearchParams(params, { replace: true });
    trackEvent(ANALYTICS_EVENTS.SERVICE_VIEW, {
      item_id: item.slug,
      item_name: item.title,
      service_type: 'home_physiotherapy',
      section: item.sectionSlug,
    });
    if (bookNow) startBooking(item, 'detail');
  }

  function closeDetail(options = {}) {
    const closed = detail;
    openedSlug.current = '';
    setDetail(null);
    setSheet(null);
    const params = new URLSearchParams(searchParams);
    params.delete('service');
    if (Object.prototype.hasOwnProperty.call(options, 'chipKey')) {
      const next = selectedChip === options.chipKey ? '' : options.chipKey;
      setSelectedChip(next);
      if (next) params.set('chip', next);
      else params.delete('chip');
      trackEvent(ANALYTICS_EVENTS.CHIP_SELECT, {
        chip_id: next || 'cleared',
        chip_label: next || 'cleared',
        section: 'home-physio-services',
      });
    }
    setSearchParams(params, { replace: true });
    if (closed && window.matchMedia('(max-width: 720px)').matches) setSticky(closed);
    returnFocus.current?.focus?.();
  }

  function optionList(item) {
    const overrides = item?.optionOverrides || {};
    return (data?.options || [])
      .map((option) => {
        const override = overrides[option.key] || {};
        const next = {
          ...option,
          label: override.label || option.label,
          subLabel: override.subLabel || option.subLabel,
          hrefTemplate: override.href || option.hrefTemplate,
          whatsappNumber: override.whatsappNumber || option.whatsappNumber || whatsapp || '',
          whatsappMessage: override.whatsappMessage || option.whatsappMessage,
          phone: override.phone || option.phone || phone || '',
          isVisible: override.isVisible === false ? false : option.isVisible,
        };
        return next;
      })
      .filter((option) => {
        if (!option.isVisible) return false;
        if (option.key === 'whatsapp') return Boolean(option.whatsappNumber);
        if (option.key === 'call') return Boolean(option.phone);
        return Boolean(option.hrefTemplate) && isSafeBookingUrl(option.hrefTemplate);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function optionHref(option, item, extra) {
    const ctx = bookingContext(item, extra);
    const overrideHref = item?.optionOverrides?.[option.key]?.href;
    if (option.key === 'book' && !overrideHref) {
      const direct = resolveServiceBookingUrl(item, extra, {
        origin: window.location.origin,
        base: import.meta.env.BASE_URL || '/',
      });
      if (direct) return direct;
    }
    if (option.key === 'call' && option.phone) return `tel:${String(option.phone).replace(/[^\d+]/g, '')}`;
    if (option.key === 'whatsapp' && option.whatsappNumber) {
      const message = String(option.whatsappMessage || 'Hi, I want to book {service} at home.').replace(
        /\{(service|slug|section|chip|price|package|pay|treatment|pain|plan)\}/g,
        (_, key) => ctx[key] ?? ''
      );
      return whatsappChatUrl(option.whatsappNumber, message) || '#';
    }
    return fillBookingTemplate(option.hrefTemplate, ctx);
  }

  function bookingHrefAllowed(href, option) {
    const value = String(href || '').trim();
    if (option?.key === 'call') return /^tel:\+?[0-9]{8,15}$/.test(value);
    if (option?.key === 'whatsapp') return value.startsWith('https://wa.me/') || value.startsWith('https://api.whatsapp.com/');
    return isSafeBookingUrl(value);
  }

  function followBookingHref(href, option) {
    const value = String(href || '').trim();
    if (!bookingHrefAllowed(value, option)) return false;
    if (option?.key === 'whatsapp' || option?.openInNewTab) {
      window.open(value, '_blank', 'noopener');
      return true;
    }
    if (value.startsWith('/')) {
      navigate(value);
      return true;
    }
    window.location.assign(value);
    return true;
  }

  function goOption(option, item, extra, source) {
    const href = optionHref(option, item, extra);
    if (!bookingHrefAllowed(href, option)) return;
    trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {
      cta_id: option.key,
      cta_label: option.label,
      cta_location: source || 'home-physio-services',
      item_id: item.slug,
      item_name: item.title,
      section: item.sectionSlug,
      chip_id: extra.chip || '',
      destination: href.startsWith('/') ? href.split('?')[0] : 'external',
    });
    openedSlug.current = item?.slug || 'booking';
    setDetail(null);
    setSheet(null);
    followBookingHref(href, option);
  }

  function startBooking(item, source = 'card', extra = {}) {
    const options = optionList(item);
    const packageRow = (item.packages || []).find((row) => String(row.id) === String(extra.packageId || packageId));
    const context = {
      ...extra,
      package: packageRow ? String(packageRow.sessions) : extra.package || '',
      chip: selectedChip || item.primaryChipKey || '',
      pain: item.bookingPainType || '',
    };
    trackEvent(ANALYTICS_EVENTS.BOOKING_START, {
      item_id: item.slug,
      item_name: item.title,
      service_type: 'home_physiotherapy',
      section: item.sectionSlug,
      source,
      booking_type: 'home_visit',
    });
    if (options.length === 0) return;
    setSheet({ item, extra: context, source });
  }

  function bookingExtra(item, extra = {}) {
    return {
      chip: selectedChip || item.primaryChipKey || '',
      pain: item.bookingPainType || '',
      ...extra,
    };
  }

  function directBookingHref(item, extra = {}) {
    return resolveServiceBookingUrl(item, bookingExtra(item, extra), {
      origin: window.location.origin,
      base: import.meta.env.BASE_URL || '/',
    });
  }

  function bookService(item, source = 'card', extra = {}) {
    const context = bookingExtra(item, extra);
    if (optionList(item).length > 0) {
      startBooking(item, source, context);
      return;
    }
    const href = resolveServiceBookingUrl(item, context, {
      origin: window.location.origin,
      base: import.meta.env.BASE_URL || '/',
    });
    if (href) {
      trackEvent(ANALYTICS_EVENTS.BOOKING_START, {
        item_id: item.slug,
        item_name: item.title,
        service_type: 'home_physiotherapy',
        section: item.sectionSlug,
        source,
        booking_type: 'home_visit',
      });
      trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {
        cta_id: 'book_now',
        cta_label: data?.blocks?.bookNowLabel || 'Book now',
        cta_location: source,
        item_id: item.slug,
        item_name: item.title,
        section: item.sectionSlug,
        destination: href.startsWith('/') ? href.split('?')[0] : 'external',
      });
      if (!bookingHrefAllowed(href)) return;
      openedSlug.current = item.slug || 'booking';
      setDetail(null);
      setSheet(null);
      followBookingHref(href);
      return;
    }
    if (optionList(item).length > 0) startBooking(item, source, context);
  }

  function setLayout(section, mode) {
    setLayouts((prev) => ({ ...prev, [section.id]: mode }));
    try {
      localStorage.setItem(`${LAYOUT_KEY}${section.id}`, mode);
    } catch {
      /* the choice still applies for this visit */
    }
  }

  if (error) {
    return <section className="svc-cat svc-home px-4 py-8 text-sm text-[#6e6e73]">{error}</section>;
  }
  if (!data) {
    return <section className="svc-cat svc-home px-4 py-10 text-sm text-[#6e6e73]">Loading home services…</section>;
  }
  if ((data.sections || []).length === 0) {
    return null;
  }

  const bookLabel = data.blocks?.bookNowLabel || 'Book now';
  const chips = chipOrder || data.chips || [];

  return (
    <section className="svc-cat svc-home" aria-label="Home physiotherapy services" id="home-services">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
        {data.blocks?.showChips !== false && chips.length > 0 ? (
          <div className="mb-6">
            {data.blocks?.chipHeading ? <h2 className="mb-3 text-base font-semibold">{data.blocks.chipHeading}</h2> : null}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="svc-chip shrink-0 px-3 py-2 text-sm font-medium"
                  aria-pressed={selectedChip === chip.key}
                  onClick={() => chooseChip(chip.key)}
                >
                  {chip.icon ? <span className="mr-1">{chip.icon}</span> : null}
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {picks.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-lg font-bold">{copy.heading}</h2>
            <p className="mb-3 text-sm text-[#ff6f61]">{copy.reason}</p>
            <div className="svc-picks svc-picks-home">
              {picks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex h-16 items-center gap-3 rounded-xl bg-white px-2 text-left"
                  onClick={() => openDetail(item, false)}
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e8e8ed] text-[#376299]">
                    {item.imageUrl ? <img src={imageSrc(item)} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <FaIcon icon={iconFor(item)} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{item.title}</span>
                    <span className="block truncate text-xs text-[#6e6e73]">
                      {item.oftenBookedTogether ? <span className="text-[#ff6f61]">Often booked together · </span> : null}
                      {subtitleForPick(item) || 'At your home'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {visibleSections.length > 0 ? (
          <>
            <div className="sticky top-16 z-20 -mx-4 mb-5 flex gap-2 overflow-x-auto bg-[#f5f5f7]/90 px-4 py-2 backdrop-blur">
              {visibleSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className="svc-chip shrink-0 px-3 py-1.5 text-sm"
                  aria-pressed={activeSection === section.slug}
                  onClick={() => document.getElementById(`home-svc-${section.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  {section.title}
                </button>
              ))}
            </div>
            {visibleSections.map((section) => {
              const layout = layouts[section.id] || section.layout || 'grid';
              const showAll = expanded[section.id];
              const limit = layout === 'grid' ? Math.max(1, section.gridMaxRows || 12) * 4 : section.items.length;
              const shown = showAll ? section.items : section.items.slice(0, limit);
              return (
                <div key={section.id} id={`home-svc-${section.slug}`} data-home-svc={section.slug} className="mb-10 scroll-mt-28">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold">{section.title}</h2>
                      {section.subtitle ? <p className="mt-1 max-w-3xl text-sm text-[#6e6e73]">{section.subtitle}</p> : null}
                    </div>
                    {section.allowVisitorToggle ? (
                      <div className="flex gap-1">
                        {['grid', 'carousel'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            aria-label={`${mode} layout`}
                            aria-pressed={layout === mode}
                            className="svc-chip px-2 py-1 text-xs"
                            onClick={() => setLayout(section, mode)}
                          >
                            <FaIcon icon={mode === 'grid' ? 'fa-table-cells' : 'fa-grip'} />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className={layout === 'grid' ? 'svc-grid' : 'svc-carousel pb-2'}>
                    {shown.map((item) => {
                      const cardCanBook = Boolean(directBookingHref(item)) || optionList(item).length > 0;
                      return (
                      <article
                        key={item.id}
                        className="svc-card svc-rise flex h-full min-w-0 flex-col overflow-hidden"
                        onClick={(event) => {
                          if (event.target.closest('[data-svc-book], button, a')) return;
                          returnFocus.current = event.currentTarget;
                          openDetail(item, false);
                        }}
                      >
                        <button
                          type="button"
                          className="flex w-full flex-1 flex-col text-left"
                          aria-haspopup="dialog"
                          aria-controls="home-svc-drawer"
                          onClick={(event) => {
                            event.stopPropagation();
                            returnFocus.current = event.currentTarget;
                            openDetail(item, false);
                          }}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#2a4d79] to-[#5b86c2] text-white">
                            {item.imageUrl ? (
                              <img src={imageSrc(item)} alt={item.imageAlt || item.title} className="h-full w-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            ) : (
                              <span className="flex h-full items-center justify-center text-4xl opacity-90">
                                <FaIcon icon={iconFor(item)} />
                              </span>
                            )}
                            {item.badge ? (
                              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-[#1d1d1f]">{item.badge}</span>
                            ) : null}
                            {item.price?.showOffer ? (
                              <span className="absolute right-3 top-3 rounded-full bg-[#ff6f61] px-2 py-0.5 text-[11px] font-semibold text-white">{item.price.percent}% off</span>
                            ) : null}
                          </div>
                          <div className="space-y-1 px-4 pt-3">
                            <h3 className="text-base font-semibold">{item.title}</h3>
                            <p className="line-clamp-2 text-sm text-[#6e6e73]">{item.benefit}</p>
                            <p className="text-xs text-[#6e6e73]">
                              {[item.durationLabel, item.rating != null ? `★ ${Number(item.rating).toFixed(1)}` : ''].filter(Boolean).join(' · ')}
                            </p>
                            {item.price?.display != null ? (
                              <p className="pt-1">
                                <span className="text-xl font-bold">{formatInr(item.price.display)}</span>
                                {item.price.showOffer ? <span className="ml-2 text-sm text-[#6e6e73] line-through">{formatInr(item.price.regular)}</span> : null}
                                {item.unitLabel ? <span className="ml-1 text-xs text-[#6e6e73]">{item.unitLabel}</span> : null}
                              </p>
                            ) : (
                              <p className="pt-1 text-sm text-[#6e6e73]">Fee confirmed when you book</p>
                            )}
                            {item.price?.showOffer ? (
                              <span className="inline-flex rounded-full bg-[#fff1ef] px-2 py-0.5 text-xs font-semibold text-[#c9483b]">You save {formatInr(item.price.save)}</span>
                            ) : null}
                          </div>
                        </button>
                        <div className="mt-auto p-4" data-svc-book onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="svc-btn inline-flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold"
                            disabled={!cardCanBook}
                            aria-label={cardCanBook ? `${bookLabel} for ${item.title}` : `Booking is not available for ${item.title}`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              returnFocus.current = event.currentTarget;
                              bookService(item, 'card');
                            }}
                          >
                            <FaIcon icon="fa-calendar" /> {bookLabel}
                          </button>
                          {!cardCanBook ? <p className="mt-2 text-center text-xs text-[#6e6e73]">Booking is not available for this service yet.</p> : null}
                        </div>
                      </article>
                      );
                    })}
                    {section.showHelpCard && !selectedChip ? (
                      <aside className="svc-help flex h-full flex-col justify-center p-5 text-center">
                        <h3 className="text-base font-semibold">Not sure what you need?</h3>
                        <p className="mt-2 text-sm text-[#6e6e73]">{section.helpText || "Tell us your problem and a physio will suggest the right plan. It's free."}</p>
                        {(data.defaultWhatsapp || whatsapp) ? (
                          <a
                            className="svc-chip mx-auto mt-4 inline-flex items-center gap-2 bg-white px-3 py-2 text-sm font-semibold"
                            href={whatsappChatUrl(data.defaultWhatsapp || whatsapp, 'Hi, I need help choosing a physiotherapy service.') || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FaIcon icon="fa-whatsapp" /> Ask on WhatsApp
                          </a>
                        ) : null}
                      </aside>
                    ) : null}
                  </div>
                  {layout === 'grid' && section.items.length > limit && !showAll ? (
                    <button type="button" className="mt-3 text-sm font-semibold text-[#376299]" onClick={() => setExpanded((prev) => ({ ...prev, [section.id]: true }))}>
                      Show all ({section.items.length})
                    </button>
                  ) : null}
                </div>
              );
            })}
          </>
        ) : null}
      </div>

      {detail ? createPortal(
        <ServiceDetailDrawer
          key={detail.id}
          detail={detail}
          chips={data.chips}
          bookLabel={bookLabel}
          canBook={Boolean(directBookingHref(detail)) || optionList(detail).length > 0}
          note={bookingDestinationNote(directBookingHref(detail))}
          panelRef={panelRef}
          onClose={closeDetail}
          onBook={() => bookService(detail, 'detail')}
          onChip={(key) => closeDetail({ chipKey: key })}
        />,
        document.body
      ) : null}

      {sheet ? (
        <BookingChoiceDialog
          ref={sheetRef}
          titleId="home-book-title"
          item={sheet.item}
          options={optionList(sheet.item).map((option) => (
            BOOKING_CHOICE_LABELS[option.key] ? { ...option, label: BOOKING_CHOICE_LABELS[option.key] } : option
          ))}
          onClose={() => {
            setSheet(null);
            if (!detail) returnFocus.current?.focus?.({ preventScroll: true });
          }}
          onChoose={(option) => goOption(option, sheet.item, sheet.extra, sheet.source)}
        />
      ) : null}

      {sticky && !detail ? (
        <div className="svc-mobile-bookbar fixed inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-[#1d1d1f] p-3 text-white shadow-xl md:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{sticky.title}</p>
            <p className="text-xs text-white/70">{sticky.price?.display != null ? `${formatInr(sticky.price.display)} ${sticky.unitLabel || ''}` : 'At your home'}</p>
          </div>
          <button type="button" className="rounded-xl bg-[#ff6f61] px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-white/30" disabled={!(directBookingHref(sticky) || optionList(sticky).length > 0)} onClick={() => bookService(sticky, 'sticky_bar')}>
            {bookLabel}
          </button>
          <button type="button" className="px-1 text-lg" aria-label="Dismiss" onClick={() => setSticky(null)}>×</button>
        </div>
      ) : null}
    </section>
  );
}
