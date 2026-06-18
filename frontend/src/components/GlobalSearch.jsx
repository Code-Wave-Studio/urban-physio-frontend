import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import FaIcon from './FaIcon';
import { search } from '../services/api';
import { useLocation } from '../contexts/LocationContext';

const QUICK_TAGS = ['Back pain', 'Knee pain', 'Neck pain', 'Sports injury'];

const MENU_Z = 10060;

export default function GlobalSearch({ variant = 'hero', className = '', onNavigate }) {
  const navigate = useNavigate();
  const { city } = useLocation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ doctors: [], clinics: [], conditions: [], symptoms: [] });
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const debounceRef = useRef(null);

  const isHero = variant === 'hero';
  const isHeader = variant === 'header';

  const flatItems = useMemo(() => {
    const items = [];
    results.doctors.slice(0, 4).forEach((d) => {
      items.push({
        type: 'doctor',
        key: `d-${d.id}`,
        label: `Dr. ${d.first_name} ${d.last_name}`,
        sub: d.specialization || d.city_name || 'Physiotherapist',
        to: `/doctors/${d.id}`,
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
        to: `/book?clinic_id=${c.id}`,
        icon: 'fa-hospital',
        iconColor: 'text-emerald-600 bg-emerald-50',
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
    results.symptoms.slice(0, 3).forEach((s, i) => {
      items.push({
        type: 'symptom',
        key: `s-${s.id}-${i}`,
        label: s.title || s.chip_label || s.label,
        sub: s.subtitle || s.source === 'pain_type' ? 'Symptom / pain type' : 'Symptom',
        to: `/conditions?search=${encodeURIComponent(s.title || s.chip_label || '')}`,
        icon: 'fa-heart-pulse',
        iconColor: 'text-rose-600 bg-rose-50',
      });
    });
    return items;
  }, [results]);

  const totalCount =
    results.doctors.length +
    results.clinics.length +
    results.conditions.length +
    results.symptoms.length;

  const updateMenuPosition = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const maxW = Math.min(rect.width, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - maxW - 8));
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + gap,
      left,
      width: maxW,
      zIndex: MENU_Z,
    });
  }, []);

  const runSearch = useCallback(
    async (q) => {
      const term = q.trim();
      if (term.length < 2) {
        setResults({ doctors: [], clinics: [], conditions: [], symptoms: [] });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const params = { q: term, search: term };
        if (city?.id) params.city_id = city.id;
        const res = await search.universal(params);
        const data = res?.data ?? res ?? {};
        setResults({
          doctors: data.doctors ?? [],
          clinics: data.clinics ?? [],
          conditions: data.conditions ?? [],
          symptoms: data.symptoms ?? [],
        });
      } catch {
        setResults({ doctors: [], clinics: [], conditions: [], symptoms: [] });
      } finally {
        setLoading(false);
      }
    },
    [city?.id]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults({ doctors: [], clinics: [], conditions: [], symptoms: [] });
      setLoading(false);
      return undefined;
    }
    debounceRef.current = setTimeout(() => runSearch(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  useEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    const onResize = () => updateMenuPosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, updateMenuPosition, query]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
      setActiveIndex(-1);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

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

  const inputClass = isHero
    ? 'w-full bg-white/95 backdrop-blur-md border-0 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-12 pr-28 sm:pr-32 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 shadow-xl shadow-black/10 focus:ring-2 focus:ring-orange-400/80 outline-none'
    : isHeader
      ? 'w-full bg-slate-50/90 border border-slate-200/80 rounded-full py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/60 focus:border-orange-300 outline-none'
      : 'input-field pl-10';

  const wrapClass = isHero
    ? 'relative w-full max-w-2xl mx-auto md:mx-0'
    : isHeader
      ? 'relative w-full min-w-[140px] max-w-[220px] xl:max-w-[260px]'
      : 'relative w-full';

  const dropdown = showDropdown && menuStyle && createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="global-search-menu rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden animate-fade-in"
      role="listbox"
    >
      {loading ? (
        <div className="px-4 py-6 text-center text-sm text-slate-500">
          <FaIcon icon="fa-spinner" className="fa-spin mr-2" />
          Searching…
        </div>
      ) : totalCount === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-slate-600">No matches for &ldquo;{query.trim()}&rdquo;</p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-orange-600 hover:text-orange-700"
            onClick={submitSearch}
          >
            View all results
          </button>
        </div>
      ) : (
        <>
          <div className="max-h-[min(60vh,360px)] overflow-y-auto py-1">
            {flatItems.map((item, i) => (
              <button
                key={item.key}
                type="button"
                role="option"
                aria-selected={activeIndex === i}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${
                  activeIndex === i ? 'bg-orange-50' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setActiveIndex(i)}
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
              className="w-full text-center text-xs font-semibold text-orange-600 hover:text-orange-700 py-1.5"
            >
              View all results for &ldquo;{query.trim()}&rdquo;
            </button>
          </div>
        </>
      )}
    </div>,
    document.body
  );

  return (
    <div className={`${wrapClass} ${className}`} ref={wrapRef}>
      <div className="relative">
        <FaIcon
          icon="fa-magnifying-glass"
          className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${
            isHero
              ? 'left-4 text-base text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]'
              : 'left-3 text-sm text-orange-400'
          }`}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={
            isHero
              ? 'Search doctors, clinics, conditions, symptoms…'
              : 'Search…'
          }
          aria-label="Universal search"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          className={inputClass}
          autoComplete="off"
        />
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

      {isHero && (
        <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span className="text-[11px] sm:text-xs text-slate-300/90 font-medium">Popular:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(tag);
                setOpen(true);
                inputRef.current?.focus();
              }}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 hover:bg-white/20 transition"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {dropdown}
    </div>
  );
}
