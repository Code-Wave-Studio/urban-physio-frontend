import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  chipInterest,
  fillBookingTemplate,
  formatInr,
  orderChipsForVisit,
  phaseBarSegments,
  quickPickCopy,
  rankQuickPicks,
  readViewHistory,
  rememberView,
  sourceChipFromVisit,
  subtitleForPick,
  LAYOUT_KEY_PREFIX,
} from './serviceCatalogueModel';
import BookingChoiceDialog from './BookingChoiceDialog';
import './serviceCatalogue.css';

const PHASE_CLASS = ['svc-phase-0', 'svc-phase-1', 'svc-phase-2', 'svc-phase-3'];

function DetailThumbnail({ item }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? '' : mediaSrc(item);
  useEffect(() => {
    setFailed(false);
  }, [item?.id, item?.imageUrl]);
  return (
    <div className="relative aspect-video max-h-[220px] w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#2a4d79] to-[#5b86c2] text-white sm:max-h-[280px]">
      {src ? (
        <img
          src={src}
          alt={item.imageAlt || item.title || ''}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
          <FaIcon icon={item?.type === 'plan' ? 'fa-route' : 'fa-video'} className="text-4xl opacity-90" />
        </div>
      )}
    </div>
  );
}

function pairsFor(item) {
  return item.oftenBookedWith?.length ? item.oftenBookedWith : item.bookingPairs || [];
}

function priceLine(item) {
  if (item.price?.display == null) return null;
  return item.price;
}

function mediaSrc(item) {
  if (!item?.imageUrl) return '';
  return resolveMediaUrl(item.imageUrl) || item.imageUrl;
}

