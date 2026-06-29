import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ClinicCard from '../components/ClinicCard';
import DirectoryListingHeader from '../components/listing/DirectoryListingHeader';
import FaIcon from '../components/FaIcon';
import { clinics } from '../services/api';
import { useLocation } from '../contexts/LocationContext';

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'rating', label: 'Highest rated' },
  { id: 'doctors', label: 'Most doctors' },
  { id: 'name', label: 'Name A–Z' },
  { id: 'distance', label: 'Nearest first' },
];

function sortClinics(items, sortId) {
  const copy = [...items];
  const rating = (c) => Number(c.rating_avg) || 0;
  const doctors = (c) => Number(c.doctor_count) || 0;
  const name = (c) => (c.name || '').toLowerCase();
  const dist = (c) => (c.distance_km != null ? Number(c.distance_km) : null);

  switch (sortId) {
    case 'rating':
      return copy.sort((a, b) => rating(b) - rating(a) || name(a).localeCompare(name(b)));
    case 'doctors':
      return copy.sort((a, b) => doctors(b) - doctors(a) || rating(b) - rating(a));
    case 'name':
      return copy.sort((a, b) => name(a).localeCompare(name(b)));
    case 'distance':
      return copy.sort((a, b) => {
        const da = dist(a);
        const db = dist(b);
        if (da != null && db != null) return da - db;
        if (da != null) return -1;
        if (db != null) return 1;
        return rating(b) - rating(a);
      });
    case 'recommended':
    default:
      return copy.sort((a, b) => {
        const featA = Number(a.is_featured) || 0;
        const featB = Number(b.is_featured) || 0;
        if (featB !== featA) return featB - featA;
        const da = dist(a);
        const db = dist(b);
        if (da != null && db != null && da !== db) return da - db;
        return rating(b) - rating(a) || name(a).localeCompare(name(b));
      });
  }
}

export default function Clinics() {
  const [searchParams] = useSearchParams();
  const [list, setList] = useState([]);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const [searchApi, setSearchApi] = useState(() => searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recommended');
  const { nearbyClinics, city, setShowSelector, loading: locLoading } = useLocation();

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchInput(q);
    setSearchApi(q);
  }, [searchParams]);

  const urlCityId = searchParams.get('city_id');
  const effectiveCityId = urlCityId ? Number(urlCityId) : city?.id;

  useEffect(() => {
    const t = setTimeout(() => setSearchApi(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const hasSearch = Boolean(searchApi.trim());
      const cacheCityMatches = !effectiveCityId || effectiveCityId === city?.id;
      if (!hasSearch && nearbyClinics.length && cacheCityMatches) {
        setList(nearbyClinics);
        return;
      }
      const res = await clinics.list({
        city_id: effectiveCityId || undefined,
        search: hasSearch ? searchApi : undefined,
      });
      setList(res.data || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [searchApi, effectiveCityId, nearbyClinics, city?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => sortClinics(list, sortBy), [list, sortBy]);

  const stats = useMemo(() => {
    const n = sorted.length;
    if (!n) return { count: 0, avgRating: null, minFee: null };
    let sum = 0;
    let rated = 0;
    let minF = Infinity;
    for (const c of sorted) {
      const r = Number(c.rating_avg);
      if (r > 0) {
        sum += r;
        rated++;
      }
      const f = Number(c.min_consultation_fee);
      if (f > 0 && f < minF) minF = f;
    }
    return {
      count: n,
      avgRating: rated ? (sum / rated).toFixed(1) : null,
      minFee: minF !== Infinity ? minF : null,
    };
  }, [sorted]);

  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar />

      <DirectoryListingHeader
        title="Find your clinic"
        accent="emerald"
        stats={stats}
        statsLoading={loading}
        searchPlaceholder="Search by clinic name, area or city…"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        sortBy={sortBy}
        sortOptions={SORT_OPTIONS}
        onSortChange={setSortBy}
        city={city}
        onLocationClick={() => setShowSelector(true)}
        locLoading={locLoading}
        extraActions={
          <Link
            to="/book?type=clinic"
            className="btn-primary text-center w-full !py-2.5 text-sm inline-flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-700"
          >
            <FaIcon icon="fa-calendar-plus" />
            Book clinic visit
          </Link>
        }
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 relative">
        {loading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-slate-50 h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
              {sorted.map((c) => (
                <ClinicCard key={c.id} clinic={c} variant="listing" />
              ))}
            </div>
            {!sorted.length && (
              <div className="card text-center py-12 md:py-16 max-w-lg mx-auto">
                <FaIcon icon="fa-hospital" className="text-5xl text-slate-200 mb-4" />
                <p className="font-semibold text-slate-800 text-lg">No clinics match</p>
                <p className="text-slate-500 text-sm mt-2 px-4">
                  Try another city, clear your search, or book an online consultation instead.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <button type="button" onClick={() => setShowSelector(true)} className="btn-primary text-sm">
                    Choose city
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-sm"
                    onClick={() => setSearchInput('')}
                  >
                    Clear search
                  </button>
                  <Link to="/doctors" className="btn-outline text-sm">
                    Find physiotherapists
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
