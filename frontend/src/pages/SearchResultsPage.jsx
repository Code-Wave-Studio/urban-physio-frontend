import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import SearchAIOverview from '../components/search/SearchAIOverview';
import SearchFilterChips from '../components/search/SearchFilterChips';
import SearchDoctorCard from '../components/search/SearchDoctorCard';
import SearchClinicCard from '../components/search/SearchClinicCard';
import HighlightText from '../components/search/HighlightText';
import { search } from '../services/api';
import { useLocation } from '../contexts/LocationContext';
import { localSearchMatches, mergeSearchResults, QUICK_SEARCH_TAGS } from '../utils/searchCatalog';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  SEARCH_SUGGESTIONS,
  TRENDING_SEARCHES,
} from '../utils/searchHistory';
import { useTypingSearchPlaceholder } from '../hooks/useTypingSearchPlaceholder';

const TYPE_MAP = {
  doctors: 'doctors',
  clinics: 'clinics',
  services: 'services',
  treatments: 'treatments',
  conditions: 'conditions',
  exercises: 'exercises',
  articles: 'articles',
  blogs: 'articles',
  packages: 'packages',
  symptoms: 'symptoms',
  locations: 'locations',
  faqs: 'faqs',
};

function EntityGrid({ title, icon, items, children, type }) {
  if (!items?.length) return null;

  return (
    <section className="mb-10" aria-labelledby={`section-${type}`}>
      <h2 id={`section-${type}`} className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
        <FaIcon icon={icon} className="text-orange-600" />
        {title}
        <span className="text-sm font-normal text-slate-500">({items.length})</span>
      </h2>
      <div className="grid sm:grid-cols-2 gap-4 items-start">{items.map(children)}</div>
    </section>
  );
}