function ImageFrame({ item, ratio }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? '' : mediaSrc(item);
  useEffect(() => {
    setFailed(false);
  }, [item?.id, item?.imageUrl]);
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${ratio}`}>
      {src ? (
        <img src={src} alt={item.imageAlt || item.title} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2a4d79] to-[#5b86c2] text-white" aria-hidden="true">
          <FaIcon icon={item.type === 'plan' ? 'fa-route' : 'fa-video'} className="text-3xl opacity-90" />
        </div>
      )}
      {item.badge ? (
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-[#1d1d1f]">
          {item.badge}
        </span>
      ) : null}
      {item.price?.showOffer ? (
        <span className="absolute right-3 top-3 rounded-full bg-[#ff6f61] px-2 py-0.5 text-[11px] font-semibold text-white">
          {item.price.percent}% off
        </span>
      ) : null}
    </div>
  );
}

function ServiceCard({ item, onOpen, bookLabel }) {
  const price = priceLine(item);
  return (
    <article className="svc-card svc-rise flex h-full flex-col overflow-hidden text-left transition">
      <button type="button" className="block w-full text-left" onClick={() => onOpen(item)}>
        <ImageFrame item={item} ratio="aspect-[4/3]" />
        <div className="space-y-1 px-4 pt-3">
          <h3 className="text-base font-semibold text-[#1d1d1f]">{item.title}</h3>
          <p className="line-clamp-2 text-sm text-[#6e6e73]">{item.benefit}</p>
          <p className="text-xs text-[#6e6e73]">
            {[item.durationLabel, item.rating != null ? `★ ${Number(item.rating).toFixed(1)}` : ''].filter(Boolean).join(' · ') || 'Online session'}
          </p>
          {price ? (
            <p className="pt-1">
              <span className="text-xl font-bold text-[#1d1d1f]">{formatInr(price.display)}</span>
              {price.showOffer ? <span className="ml-2 text-sm text-[#6e6e73] line-through">{formatInr(price.regular)}</span> : null}
              {item.unitLabel ? <span className="ml-1 text-xs text-[#6e6e73]">{item.unitLabel}</span> : null}
            </p>
          ) : (
            <p className="pt-1 text-sm text-[#6e6e73]">Fee confirmed when you book</p>
          )}
          {price?.showOffer ? (
            <span className="inline-flex rounded-full bg-[#fff1ef] px-2 py-0.5 text-xs font-semibold text-[#c9483b]">You save {formatInr(price.save)}</span>
          ) : null}
        </div>
      </button>
      <div className="mt-auto p-4">
        <button type="button" className="svc-btn w-full px-3 py-2.5 text-sm font-semibold" onClick={() => onOpen(item, true)}>
          {bookLabel}
        </button>
      </div>
    </article>
  );
}

function PlanCard({ item, onOpen, startLabel }) {
  const widths = phaseBarSegments(item.phases);
  const price = priceLine(item);
  const weekEnd = item.phases?.length ? item.phases[item.phases.length - 1].weekTo : item.weeksTotal;
  return (
    <article className="svc-card svc-rise flex h-full min-w-0 flex-col overflow-hidden text-left transition">
      <button type="button" className="block w-full text-left" onClick={() => onOpen(item)}>
        <ImageFrame item={item} ratio="aspect-[16/10]" />
        <div className="space-y-2 px-4 pt-3">
          <h3 className="text-base font-semibold text-[#1d1d1f]">{item.title}</h3>
          <p className="line-clamp-2 text-sm text-[#6e6e73]">{item.benefit}</p>
          <p className="truncate text-xs text-[#6e6e73]">
            {item.aiGuided ? <span className="mr-1 font-semibold text-[#376299]">✦ AI</span> : null}
            {item.phases?.length ? `${item.phases.length} phases` : null}
            {item.sessionsTotal ? ` · ${item.sessionsTotal} sessions` : ''}
          </p>
          {widths.some((width) => width > 0) ? (
            <div>
              <div className="flex h-1.5 overflow-hidden rounded-full">
                {item.phases.map((phase, index) => (
                  <span key={phase.id || index} className={PHASE_CLASS[index % 4]} style={{ width: `${widths[index]}%` }} />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-[#6e6e73]">
                <span>Week {item.phases[0].weekFrom}</span>
                <span>Week {weekEnd}</span>
              </div>
            </div>
          ) : null}
          {price ? (
            <p>
              <span className="text-xl font-bold">{formatInr(price.display)}</span>
              {price.showOffer ? <span className="ml-2 text-sm text-[#6e6e73] line-through">{formatInr(price.regular)}</span> : null}
              <span className="ml-1 text-xs text-[#6e6e73]">full plan</span>
            </p>
          ) : (
            <p className="text-sm text-[#6e6e73]">Fee confirmed when you book</p>
          )}
          {item.fromPrice > 0 ? <p className="text-xs text-[#6e6e73]">or pay per phase from <strong>{formatInr(item.fromPrice)}</strong></p> : null}
        </div>
      </button>
      <div className="mt-auto p-4">
        <button type="button" className="svc-btn inline-flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold" onClick={() => onOpen(item, true)}>
          <FaIcon icon="fa-flag" /> {startLabel}
        </button>
      </div>
    </article>
  );
}

export function TeleRehabAlias() {
  const { search, hash } = useLocation();
  return <Navigate to={`/telephysio${search}${hash}`} replace />;
}

export default function TeleRehabServiceBlock() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { phone, whatsapp } = useContact();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [views, setViews] = useState(() => readViewHistory());
  const [selectedChip, setSelectedChip] = useState(() => searchParams.get('chip') || '');
  const [activeSection, setActiveSection] = useState('');
  const [detail, setDetail] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [payMode, setPayMode] = useState('full');
  const [packageId, setPackageId] = useState('');
  const [sticky, setSticky] = useState(null);
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [layouts, setLayouts] = useState({});
  const sourceChip = useRef('');
  const openedSlug = useRef('');
  const panelRef = useRef(null);
  const chipRow = useRef(null);

  useEffect(() => {
    const visible = Boolean(sticky) && !detail && !sheet;
    setMobileBookbarVisible(visible, 'tele-services');
    return () => setMobileBookbarVisible(false, 'tele-services');
  }, [sticky, detail, sheet]);

  useEffect(() => {
    let cancelled = false;
    serviceCatalogue
      .public('telerehab')
      .then((res) => {
        if (cancelled) return;
        const payload = res.data || res;
        setData(payload);
        sourceChip.current = sourceChipFromVisit(payload.chips || [], searchParams);
        const requested = searchParams.get('chip') || '';
        if (requested && (payload.chips || []).some((chip) => chip.key === requested)) {
          setSelectedChip(requested);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Services could not be loaded');
      });
    return () => {
      cancelled = true;
    };
    // Source chip is read once from the landing URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chipsByItemId = useMemo(() => {
    const map = {};
    (data?.items || []).forEach((item) => {
      map[item.id] = (item.chipKeys || []).map((key) => ({ key, isPrimary: key === item.primaryChipKey }));
    });
    return map;
  }, [data]);

  const visitChips = useMemo(() => {
    if (!data?.chips) return [];
    const interest = chipInterest(views, chipsByItemId, sourceChip.current);
    return orderChipsForVisit(data.chips, interest);
  }, [data, views, chipsByItemId]);

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

  const chipLabel = visitChips.find((chip) => chip.key === selectedChip)?.label || '';
  const copy = quickPickCopy({
    selectedChipLabel: chipLabel,
    recentTitle: selectedChip ? '' : views[0]?.title || '',
    blocks: data?.blocks,
  });

  useEffect(() => {
    const slug = searchParams.get('service');
    if (!slug || !data?.items || openedSlug.current === slug) return;
    const item = data.items.find((row) => row.slug === slug);
    if (!item) return;
    openedSlug.current = slug;
    openDetail(item, false);
    // Open the deep link once the catalogue arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, searchParams]);

  useEffect(() => {
    if (!detail || !panelRef.current) return undefined;
    const node = panelRef.current;
    const focusable = node.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable[0]?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') {
        closeDetail();
        return;
      }
      if (event.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detail, sheet, eligibility]);

  useEffect(() => {
    const nodes = [...document.querySelectorAll('[data-svc-section]')];
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.getAttribute('data-svc-section') || '');
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0.2, 0.5] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [visibleSections]);

  function chooseChip(key) {
    const next = selectedChip === key ? '' : key;
    setSelectedChip(next);
    const params = new URLSearchParams(searchParams);
    if (next) params.set('chip', next);
    else params.delete('chip');
    setSearchParams(params, { replace: true });
    trackEvent(ANALYTICS_EVENTS.CHIP_SELECT, { chip_id: next || 'cleared', chip_label: next || 'cleared', section: 'tele-rehab-services' });
  }

  function openDetail(item, bookNow) {
    const nextViews = rememberView(item);
    setViews(nextViews);
    setDetail(item);
    setPayMode('full');
    setPackageId(item.packages?.[0] ? String(item.packages[0].id) : '');
    setExpandedPhase(0);
    setEligibility(null);
    const params = new URLSearchParams(searchParams);
    params.set('service', item.slug);
    setSearchParams(params, { replace: true });
    trackEvent(item.type === 'plan' ? ANALYTICS_EVENTS.PLAN_VIEW : ANALYTICS_EVENTS.SERVICE_VIEW, {
      item_id: item.slug,
      item_name: item.title,
      service_type: 'telephysio',
    });
    if (bookNow) {
      if (item.type === 'plan') setEligibility({ step: 0, outcome: '' });
      else startBooking(item);
    }
  }

  function closeDetail() {
    const closed = detail;
    openedSlug.current = '';
    setDetail(null);
    setSheet(null);
    setEligibility(null);
    const params = new URLSearchParams(searchParams);
    params.delete('service');
    setSearchParams(params, { replace: true });
    if (closed && window.matchMedia('(max-width: 700px)').matches) setSticky(closed);
  }

  function optionList() {
    return (data?.options || [])
      .map((option) => {
        if (option.key === 'whatsapp' && !option.whatsappNumber) return { ...option, whatsappNumber: whatsapp || '' };
        if (option.key === 'call' && !option.phone) return { ...option, phone: phone || '' };
        return option;
      })
      .filter((option) => {
        if (!option.isVisible) return false;
        if (option.key === 'whatsapp') return Boolean(option.whatsappNumber);
        if (option.key === 'call') return Boolean(option.phone);
        return Boolean(option.hrefTemplate);
      });
  }

  function optionHref(option, item, extra) {
    const ctx = bookingContext(item, extra);
    if (option.key === 'call' && option.phone) return `tel:${option.phone.replace(/[^\d+]/g, '')}`;
    if (option.key === 'whatsapp' && option.whatsappNumber) {
      const message = String(option.whatsappMessage || option.label || '').replace(
        /\{(service|slug|section|chip|price|package|pay|treatment|pain|plan)\}/g,
        (_, key) => ctx[key] ?? ''
      );
      return whatsappChatUrl(option.whatsappNumber, message) || '#';
    }
    return fillBookingTemplate(option.hrefTemplate, ctx);
  }

  function goOption(option, item, extra) {
    const href = optionHref(option, item, extra);
    trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {
      cta_id: option.key,
      cta_label: option.label,
      cta_location: 'tele-rehab-services',
      destination: href.startsWith('/') ? href.split('?')[0] : 'external',
    });
    if (href.startsWith('/')) {
      navigate(href);
      return;
    }
    if (option.openInNewTab) window.open(href, '_blank', 'noopener');
    else window.location.assign(href);
  }

  function startBooking(item, extra = {}) {
    const options = optionList();
    const packageRow = (item.packages || []).find((row) => String(row.id) === String(extra.packageId || packageId));
    const context = {
      ...extra,
      package: packageRow ? String(packageRow.sessions) : extra.package || '',
      pay: item.type === 'plan' ? extra.pay || payMode : '',
      pain: item.bookingPainType || '',
      chip: selectedChip || item.primaryChipKey || '',
    };
    if (options.length === 0) return;
    if (options.length === 1) {
      goOption(options[0], item, context);
      return;
    }
    setSheet({ item, extra: context });
  }

  function answerQuestion(answer) {
    if (!detail) return;
    if (answer.outcome !== 'ok') {
      setEligibility({ step: eligibility.step, outcome: answer.outcome });
      trackEvent(ANALYTICS_EVENTS.CTA_CLICK, { cta_id: 'eligibility', outcome: answer.outcome, item_id: detail.slug });
      return;
    }
    const next = eligibility.step + 1;
    if (next >= (detail.questions || []).length) {
      setEligibility({ step: next, outcome: 'ok' });
      trackEvent(ANALYTICS_EVENTS.CTA_CLICK, { cta_id: 'eligibility', outcome: 'ok', item_id: detail.slug });
      return;
    }
    setEligibility({ step: next, outcome: '' });
  }

  if (error) {
    return <section className="svc-cat px-4 py-8 text-sm text-[#6e6e73]">{error}</section>;
  }
  if (!data) {
    return <section className="svc-cat px-4 py-10 text-sm text-[#6e6e73]">Loading services…</section>;
  }

  const blocks = data.blocks || {};
  const bookLabel = blocks.bookNowLabel || 'Book now';
  const startLabel = blocks.startPlanLabel || 'Start plan';
  const showAi = blocks.showAiBanner && blocks.ai?.heading;

  return (
    <section className="svc-cat border-y border-[#e5e5ea]" aria-label="Tele-Rehab services">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {showAi ? (
          <div className="svc-card mb-6 grid gap-4 p-4 md:grid-cols-2">
            <div>
              {blocks.ai.tag ? <p className="text-xs font-semibold tracking-wide text-[#376299]">{blocks.ai.tag}</p> : null}
              <h2 className="mt-1 text-xl font-bold">{blocks.ai.heading}</h2>
              {blocks.ai.paragraph ? <p className="mt-2 text-sm text-[#6e6e73]">{blocks.ai.paragraph}</p> : null}
            </div>
          </div>
        ) : null}

        {blocks.showChips !== false && visitChips.length > 0 ? (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">{blocks.chipHeading || 'What do you need help with?'}</h2>
              {selectedChip ? (
                <button type="button" className="text-sm font-semibold text-[#376299]" onClick={() => chooseChip(selectedChip)}>
                  Clear
                </button>
              ) : null}
            </div>
            <div className="relative">
              <div ref={chipRow} className="flex gap-2 overflow-x-auto pb-1">
                {visitChips.map((chip) => (
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
          </div>
        ) : null}

        {picks.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-lg font-bold">{copy.heading}</h2>
            <p className="mb-3 text-sm text-[#ff6f61]">{copy.reason}</p>
            <div className="svc-picks">
              {picks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex h-16 items-center gap-3 rounded-xl bg-white px-2 text-left"
                  onClick={() => {
                    trackEvent(ANALYTICS_EVENTS.QUICK_PICK, { item_id: item.slug, item_name: item.title, section: 'quick-picks' });
                    openDetail(item, false);
                  }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e8e8ed]">
                    {mediaSrc(item) ? <img src={mediaSrc(item)} alt="" className="h-full w-full object-cover" /> : <FaIcon icon="fa-video" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {item.type === 'plan' ? <span className="mr-1 text-[10px] font-bold text-[#376299]">PLAN</span> : null}
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-[#6e6e73]">
                      {item.oftenBookedTogether ? <span className="text-[#ff6f61]">Often booked together · </span> : null}
                      {subtitleForPick(item) || 'Online session'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {blocks.showSections !== false && visibleSections.length > 0 ? (
          <>
            <div className="sticky top-14 z-20 -mx-4 mb-4 flex gap-2 overflow-x-auto bg-[#f5f5f7]/90 px-4 py-2 backdrop-blur sm:top-16">
              {visibleSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`svc-chip shrink-0 px-3 py-1.5 text-sm ${activeSection === section.slug ? 'svc-chip' : ''}`}
                  aria-pressed={activeSection === section.slug}
                  onClick={() => document.getElementById(`svc-${section.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  {section.title}
                </button>
              ))}
            </div>
            {visibleSections.map((section) => {
              const layout = layouts[section.id] || section.layout;
              const limit = layout === 'grid' ? Math.max(1, section.gridMaxRows) * 4 : section.items.length;
              const shown = section.items.slice(0, layouts[`${section.id}-all`] ? section.items.length : limit);
              return (
                <div key={section.id} id={`svc-${section.slug}`} data-svc-section={section.slug} className="mb-10 scroll-mt-28">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      {section.kicker ? <p className="text-[11px] font-semibold uppercase tracking-wide text-[#376299]">{section.kicker}</p> : null}
                      <h2 className="text-2xl font-bold">
                        {section.title} <span className="ml-1 rounded-full bg-white px-2 text-sm font-semibold text-[#6e6e73]">{section.items.length}</span>
                      </h2>
                      {section.subtitle ? <p className="mt-1 max-w-3xl text-sm text-[#6e6e73]">{section.subtitle}</p> : null}
                    </div>
                    {section.allowVisitorToggle ? (
                      <div className="flex gap-1">
                        {['carousel', 'grid'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            aria-label={`${mode} layout`}
                            className="svc-chip px-2 py-1 text-xs"
                            aria-pressed={layout === mode}
                            onClick={() => {
                              setLayouts((prev) => ({ ...prev, [section.id]: mode }));
                              localStorage.setItem(`${LAYOUT_KEY_PREFIX}${section.id}`, mode);
                            }}
                          >
                            <FaIcon icon={mode === 'grid' ? 'fa-table-cells' : 'fa-grip'} />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className={layout === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4' : 'svc-carousel pb-2'}>
                    {shown.map((item) =>
                      item.type === 'plan' ? (
                        <PlanCard key={item.id} item={item} onOpen={openDetail} startLabel={startLabel} />
                      ) : (
                        <ServiceCard key={item.id} item={item} onOpen={openDetail} bookLabel={bookLabel} />
                      )
                    )}
                  </div>
                  {layout === 'grid' && section.items.length > limit && !layouts[`${section.id}-all`] ? (
                    <button type="button" className="mt-3 text-sm font-semibold text-[#376299]" onClick={() => setLayouts((prev) => ({ ...prev, [`${section.id}-all`]: true }))}>
                      Show all ({section.items.length})
                    </button>
                  ) : null}
                  {section.showHelpCard && section.helpText ? <p className="svc-card svc-accent mt-4 p-4 text-sm">{section.helpText}</p> : null}
                </div>
              );
            })}
          </>
        ) : null}
      </div>

      {detail ? (
        <div className="fixed inset-0 z-[9985] flex items-end justify-center bg-black/40 md:items-stretch md:justify-end" onClick={closeDetail}>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="svc-detail-title"
            className="flex max-h-[92vh] w-full flex-col overflow-y-auto bg-white md:h-full md:max-h-none md:w-[460px]"
            onClick={(event) => event.stopPropagation()}
          >
            <DetailThumbnail item={detail} />
            <div className="p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 id="svc-detail-title" className="text-xl font-bold">{detail.title}</h2>
              <button type="button" className="svc-chip px-2 py-1" onClick={closeDetail} aria-label="Close">×</button>
            </div>
            <p className="text-sm text-[#6e6e73]">{detail.benefit}</p>
            <p className="mt-2 text-xs text-[#6e6e73]">
              {[detail.durationLabel, detail.rating != null ? `★ ${Number(detail.rating).toFixed(1)}` : '', 'From anywhere'].filter(Boolean).join(' · ')}
            </p>
            {detail.type === 'service' && detail.packages?.length ? (
              <div className="mt-4 flex gap-2">
                {detail.packages.map((row) => (
                  <button key={row.id} type="button" className="svc-chip px-3 py-2 text-sm" aria-pressed={String(packageId) === String(row.id)} onClick={() => setPackageId(String(row.id))}>
                    {row.sessions} sessions · {formatInr(row.total)}
                  </button>
                ))}
              </div>
            ) : null}
            {detail.included?.length ? (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">{detail.included.map((line) => <li key={line}>{line}</li>)}</ul>
            ) : null}
            {detail.type === 'plan' ? (
              <div className="mt-4 space-y-3">
                {(detail.phases || []).map((phase, index) => (
                  <div key={phase.id || index} className="svc-accent pl-3">
                    <button type="button" className="text-left text-sm font-semibold" onClick={() => setExpandedPhase(expandedPhase === index ? -1 : index)}>
                      {index + 1}. {phase.name || `Phase ${index + 1}`} · Week {phase.weekFrom}–{phase.weekTo}
                    </button>
                    {expandedPhase === index ? (
                      <div className="mt-1 text-sm text-[#6e6e73]">
                        {phase.goal ? <p>{phase.goal}</p> : null}
                        {phase.milestone ? <p className="mt-1">Milestone your physio checks before the next phase: {phase.milestone}</p> : null}
                        <p className="mt-1 font-semibold text-[#1d1d1f]">{formatInr(phase.price)}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" className="svc-card p-3 text-left" aria-pressed={payMode === 'full'} onClick={() => setPayMode('full')}>
                    <span className="block text-sm font-semibold">Full plan</span>
                    <span className="text-sm">{detail.price?.display != null ? formatInr(detail.price.display) : 'Fee confirmed when you book'}</span>
                    {detail.planSavings?.save > 0 ? <span className="mt-1 block text-xs text-[#c9483b]">Save {formatInr(detail.planSavings.save)}</span> : null}
                  </button>
                  <button type="button" className="svc-card p-3 text-left" aria-pressed={payMode === 'phase'} onClick={() => setPayMode('phase')}>
                    <span className="block text-sm font-semibold">Pay per phase</span>
                    <span className="text-sm">{detail.fromPrice != null ? formatInr(detail.fromPrice) : 'Phase 1'}</span>
                  </button>
                </div>
                {detail.goodFit?.length || detail.seeDoctor?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div><p className="font-semibold">Good fit if</p><ul className="list-disc pl-4">{detail.goodFit.map((line) => <li key={line}>{line}</li>)}</ul></div>
                    <div><p className="font-semibold">See a doctor first if</p><ul className="list-disc pl-4">{detail.seeDoctor.map((line) => <li key={line}>{line}</li>)}</ul></div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {blocks.needs?.length ? (
              <div className="mt-4 text-sm">
                <p className="font-semibold">What you&apos;ll need</p>
                <ul className="list-disc pl-5 text-[#6e6e73]">{blocks.needs.map((line) => <li key={line}>{line}</li>)}</ul>
              </div>
            ) : null}
            {detail.disclaimer ? <p className="svc-accent mt-4 pl-3 text-xs text-[#6e6e73]">{detail.disclaimer}</p> : null}
            <p className="mt-4 text-xs text-[#6e6e73]">Payment uses your physiotherapist&apos;s online fee in the booking form. Catalogue prices are the listed package amounts.</p>
            <div className="sticky bottom-0 mt-4 bg-white py-3">
              {detail.type === 'plan' ? (
                <button type="button" className="svc-btn w-full py-3 text-sm font-semibold" onClick={() => setEligibility({ step: 0, outcome: '' })}>
                  {startLabel}{detail.price?.display != null && payMode === 'full' ? ` · ${formatInr(detail.price.display)}` : ''}
                </button>
              ) : (
                <button type="button" className="svc-btn w-full py-3 text-sm font-semibold" onClick={() => startBooking(detail)}>{bookLabel}</button>
              )}
            </div>
            {eligibility && detail.questions?.length ? (
              <Eligibility
                item={detail}
                state={eligibility}
                blocks={blocks}
                onAnswer={answerQuestion}
                onBack={() => setEligibility(eligibility.step > 0 && !eligibility.outcome ? { step: eligibility.step - 1, outcome: '' } : null)}
                onBook={() => startBooking(detail, { pay: payMode })}
                onConsult={() => {
                  const consult = (data.items || []).find((item) => item.id === detail.consultItemId) || (data.items || []).find((item) => item.type === 'service');
                  if (consult) startBooking(consult);
                }}
              />
            ) : null}
            {eligibility && !detail.questions?.length ? (
              <p className="mt-3 text-sm text-[#6e6e73]">This plan is not open for booking until a physiotherapist adds the eligibility questions.</p>
            ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {sheet ? (
        <BookingChoiceDialog
          titleId="svc-book-title"
          item={sheet.item}
          options={optionList()}
          onClose={() => setSheet(null)}
          onChoose={(option) => goOption(option, sheet.item, sheet.extra)}
        />
      ) : null}

      {sticky && !detail && !sheet ? (
        <div className="svc-mobile-bookbar fixed inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-2xl bg-[#1d1d1f] px-4 py-3 text-white shadow-xl md:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{sticky.title}</p>
            <p className="text-xs text-white/80">{sticky.price?.display != null ? formatInr(sticky.price.display) : 'Fee confirmed when you book'}</p>
          </div>
          <button type="button" className="svc-btn shrink-0 px-3 py-2 text-sm" onClick={() => openDetail(sticky, true)}>
            {sticky.type === 'plan' ? startLabel : bookLabel}
          </button>
          <button type="button" className="text-white" aria-label="Dismiss" onClick={() => setSticky(null)}>×</button>
        </div>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: (data.items || []).map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Service',
                name: item.title,
                description: item.benefit,
                ...(item.price?.display != null ? { offers: { '@type': 'Offer', priceCurrency: 'INR', price: item.price.display } } : {}),
              },
            })),
          }).replace(/</g, '\\u003c'),
        }}
      />
    </section>
  );
}

function Eligibility({ item, state, blocks, onAnswer, onBack, onBook, onConsult }) {
  const outcomes = blocks.outcomes || {};
  if (state.outcome === 'urgent') {
    return (
      <div className="mt-4 rounded-xl bg-[#fff1ef] p-4 text-sm">
        <p className="font-semibold">{outcomes.urgentTitle || 'Please get urgent medical care'}</p>
        <p className="mt-1 text-[#6e6e73]">Contact a doctor or emergency service today. This plan is not offered.</p>
      </div>
    );
  }
  if (state.outcome === 'stop') {
    return (
      <div className="mt-4 rounded-xl bg-[#f5f5f7] p-4 text-sm">
        <p className="font-semibold">{outcomes.stopTitle || 'Please see your doctor first'}</p>
        <p className="mt-1">This plan is not the right start yet.</p>
      </div>
    );
  }
  if (state.outcome === 'consult') {
    return (
      <div className="mt-4 rounded-xl bg-[#f5f5f7] p-4 text-sm">
        <p className="font-semibold">{outcomes.consultTitle || "Let's check your case first"}</p>
        <button type="button" className="svc-btn mt-3 px-3 py-2" onClick={onConsult}>Book a consultation first</button>
      </div>
    );
  }
  if (state.outcome === 'ok') {
    return (
      <div className="mt-4 rounded-xl bg-[#eef3f8] p-4 text-sm">
        <p className="font-semibold">{outcomes.okTitle || "You're a good fit for this plan"}</p>
        <p className="mt-1 text-[#6e6e73]">Your physio confirms everything in your first session.</p>
        <button type="button" className="svc-btn mt-3 px-3 py-2" onClick={onBook}>Start this plan</button>
      </div>
    );
  }
  const question = item.questions[state.step];
  if (!question) return null;
  return (
    <div className="mt-4">
      <p className="text-xs text-[#6e6e73]">Quick check before you start · {state.step + 1} of {item.questions.length}</p>
      <p className="mt-2 font-semibold">{question.prompt}</p>
      <div className="mt-3 space-y-2">
        {question.answers.map((answer) => (
          <button key={answer.id || answer.label} type="button" className="svc-card w-full px-3 py-3 text-left text-sm font-semibold" onClick={() => onAnswer(answer)}>
            {answer.label}
          </button>
        ))}
      </div>
      <button type="button" className="mt-3 text-sm text-[#376299]" onClick={onBack}>Back</button>
    </div>
  );
}
