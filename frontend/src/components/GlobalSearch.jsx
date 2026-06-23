import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from './FaIcon';
import { search } from '../services/api';
import { useLocation } from '../contexts/LocationContext';
import { localSearchMatches, mergeSearchResults, QUICK_SEARCH_TAGS } from '../utils/searchCatalog';
import { doctorProfileUrl, clinicProfileUrl } from '../utils/profileUrls';

const QUICK_TAGS = QUICK_SEARCH_TAGS;

const HERO_TYPE_QUERIES = [
  'knee pain specialist near me',
  'physio in Noida',
  'back pain treatment',
  'home visit physiotherapy',
  'sports injury rehab',
  'neck pain doctor',
];

const MENU_Z = 10060;
const SEARCH_HINT = 'Try knee pain, Mumbai, physio near me…';

const EMPTY_RESULTS = {
  doctors: [],
  clinics: [],
  conditions: [],
  treatments: [],
  symptoms: [],
  locations: [],
  packages: [],
  articles: [],
  exercises: [],
};

function symptomSubtitle(s) {
  if (s.subtitle) return s.subtitle;
  return s.source === 'pain_type' ? 'Symptom / pain type' : 'Symptom';
}

export default function GlobalSearch({
  variant = 'hero',
  className = '',
  onNavigate,
  autoFocus = false,
}) {
  const navigate = useNavigate();
  const { city, coords } = useLocation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [apiFailed, setApiFailed] = useState(false);
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const debounceRef = useRef(null);
  const lastErrorRef = useRef('');

  const isHero = variant === 'hero';
  const isHeader = variant === 'header';
  const isMobile = variant === 'mobile';

  useEffect(() => {
    if (!isHero || query.trim()) {
      setTypedPlaceholder('');
      return undefined;
    }
    const phrase = HERO_TYPE_QUERIES[phraseIdx % HERO_TYPE_QUERIES.length];
    const delay = deleting ? 35 : charIdx === phrase.length ? 1800 : 65;
    const t = setTimeout(() => {
      if (!deleting) {
        if (charIdx < phrase.length) {
          setTypedPlaceholder(phrase.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        } else {
          setDeleting(true);
        }
      } else if (charIdx > 0) {
        setTypedPlaceholder(phrase.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      } else {
        setDeleting(false);
        setPhraseIdx((i) => (i + 1) % HERO_TYPE_QUERIES.length);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [isHero, query, phraseIdx, charIdx, deleting]);

  const flatItems = useMemo(() => {
    const items = [];
    results.doctors.slice(0, 4).forEach((d) => {
      items.push({
        type: 'doctor',
        key: `d-${d.id}`,
        label: `Dr. ${d.first_name} ${d.last_name}`,
        sub: d.specialization || d.city_name || 'Physiotherapist',
        to: doctorProfileUrl(d),
        icon: 'fa-user-doctor',
        iconColor: 'text-orange-600 bg-orange-50',
      });
    });
    results.clinics.slice(0, 3).forEach((c) => {
      items.push({
        type: 'clinic',
        key: `cl-${c.id}`,
        label: c.name,
        sub: c.city_name || c.address || 'Clinic',
        to: clinicProfileUrl(c),
        icon: 'fa-hospital',
        iconColor: 'text-emerald-600 bg-emerald-50',
      });
    });
    results.treatments.slice(0, 3).forEach((t, i) => {
      items.push({
        type: 'treatment',
        key: `t-${t.id ?? t.slug}-${i}`,
        label: t.title,
        sub: t.short_description || 'Treatment programme',
        to: t.slug ? `/treatments/${t.slug}` : '/treatments',
        icon: 'fa-hand-holding-medical',
        iconColor: 'text-amber-600 bg-amber-50',
      });
    });
    results.conditions.slice(0, 3).forEach((c) => {
      items.push({
        type: 'condition',
        key: `c-${c.id}`,
        label: c.title,
        sub: c.short_description || 'Condition',
        to: `/conditions/${c.slug}`,
        icon: 'fa-notes-medical',
        iconColor: 'text-blue-600 bg-blue-50',
      });
    });
    results.locations.slice(0, 2).forEach((loc) => {
      items.push({
        type: 'location',
        key: `loc-${loc.id}`,
        label: loc.name,
        sub: loc.state_name ? `${loc.state_name} · City` : 'City',
        to: `/doctors?city_id=${loc.id}`,
        icon: 'fa-location-dot',
        iconColor: 'text-violet-600 bg-violet-50',
      });
    });
    results.symptoms.slice(0, 3).forEach((s, i) => {
      items.push({
        type: 'symptom',
        key: `s-${s.id}-${i}`,
        label: s.title || s.chip_label || s.label,
        sub: symptomSubtitle(s),
        to: `/conditions?search=${encodeURIComponent(s.title || s.chip_label || '')}`,
        icon: 'fa-heart-pulse',
        iconColor: 'text-rose-600 bg-rose-50',
      });
    });
    results.packages.slice(0, 2).forEach((p) => {
      items.push({
        type: 'package',
        key: `pkg-${p.id}`,
        label: p.name,
        sub: p.short_description || `${p.total_sessions || ''} sessions`.trim() || 'Care package',
        to: p.slug ? `/packages/book/${encodeURIComponent(p.slug)}` : '/packages',
        icon: 'fa-box-open',
        iconColor: 'text-indigo-600 bg-indigo-50',
      });
    });
    results.articles.slice(0, 2).forEach((a) => {
      items.push({
        type: 'article',
        key: `art-${a.id}`,
        label: a.title,
        sub: a.excerpt || a.type || 'PhysioFeed',
        to: a.slug ? `/physiofeed/${a.slug}` : '/physiofeed',
        icon: 'fa-newspaper',
        iconColor: 'text-sky-600 bg-sky-50',
      });
    });
    results.exercises.slice(0, 2).forEach((e) => {
      items.push({
        type: 'exercise',
        key: `ex-${e.id}`,
        label: e.name,
        sub: e.body_area || e.difficulty || 'Exercise',
        to: e.slug ? `/exercises/${e.slug}` : '/exercises',
        icon: 'fa-dumbbell',
        iconColor: 'text-teal-600 bg-teal-50',
      });
    });
    return items;
  }, [results]);

  const totalCount =
    results.doctors.length +
    results.clinics.length +
    results.treatments.length +
    results.conditions.length +
    results.symptoms.length +
    results.locations.length +
    results.packages.length +
    results.articles.length +
    results.exercises.length;

  const updateMenuPosition = useCallback(() => {
    if (isMobile) return;
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const maxW = Math.min(rect.width, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - maxW - 8));
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const maxH = Math.min(360, Math.max(160, spaceBelow - 8));
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + gap,
      left,
      width: maxW,
      maxHeight: maxH,
      zIndex: MENU_Z,
    });
  }, [isMobile]);

  const runSearch = useCallback(
    async (q) => {
      const term = q.trim();
      if (term.length < 2) {
        setResults(EMPTY_RESULTS);
        setLoading(false);
        setApiFailed(false);
        return;
      }

      const local = localSearchMatches(term);
      setResults(mergeSearchResults({}, local));
      setLoading(true);
      setApiFailed(false);

      try {
        const params = { q: term, search: term };
        if (city?.id) params.city_id = city.id;
        if (coords?.lat != null && coords?.lng != null) {
          params.lat = coords.lat;
          params.lng = coords.lng;
        }
        const res = await search.universal(params);
        const data = res?.data ?? res ?? {};
        setResults(mergeSearchResults(data, local));
        setApiFailed(false);
      } catch (err) {
        setResults(mergeSearchResults({}, local));
        const hasLocal = local.treatments.length + local.symptoms.length > 0;
        setApiFailed(!hasLocal);
        const errKey = `${term}:${err?.status ?? 'x'}`;
        if (!hasLocal && err?.status !== 429 && lastErrorRef.current !== errKey) {
          lastErrorRef.current = errKey;
          toast.error('Search is temporarily unavailable');
        } else if (err?.status === 429 && lastErrorRef.current !== errKey) {
          lastErrorRef.current = errKey;
          toast.error('Too many searches — please wait a moment');
        }
      } finally {
        setLoading(false);
      }
    },
    [city?.id, coords?.lat, coords?.lng]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return undefined;
    }
    debounceRef.current = setTimeout(() => runSearch(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  useEffect(() => {
    if (!open || isMobile) return undefined;
    updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    const onResize = () => updateMenuPosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, updateMenuPosition, query, isMobile]);

  useEffect(() => {
    const onDocPointer = (e) => {
      if (wrapRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
      setActiveIndex(-1);
    };
    document.addEventListener('mousedown', onDocPointer);
    document.addEventListener('touchstart', onDocPointer, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDocPointer);
      document.removeEventListener('touchstart', onDocPointer);
    };
  }, []);

  useEffect(() => {
    if (!autoFocus) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [autoFocus]);

  const goTo = (path) => {
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
    onNavigate?.();
    navigate(path);
  };

  const submitSearch = () => {
    const term = query.trim();
    if (!term) return;
    if (activeIndex >= 0 && flatItems[activeIndex]) {
      goTo(flatItems[activeIndex].to);
      return;
    }
    goTo(`/search?q=${encodeURIComponent(term)}`);
  };

  const applyQuickTag = (tag) => {
    setQuery(tag);
    setOpen(true);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const clearQuery = () => {
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    setResults(EMPTY_RESULTS);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSearch();
      return;
    }
    if (!open || flatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1));
    }
  };

  const showDropdown = open && query.trim().length >= 2;
  const showQuickTags = isHero;
  const trimmedQuery = query.trim();

  const heroPlaceholder = typedPlaceholder ? `Search ${typedPlaceholder}` : 'Search physiotherapy…';

  const inputClass = isHero
    ? 'w-full bg-white/95 backdrop-blur-md border-0 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-12 pr-28 sm:pr-32 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 shadow-xl shadow-black/10 focus:ring-2 focus:ring-orange-400/80 outline-none'
    : isMobile
      ? 'w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-base text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/70 focus:border-orange-300 outline-none'
      : isHeader
        ? 'w-full bg-slate-50/90 border border-slate-200/80 rounded-full py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/60 focus:border-orange-300 outline-none'
        : 'input-field pl-10';

  const wrapClass = isHero
    ? 'relative w-full max-w-2xl mx-auto md:mx-0'
    : isMobile
      ? 'relative w-full'
      : isHeader
        ? 'relative w-full min-w-[140px] max-w-[220px] xl:max-w-[260px]'
        : 'relative w-full';

  const renderDropdownBody = () => {
    if (loading && totalCount === 0) {
      return (
        <div className="px-4 py-6 text-center text-sm text-slate-500">
          <FaIcon icon="fa-spinner" className="fa-spin mr-2" />
          Searching…
        </div>
      );
    }
    if (totalCount === 0 && !loading) {
      return (
        <div className="px-4 py-5 text-center">
          <p className="text-sm text-slate-600">No matches for &ldquo;{trimmedQuery}&rdquo;</p>
          {apiFailed && (
            <p className="text-xs text-amber-600 mt-2">Live search unavailable — showing quick links only</p>
          )}
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-orange-600 hover:text-orange-700 active:text-orange-800"
            onClick={submitSearch}
          >
            Browse all results
          </button>
        </div>
      );
    }
    return (
      <>
        {loading && (
          <p className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <FaIcon icon="fa-spinner" className="fa-spin" />
            Finding doctors, clinics &amp; more…
          </p>
        )}
        {apiFailed && !loading && (
          <p className="px-3 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100">
            Showing quick matches — full search loading may be limited
          </p>
        )}
        <div
          className={`overflow-y-auto py-1 overscroll-contain ${
            isMobile ? 'max-h-[min(42vh,280px)]' : 'max-h-[min(60vh,360px)]'
          }`}
        >
          {flatItems.map((item, i) => (
            <button
              key={item.key}
              type="button"
              role="option"
              aria-selected={activeIndex === i}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left transition touch-manipulation ${
                activeIndex === i ? 'bg-orange-50' : 'hover:bg-slate-50 active:bg-orange-50/80'
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onTouchStart={() => setActiveIndex(i)}
              onClick={() => goTo(item.to)}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.iconColor}`}>
                <FaIcon icon={item.icon} className="text-sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900 truncate">{item.label}</span>
                <span className="block text-xs text-slate-500 truncate capitalize">{item.type} · {item.sub}</span>
              </span>
              <FaIcon icon="fa-arrow-right" className="text-xs text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
        <div className="border-t border-slate-100 px-3 py-2 bg-slate-50/80">
          <button
            type="button"
            onClick={submitSearch}
            className="w-full text-center text-xs font-semibold text-orange-600 hover:text-orange-700 active:text-orange-800 py-2 touch-manipulation"
          >
            View all results for &ldquo;{trimmedQuery}&rdquo;
          </button>
        </div>
      </>
    );
  };

  const dropdownPanelClass =
    'global-search-menu rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden animate-fade-in';

  const inlineDropdown =
    isMobile && showDropdown ? (
      <div ref={menuRef} className={`mt-2 ${dropdownPanelClass}`} role="listbox">
        {renderDropdownBody()}
      </div>
    ) : null;

  const portalDropdown =
    !isMobile && showDropdown && menuStyle
      ? createPortal(
          <div ref={menuRef} style={menuStyle} className={dropdownPanelClass} role="listbox">
            {renderDropdownBody()}
          </div>,
          document.body
        )
      : null;

  return (
    <div className={`${wrapClass} ${className}`} ref={wrapRef}>
      {isMobile && (
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Search</p>
      )}

      <div className={isMobile ? 'flex items-stretch gap-2' : 'relative'}>
        <div className={`relative ${isMobile ? 'min-w-0 flex-1' : ''}`}>
          <FaIcon
            icon="fa-magnifying-glass"
            className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${
              isHero
                ? 'left-4 text-base text-slate-700'
                : 'left-3 text-sm text-slate-600'
            }`}
          />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={isHero ? heroPlaceholder : isMobile ? SEARCH_HINT : 'Search…'}
            aria-label="Universal search"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            className={inputClass}
            autoComplete="off"
          />
          {trimmedQuery && !isHero && (
            <button
              type="button"
              onClick={clearQuery}
              className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:text-slate-800 touch-manipulation ${
                isMobile ? 'right-3 p-1' : 'right-2.5'
              }`}
              aria-label="Clear search"
            >
              <FaIcon icon="fa-circle-xmark" className="text-sm" />
            </button>
          )}
          {isHero && (
            <button
              type="button"
              onClick={submitSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-md transition"
            >
              Search
            </button>
          )}
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={submitSearch}
            disabled={!trimmedQuery}
            className="shrink-0 self-center bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-3 rounded-xl shadow-sm transition touch-manipulation"
          >
            Go
          </button>
        )}
      </div>

      {showQuickTags && (
        <div
          className={`mt-3 flex flex-wrap items-center gap-2 ${
            isMobile ? 'justify-start' : 'justify-center md:justify-start'
          }`}
        >
          <span
            className={`text-[11px] sm:text-xs font-medium ${
              isHero ? 'text-slate-300/90' : 'text-slate-500'
            }`}
          >
            Popular:
          </span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => applyQuickTag(tag)}
              className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full transition touch-manipulation ${
                isHero
                  ? 'bg-white/10 border border-white/20 text-white/90 hover:bg-white/20'
                  : 'bg-orange-50 border border-orange-100 text-orange-700 hover:bg-orange-100 active:bg-orange-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {inlineDropdown}
      {portalDropdown}
    </div>
  );
}
