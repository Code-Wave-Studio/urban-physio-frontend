import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DoctorCard from '../components/DoctorCard';
import DirectoryListingHeader from '../components/listing/DirectoryListingHeader';
import FaIcon from '../components/FaIcon';
import { doctors } from '../services/api';
import { useLocation } from '../contexts/LocationContext';

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'rating', label: 'Highest rated' },
  { id: 'fee_low', label: 'Clinic fee: low to high' },
  { id: 'fee_high', label: 'Clinic fee: high to low' },
  { id: 'experience', label: 'Most experience' },
  { id: 'name', label: 'Name A–Z' },
];

function sortDoctors(items, sortId) {
  const copy = [...items];
  const fee = (d) => Number(d.consultation_fee) || 0;
  const rating = (d) => Number(d.rating_avg) || 0;
  const exp = (d) => Number(d.experience_years) || 0;
  const name = (d) => `${d.first_name || ''} ${d.last_name || ''}`.trim().toLowerCase();

  switch (sortId) {
    case 'rating':
      return copy.sort((a, b) => rating(b) - rating(a) || name(a).localeCompare(name(b)));
    case 'fee_low':
      return copy.sort((a, b) => fee(a) - fee(b) || rating(b) - rating(a));
    case 'fee_high':
      return copy.sort((a, b) => fee(b) - fee(a) || rating(b) - rating(a));
    case 'experience':
      return copy.sort((a, b) => exp(b) - exp(a) || rating(b) - rating(a));
    case 'name':
      return copy.sort((a, b) => name(a).localeCompare(name(b)));
    case 'recommended':
    default:
      return copy.sort((a, b) => {
        const da = a.distance_km != null ? Number(a.distance_km) : null;
        const db = b.distance_km != null ? Number(b.distance_km) : null;
        if (da != null && db != null && da !== db) return da - db;
        return rating(b) - rating(a) || name(a).localeCompare(name(b));
      });
  }
}

export default function Doctors() {
  const [searchParams] = useSearchParams();
  const [list, setList] = useState([]);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const [searchApi, setSearchApi] = useState(() => searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recommended');
  const { nearbyDoctors, city, setShowSelector, loading: locLoading } = useLocation();

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
      if (!hasSearch && nearbyDoctors.length && cacheCityMatches) {
        setList(nearbyDoctors);
        return;
      }
      const res = await doctors.list({
        city_id: effectiveCityId || undefined,
        search: hasSearch ? searchApi : undefined,
      });
      setList(res.data || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [searchApi, effectiveCityId, nearbyDoctors, city?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => sortDoctors(list, sortBy), [list, sortBy]);

  const stats = useMemo(() => {
    const n = sorted.length;
    if (!n) return { count: 0, avgRating: null, minFee: null };
    let sum = 0;
    let rated = 0;
    let minF = Infinity;
    for (const d of sorted) {
      const r = Number(d.rating_avg);
      if (r > 0) {
        sum += r;
        rated++;
      }
      const f = Number(d.consultation_fee);
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
        title="Find your physiotherapist"
        accent="primary"
        stats={stats}
        statsLoading={loading}
        searchPlaceholder="Search by name or specialization…"
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
            to="/book"
            className="btn-primary text-center w-full !py-2.5 text-sm inline-flex items-center justify-center gap-2"
          >
            <FaIcon icon="fa-calendar-plus" />
            Book without choosing
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
              {sorted.map((d) => (
                <DoctorCard key={d.id} doctor={d} variant="listing" />
              ))}
            </div>
            {!sorted.length && (
              <div className="card text-center py-12 md:py-16 max-w-lg mx-auto">
                <FaIcon icon="fa-user-doctor" className="text-5xl text-slate-200 mb-4" />
                <p className="font-semibold text-slate-800 text-lg">No doctors match</p>
                <p className="text-slate-500 text-sm mt-2 px-4">
                  Try another city, clear your search, or browse all of India from the city selector.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <button type="button" onClick={() => setShowSelector(true)} className="btn-primary text-sm">
                    Choose city
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-sm"
                    onClick={() => {
                      setSearchInput('');
                    }}
                  >
                    Clear search
                  </button>
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
