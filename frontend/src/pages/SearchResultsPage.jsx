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

function EntityGrid({ title, icon, items, children, treatmentIntent, type }) {
  if (!items?.length) return null;
  const eduTypes = ['articles', 'conditions', 'treatments', 'exercises', 'faqs'];
  if (treatmentIntent && eduTypes.includes(type)) return null;

  return (
    <section className="mb-10" aria-labelledby={`section-${type}`}>
      <h2 id={`section-${type}`} className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
        <FaIcon icon={icon} className="text-orange-600" />
        {title}
        <span className="text-sm font-normal text-slate-500">({items.length})</span>
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">{items.map(children)}</div>
    </section>
  );
}

function EduSection({ title, icon, items, render, treatmentIntent, type, forceShow }) {
  if (!items?.length) return null;
  if (treatmentIntent && !forceShow) return null;
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
    if (input.length >= 2) {
      const t = setTimeout(() => {
        search.suggest({ q: input, limit: 6 }).then((res) => {
          setSuggestions(res?.data?.suggestions || res?.suggestions || []);
        }).catch(() => setSuggestions([]));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(input);
  };

  const treatmentIntent = results?.parsed?.treatment_intent ?? true;
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
                onChange={(e) => setInput(e.target.value)}
                placeholder={searchPlaceholder}
                className="input-field w-full !pl-10 !py-3"
                autoFocus
                aria-label="Search query"
                autoComplete="off"
              />
              {suggestions.length > 0 && input.length >= 2 && !loading && (
                <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 text-slate-700"
                        onClick={() => {
                          setInput(s);
                          runSearch(s);
                        }}
                      >
                        <FaIcon icon="fa-magnifying-glass" className="text-orange-400 mr-2 text-xs" />
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className="btn-primary shrink-0 !px-5">
              Search
            </button>
          </form>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link
              to="/doctors"
              className="btn-outline w-full text-center !py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <FaIcon icon="fa-user-doctor" className="text-primary-600" />
              Find Physiotherapists
            </Link>
            <Link
              to="/clinics"
              className="btn-outline w-full text-center !py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <FaIcon icon="fa-hospital" className="text-emerald-600" />
              Find Clinic
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
            <SearchAIOverview text={data?.ai_overview} parsed={data?.parsed} />

            <SearchFilterChips
              filters={results?.filters}
              activeType={typeParam ? (TYPE_MAP[typeParam] || typeParam) : ''}
              onSelect={setTypeFilter}
              query={q}
            />

            <EntityGrid title="Top Physiotherapists" icon="fa-user-doctor" items={data?.doctors} type="doctors" treatmentIntent={false}>
              {(d) => <SearchDoctorCard key={d.id} doctor={d} onTrack={trackClick} />}
            </EntityGrid>

            <EntityGrid title="Top Clinics" icon="fa-hospital" items={data?.clinics} type="clinics" treatmentIntent={false}>
              {(c) => <SearchClinicCard key={c.id} clinic={c} onTrack={trackClick} />}
            </EntityGrid>

            <EntityGrid title="Related Services" icon="fa-hand-holding-medical" items={data?.services} type="services" treatmentIntent={treatmentIntent}>
              {(s, i) => (
                <Link key={`${s.id}-${i}`} to="/treatments" className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">{s.name || s.title}</p>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{s.short_description}</p>
                  {s.price > 0 && <p className="text-sm font-bold text-orange-700 mt-2">₹{Number(s.price).toLocaleString('en-IN')}</p>}
                </Link>
              )}
            </EntityGrid>

            <EntityGrid title="Related Treatments" icon="fa-spa" items={data?.treatments} type="treatments" treatmentIntent={treatmentIntent}>
              {(t, i) => (
                <Link key={`${t.id ?? t.slug}-${i}`} to={t.slug ? `/treatments/${t.slug}` : '/treatments'} className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">{t.title}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{t.short_description}</p>
                </Link>
              )}
            </EntityGrid>

            <EntityGrid title="Related Conditions" icon="fa-notes-medical" items={data?.conditions} type="conditions" treatmentIntent={treatmentIntent}>
              {(c) => (
                <Link key={c.id} to={`/conditions/${c.slug}`} className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500 capitalize mt-1">{c.category}</p>
                </Link>
              )}
            </EntityGrid>

            <EntityGrid title="Symptoms" icon="fa-heart-pulse" items={data?.symptoms} type="symptoms" treatmentIntent={treatmentIntent}>
              {(s, i) => (
                <Link key={`${s.id}-${i}`} to={`/book?pain_type=${encodeURIComponent(s.title || '')}`} className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">{s.title || s.chip_label}</p>
                </Link>
              )}
            </EntityGrid>

            <EntityGrid title="Exercises" icon="fa-person-running" items={data?.exercises} type="exercises" treatmentIntent={treatmentIntent}>
              {(e) => (
                <Link key={e.id} to={`/exercises/${e.slug}`} className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">{e.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{e.body_area}</p>
                </Link>
              )}
            </EntityGrid>

            <EduSection
              title="Blogs & articles"
              icon="fa-newspaper"
              items={data?.articles}
              type="articles"
              treatmentIntent={treatmentIntent}
              forceShow={!!typeParam}
              render={(a) => (
                <Link key={a.id} to={`/physiofeed/${a.slug}`} className="glass-card p-4 hover:shadow-md block h-full">
                  <p className="font-semibold text-slate-900 line-clamp-2">{a.title}</p>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{a.excerpt}</p>
                </Link>
              )}
            />

            <EduSection
              title="Treatment packages"
              icon="fa-box-open"
              items={data?.packages}
              type="packages"
              treatmentIntent={treatmentIntent}
              forceShow={!!typeParam}
              render={(p) => (
                <Link key={p.id} to={`/packages/book/${p.slug}`} className="glass-card p-4 hover:shadow-md block">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-sm text-slate-600">{p.total_sessions} sessions · {p.duration_days} days</p>
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

            {!data?.total && (
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
