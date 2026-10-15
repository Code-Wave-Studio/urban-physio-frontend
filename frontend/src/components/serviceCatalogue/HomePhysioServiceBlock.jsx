import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FaIcon from '../FaIcon';
import { serviceCatalogue } from '../../services/api';
import { useContact } from '../../contexts/ContactContext';
import { whatsappChatUrl } from '../../utils/whatsapp';
import { ANALYTICS_EVENTS, trackEvent } from '../../utils/analytics';
import {
  applyChipFilter,
  bookingContext,
  chipInterest,
  fillBookingTemplate,
  formatInr,
  homeQuickPickCopy,
  orderChipsForVisit,
  rankQuickPicks,
  readViewHistory,
  rememberView,
  sourceChipFromVisit,
  subtitleForPick,
} from './serviceCatalogueModel';
import './serviceCatalogue.css';

const VIEW_KEY = 'tup_recent_services';
const LAYOUT_KEY = 'tup_layout_';
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
  const returnFocus = useRef(null);

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
    if (!detail || !panelRef.current) return undefined;
    const node = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...node.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')];
    focusable()[0]?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (sheet) setSheet(null);
        else closeDetail();
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

  function closeDetail() {
    const closed = detail;
    openedSlug.current = '';
    setDetail(null);
    setSheet(null);
    const params = new URLSearchParams(searchParams);
    params.delete('service');
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
        return Boolean(option.hrefTemplate);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function optionHref(option, item, extra) {
    const ctx = bookingContext(item, extra);
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

  function goOption(option, item, extra, source) {
    const href = optionHref(option, item, extra);
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
    if (href.startsWith('/')) {
      navigate(href);
      return;
    }
    if (option.openInNewTab || option.key === 'whatsapp') window.open(href, '_blank', 'noopener');
    else window.location.assign(href);
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
    if (options.length === 1) {
      goOption(options[0], item, context, source);
      return;
    }
    setSheet({ item, extra: context, source });
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
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <FaIcon icon={iconFor(item)} />}
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
                    {shown.map((item) => (
                      <article key={item.id} className="svc-card svc-rise flex h-full min-w-0 flex-col overflow-hidden">
                        <button
                          type="button"
                          className="block w-full text-left"
                          onClick={(event) => {
                            returnFocus.current = event.currentTarget;
                            openDetail(item, false);
                          }}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#2a4d79] to-[#5b86c2] text-white">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.imageAlt || item.title} className="h-full w-full object-cover" />
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
                        {optionList(item).length > 0 ? (
                          <div className="mt-auto p-4">
                            <button
                              type="button"
                              className="svc-btn inline-flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold"
                              onClick={(event) => {
                                returnFocus.current = event.currentTarget;
                                startBooking(item, 'card');
                              }}
                            >
                              <FaIcon icon="fa-calendar" /> {bookLabel}
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
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

      {detail ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-stretch md:justify-end" onClick={closeDetail}>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-svc-title"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 md:h-full md:max-h-none md:w-[460px] md:rounded-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 id="home-svc-title" className="text-xl font-bold">{detail.title}</h2>
              <button type="button" className="svc-chip px-2 py-1" onClick={closeDetail} aria-label="Close">×</button>
            </div>
            <div className="mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#2a4d79] to-[#5b86c2] text-4xl text-white">
              {detail.imageUrl ? <img src={detail.imageUrl} alt={detail.imageAlt || detail.title} className="h-full w-full object-cover" /> : <FaIcon icon={iconFor(detail)} />}
            </div>
            <p className="text-sm text-[#6e6e73]">{detail.benefit}</p>
            <p className="mt-2 text-xs text-[#6e6e73]">
              {[detail.durationLabel, detail.rating != null ? `★ ${Number(detail.rating).toFixed(1)}` : '', 'At your home'].filter(Boolean).join(' · ')}
            </p>
            {detail.price?.display != null ? (
              <p className="svc-accent mt-4 bg-[#f3f7fc] p-3">
                <span className="text-2xl font-bold">{formatInr(detail.price.display)}</span>
                {detail.price.showOffer ? <span className="ml-2 text-sm text-[#6e6e73] line-through">{formatInr(detail.price.regular)}</span> : null}
                {detail.unitLabel ? <span className="mt-1 block text-xs text-[#6e6e73]">{detail.unitLabel}</span> : null}
              </p>
            ) : null}
            {detail.included?.length ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold">What&apos;s included</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{detail.included.map((line) => <li key={line}>{line}</li>)}</ul>
              </div>
            ) : null}
            {detail.chipKeys?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.chipKeys.map((key) => {
                  const chip = (data.chips || []).find((row) => row.key === key);
                  if (!chip) return null;
                  return (
                    <button key={key} type="button" className="svc-chip px-2 py-1 text-xs" onClick={() => { closeDetail(); chooseChip(key); }}>
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {detail.disclaimer ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{detail.disclaimer}</p> : null}
            {optionList(detail).length > 0 ? (
              <div className="sticky bottom-0 mt-5 bg-white pt-3">
                <button type="button" className="svc-btn w-full px-3 py-3 text-sm font-semibold" onClick={() => startBooking(detail, 'detail')}>
                  {bookLabel}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {sheet ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setSheet(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-book-title"
            className="w-full max-w-[420px] rounded-t-2xl bg-white p-4 sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="home-book-title" className="text-lg font-bold">How would you like to book?</h2>
            <p className="mt-1 text-sm text-[#6e6e73]">
              {sheet.item.title}
              {sheet.item.price?.display != null ? ` · from ${formatInr(sheet.item.price.display)} ${sheet.item.unitLabel || ''}`.trim() : ''}
            </p>
            <div className="mt-3 space-y-2">
              {optionList(sheet.item).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl border border-[#e5e5ea] px-3 py-3 text-left hover:bg-[#f3f7fc]"
                  onClick={() => goOption(option, sheet.item, sheet.extra, sheet.source)}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8eef6] text-[#376299]">
                    <FaIcon icon={option.icon || 'fa-arrow-right'} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{option.label}</span>
                    {option.subLabel ? <span className="block text-xs text-[#6e6e73]">{option.subLabel}</span> : null}
                  </span>
                  <FaIcon icon="fa-chevron-right" className="text-xs text-[#6e6e73]" />
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-[#6e6e73]">
              <FaIcon icon="fa-lock" /> Payments are only made through The Urban Physio
            </p>
          </div>
        </div>
      ) : null}

      {sticky && !detail ? (
        <div className="fixed inset-x-3 bottom-3 z-30 flex items-center gap-3 rounded-2xl bg-[#1d1d1f] p-3 text-white shadow-xl md:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{sticky.title}</p>
            <p className="text-xs text-white/70">{sticky.price?.display != null ? `${formatInr(sticky.price.display)} ${sticky.unitLabel || ''}` : 'At your home'}</p>
          </div>
          <button type="button" className="rounded-xl bg-[#ff6f61] px-3 py-2 text-sm font-semibold" onClick={() => startBooking(sticky, 'sticky_bar')}>
            {bookLabel}
          </button>
          <button type="button" className="px-1 text-lg" aria-label="Dismiss" onClick={() => setSticky(null)}>×</button>
        </div>
      ) : null}
    </section>
  );
}