function EduSection({ title, icon, items, render }) {
  if (!items?.length) return null;
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
        <FaIcon icon={icon} className="text-slate-500" />
        {title}
        <span className="text-sm font-normal text-slate-500">({items.length})</span>
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{items.map(render)}</div>
    </section>
  );
}

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const typeParam = params.get('type') || '';
  const [input, setInput] = useState(q);
  const [suggestions, setSuggestions] = useState([]);
  const [sugIndex, setSugIndex] = useState(-1);
  const [sugOpen, setSugOpen] = useState(false);
  const { city, coords } = useLocation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState(() => getRecentSearches());

  const searchPlaceholder = useTypingSearchPlaceholder(undefined, !input.trim(), input, 'try');

  useEffect(() => {
    setInput(q);
  }, [q]);

  const runSearch = useCallback(
    (term, type = typeParam) => {
      const trimmed = String(term || '').trim();
      if (trimmed.length < 2) return;
      addRecentSearch(trimmed);
      setRecent(getRecentSearches());
      const next = { q: trimmed };
      if (type) next.type = type;
      setParams(next);
    },
    [setParams, typeParam]
  );

  const setTypeFilter = (type) => {
    const next = { q };
    if (type) next.type = type;
    setParams(next);
  };

  useEffect(() => {
    setSugIndex(-1);
    if (input.length >= 2) {
      const t = setTimeout(() => {
        search
          .suggest({ q: input, limit: 8 })
          .then((res) => {
            setSuggestions(res?.data?.suggestions || res?.suggestions || []);
            setSugOpen(true);
          })
          .catch(() => setSuggestions([]));
      }, 150);
      return () => clearTimeout(t);
    }
    setSuggestions([]);
    return undefined;
  }, [input]);

  useEffect(() => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const local = localSearchMatches(q);
    setResults(mergeSearchResults({}, local));
    setLoading(true);
    setSugOpen(false);

    const apiParams = { q, search: q, limit: 20 };
    if (typeParam) apiParams.type = TYPE_MAP[typeParam] || typeParam;
    if (city?.id) apiParams.city_id = city.id;
    if (coords?.lat != null && coords?.lng != null) {
      apiParams.lat = coords.lat;
      apiParams.lng = coords.lng;
    }

    search
      .universal(apiParams, { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setResults(mergeSearchResults(res?.data ?? res, local));
        }
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.code === 'ERR_CANCELED') return;
        const merged = mergeSearchResults({}, local);
        setResults(merged);
        if (!merged.treatments?.length && !merged.symptoms?.length && !merged.doctors?.length) {
          toast.error(err?.status === 429 ? 'Too many searches — wait a moment' : 'Search temporarily unavailable');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [q, typeParam, city?.id, coords?.lat, coords?.lng]);

  const trackClick = useCallback(
    (entityType, entityId) => {
      if (!q) return;
      search.trackClick({ query: q, entity_type: entityType, entity_id: entityId }).catch(() => {});
    },
    [q]
  );

  const pickSuggestion = (s) => {
    setSugOpen(false);
    setSugIndex(-1);
    setInput(s);
    runSearch(s);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sugOpen && sugIndex >= 0 && suggestions[sugIndex]) {
      pickSuggestion(suggestions[sugIndex]);
      return;
    }
    setSugOpen(false);
    runSearch(input);
  };

  // Keyboard navigation for the autocomplete dropdown: Arrow Up/Down, Enter, Escape.
  const onInputKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSugOpen(false);
      setSugIndex(-1);
      return;
    }
    if (!sugOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSugIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSugIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  };

  const chipClass =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 transition';

  const showLanding = !q || q.length < 2;

  const filtered = useMemo(() => {
    if (!results || !typeParam) return results;
    const key = TYPE_MAP[typeParam] || typeParam;
    return {
      ...results,
      doctors: key === 'doctors' ? results.doctors : [],
      clinics: key === 'clinics' ? results.clinics : [],
      services: key === 'services' ? results.services : [],
      treatments: key === 'treatments' ? results.treatments : [],
      conditions: key === 'conditions' ? results.conditions : [],
      exercises: key === 'exercises' ? results.exercises : [],
      articles: key === 'articles' ? results.articles : [],
      packages: key === 'packages' ? results.packages : [],
      symptoms: key === 'symptoms' ? results.symptoms : [],
      locations: key === 'locations' ? results.locations : [],
      faqs: key === 'faqs' ? results.faqs : [],
    };
  }, [results, typeParam]);

  const data = filtered || results;

  // Real count of everything we can render (incl. local/merged fallback), not just the
  // backend "total" — so the empty-state never shows while result cards are visible.
  const displayedTotal =
    (data?.doctors?.length || 0) +
    (data?.clinics?.length || 0) +
    (data?.services?.length || 0) +
    (data?.treatments?.length || 0) +
    (data?.conditions?.length || 0) +
    (data?.symptoms?.length || 0) +
    (data?.exercises?.length || 0) +
    (data?.articles?.length || 0) +
    (data?.packages?.length || 0) +
    (data?.faqs?.length || 0) +
    (data?.locations?.length || 0);

  const isFallback = Boolean(data?.is_fallback);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 sm:py-10 w-full">
        <div className="glass-card p-4 sm:p-6 mb-6 border border-white/80 shadow-sm">
          <form onSubmit={handleSubmit} className="relative flex gap-2" role="search">
            <div className="relative flex-1">
              <FaIcon icon="fa-magnifying-glass" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
              <input
                type="search"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setSugOpen(true);
                }}
                onKeyDown={onInputKeyDown}
                onFocus={() => suggestions.length > 0 && setSugOpen(true)}
                placeholder={searchPlaceholder}
                className="input-field w-full !pl-10 !py-3 !rounded-full"
                autoFocus
                aria-label="Search query"
                aria-autocomplete="list"
                aria-expanded={sugOpen && suggestions.length > 0}
                role="combobox"
                autoComplete="off"
              />
              {sugOpen && suggestions.length > 0 && input.length >= 2 && !loading && (
                <ul
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                  role="listbox"
                >
                  {suggestions.map((s, i) => (
                    <li key={s}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={sugIndex === i}
                        className={`w-full text-left px-4 py-2.5 text-sm text-slate-700 transition ${
                          sugIndex === i ? 'bg-orange-50' : 'hover:bg-orange-50'
                        }`}
                        onMouseEnter={() => setSugIndex(i)}
                        onClick={() => pickSuggestion(s)}
                      >
                        <FaIcon icon="fa-magnifying-glass" className="text-orange-400 mr-2 text-xs" />
                        <HighlightText text={s} query={input} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className="btn-primary shrink-0 !px-5 !rounded-full">
              Search
            </button>
          </form>

          <div
            className="mt-3 flex p-1 rounded-full bg-slate-100/90 border border-slate-200/80"
            role="group"
            aria-label="Browse directory"
          >
            <Link
              to="/doctors"
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition ${
                typeParam === 'doctors'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FaIcon icon="fa-user-doctor" />
              Physiotherapist
            </Link>
            <Link
              to="/clinics"
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition ${
                typeParam === 'clinics'
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FaIcon icon="fa-hospital" />
              Clinic
            </Link>
          </div>
        </div>

        {showLanding ? (
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Try asking</h2>
              <div className="flex flex-wrap gap-2">
                {SEARCH_SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className={chipClass} onClick={() => runSearch(s)}>
                    <FaIcon icon="fa-lightbulb" className="text-amber-500 text-xs" />
                    {s}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Trending</h2>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((s) => (
                  <button key={s} type="button" className={chipClass} onClick={() => runSearch(s)}>
                    <FaIcon icon="fa-fire" className="text-orange-500 text-xs" />
                    {s}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Popular</h2>
              <div className="flex flex-wrap gap-2">
                {QUICK_SEARCH_TAGS.map((s) => (
                  <button key={s} type="button" className={chipClass} onClick={() => runSearch(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </section>
            {recent.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Recent</h2>
                  <button type="button" onClick={() => { clearRecentSearches(); setRecent([]); }} className="text-xs text-slate-500 hover:text-red-600">
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((s) => (
                    <button key={s} type="button" className={chipClass} onClick={() => runSearch(s)}>
                      <FaIcon icon="fa-clock-rotate-left" className="text-slate-400 text-xs" />
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : loading ? (
          <div className="space-y-4" aria-live="polite">
            <div className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="h-10 rounded-full bg-slate-200 animate-pulse w-2/3" />
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {data?.did_you_mean && data.did_you_mean.toLowerCase() !== q.toLowerCase() && (
              <div className="mb-5 text-sm text-slate-700">
                Did you mean{' '}
                <button
                  type="button"
                  onClick={() => {
                    setInput(data.did_you_mean);
                    runSearch(data.did_you_mean);
                  }}
                  className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                >
                  {data.did_you_mean}
                </button>
                ?
              </div>
            )}

            {isFallback && displayedTotal > 0 && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <FaIcon icon="fa-wand-magic-sparkles" className="mr-2 text-amber-500" />
                No exact matches for &ldquo;{q}&rdquo; — showing the closest relevant physiotherapists, clinics and treatments.
              </div>
            )}

            <SearchAIOverview text={data?.ai_overview} parsed={data?.parsed} />

            <SearchFilterChips
              filters={results?.filters}
              activeType={typeParam ? (TYPE_MAP[typeParam] || typeParam) : ''}
              onSelect={setTypeFilter}
              query={q}
            />

            <EntityGrid title="Top Physiotherapists" icon="fa-user-doctor" items={data?.doctors} type="doctors">
              {(d) => <SearchDoctorCard key={d.id} doctor={d} onTrack={trackClick} />}
            </EntityGrid>

            <EntityGrid title="Top Clinics" icon="fa-hospital" items={data?.clinics} type="clinics">
              {(c) => <SearchClinicCard key={c.id} clinic={c} onTrack={trackClick} />}
            </EntityGrid>

            <EntityGrid title="Related Services" icon="fa-hand-holding-medical" items={data?.services} type="services">
              {(s, i) => (
                <Link key={`${s.id}-${i}`} to="/treatments" className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">
                    <HighlightText text={s.name || s.title} query={q} />
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{s.short_description}</p>
                  {s.price > 0 && <p className="text-sm font-bold text-orange-700 mt-2">₹{Number(s.price).toLocaleString('en-IN')}</p>}
                </Link>
              )}
            </EntityGrid>

            <EntityGrid title="Related Treatments" icon="fa-spa" items={data?.treatments} type="treatments">
              {(t, i) => (
                <Link key={`${t.id ?? t.slug}-${i}`} to={t.slug ? `/treatments/${t.slug}` : '/treatments'} className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">
                    <HighlightText text={t.title} query={q} />
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2">{t.short_description}</p>
                </Link>
              )}
            </EntityGrid>

            <EntityGrid title="Related Conditions" icon="fa-notes-medical" items={data?.conditions} type="conditions">
              {(c) => (
                <Link key={c.id} to={`/conditions/${c.slug}`} className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">
                    <HighlightText text={c.title} query={q} />
                  </p>
                  <p className="text-xs text-slate-500 capitalize mt-1">{c.category}</p>
                </Link>
              )}
            </EntityGrid>

            <EntityGrid title="Symptoms" icon="fa-heart-pulse" items={data?.symptoms} type="symptoms">
              {(s, i) => (
                <Link key={`${s.id}-${i}`} to={`/book?pain_type=${encodeURIComponent(s.title || '')}`} className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">
                    <HighlightText text={s.title || s.chip_label} query={q} />
                  </p>
                </Link>
              )}
            </EntityGrid>

            <EntityGrid title="Exercises" icon="fa-person-running" items={data?.exercises} type="exercises">
              {(e) => (
                <Link key={e.id} to={`/exercises/${e.slug}`} className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">
                    <HighlightText text={e.name} query={q} />
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{e.body_area}</p>
                </Link>
              )}
            </EntityGrid>

            <EduSection
              title="Blogs & articles"
              icon="fa-newspaper"
              items={data?.articles}
              render={(a) => (
                <Link key={a.id} to={`/physiofeed/${a.slug}`} className="glass-card p-4 hover:shadow-md block h-full">
                  <p className="font-semibold text-slate-900 line-clamp-2">
                    <HighlightText text={a.title} query={q} />
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{a.excerpt}</p>
                </Link>
              )}
            />

            <EduSection
              title="Treatment packages"
              icon="fa-box-open"
              items={data?.packages}
              render={(p) => (
                <Link key={p.id} to={`/packages/book/${p.slug}`} className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">
                    <HighlightText text={p.name} query={q} />
                  </p>
                  <p className="text-sm text-slate-600">{p.total_sessions} sessions · {p.duration_days} days</p>
                </Link>
              )}
            />

            <EduSection
              title="Helpful answers"
              icon="fa-circle-question"
              items={data?.faqs}
              render={(f) => (
                <Link key={f.id || f.slug} to={f.slug ? `/faq#${f.slug}` : '/faq'} className="glass-card p-4 hover:shadow-md block h-full">
                  <p className="font-semibold text-slate-900 line-clamp-2">
                    <HighlightText text={f.title} query={q} />
                  </p>
                  {f.category && <p className="text-xs text-slate-500 capitalize mt-1">{f.category}</p>}
                </Link>
              )}
            />

            {data?.locations?.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <FaIcon icon="fa-location-dot" className="text-violet-600" />
                  Locations
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.locations.map((loc) => (
                    <Link
                      key={loc.id}
                      to={`/doctors?city_id=${loc.id}`}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium hover:border-violet-300"
                    >
                      {loc.name}, {loc.state_name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {displayedTotal === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <FaIcon icon="fa-compass" className="text-3xl text-slate-300 mb-3" />
                <p className="font-semibold text-slate-800">No exact matches for &ldquo;{q}&rdquo;</p>
                <p className="text-sm text-slate-600 mt-2">We searched synonyms, related conditions, and nearby options.</p>
                {data?.recovery?.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {data.recovery.map((s) => (
                      <button key={s} type="button" className={chipClass} onClick={() => runSearch(s.replace('Try searching: ', ''))}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" className="btn-outline text-sm mt-6" onClick={() => navigate('/doctors')}>
                  Browse all doctors
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
