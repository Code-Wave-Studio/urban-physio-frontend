import { useEffect, useMemo, useState } from 'react';
import FaIcon from './FaIcon';
import SearchableLocationSelect from './SearchableLocationSelect';
import { location } from '../services/api';
import { useLocation } from '../contexts/LocationContext';
import GlassModal, { GlassModalHeader } from './GlassModal';

export default function LocationSelector() {
  const {
    showSelector,
    selectCity,
    setShowSelector,
    requestGeolocation,
    hasNearbyProviders,
    city,
    loading,
  } = useLocation();

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateId, setStateId] = useState('');
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    if (!showSelector) return;
    setLoadError('');
    setStatesLoading(true);
    location
      .servedStates()
      .then((res) => setStates(res.data || []))
      .catch((err) => {
        setStates([]);
        setLoadError(err?.message || 'Could not reach the server. Check backend URL and CORS.');
      })
      .finally(() => setStatesLoading(false));

    if (city?.state_id) {
      setStateId(String(city.state_id));
    }
  }, [showSelector, city?.state_id]);

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    location
      .cities(stateId, true)
      .then((res) => setCities(res.data || []))
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, [stateId]);

  const canDismiss = Boolean(city) || hasNearbyProviders;

  const handleClose = () => {
    if (canDismiss) setShowSelector(false);
  };

  const selectedState = states.find((s) => String(s.id) === String(stateId));

  const stateOptions = useMemo(
    () =>
      states.map((s) => ({
        ...s,
        name: `${s.name}${s.city_count != null ? ` · ${s.city_count} cities` : ''}`,
      })),
    [states]
  );

  const cityOptions = useMemo(
    () =>
      cities.map((c) => {
        const dc = Number(c.doctor_count) || 0;
        const cc = Number(c.clinic_count) || 0;
        const extras = [];
        if (dc > 0) extras.push(`${dc} doctor${dc !== 1 ? 's' : ''}`);
        if (cc > 0) extras.push(`${cc} clinic${cc !== 1 ? 's' : ''}`);
        return {
          ...c,
          name: extras.length ? `${c.name} · ${extras.join(' · ')}` : c.name,
        };
      }),
    [cities]
  );

  const pickCity = (c) => {
    if (!c?.id) return;
    selectCity(c);
  };

  return (
    <GlassModal
      open={showSelector}
      onClose={handleClose}
      size="md"
      titleId="location-selector-title"
      zIndex={10000}
      closeOnBackdrop={canDismiss}
      preventClose={!canDismiss}
      panelClassName="overflow-visible-panel location-selector-modal"
      className="items-end sm:items-center p-0 sm:p-4"
    >
      <GlassModalHeader
        titleId="location-selector-title"
        title="Select your location"
        subtitle="We only list states and cities where a verified doctor or partner clinic is available"
        icon="fa-location-dot"
        accent="primary"
        onClose={canDismiss ? handleClose : undefined}
      />

      <div className="location-selector-body p-5 md:p-6 space-y-5 max-h-[min(78vh,640px)] overflow-y-auto overflow-x-hidden">
        {city && (
          <div className="location-selector-current flex items-center gap-3 rounded-2xl border border-primary-200/60 bg-primary-50/70 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
              <FaIcon icon="fa-location-dot" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-primary-700 font-medium uppercase tracking-wide">Current</p>
              <p className="font-semibold text-slate-900 truncate">
                {city.name}
                {city.state_name ? `, ${city.state_name}` : ''}
              </p>
            </div>
            {canDismiss && (
              <button type="button" onClick={handleClose} className="btn-primary text-xs !py-2 !px-3 shrink-0">
                Continue
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setShowSelector(false);
            requestGeolocation();
          }}
          disabled={loading}
          className="location-gps-btn w-full flex items-center justify-center gap-2.5 rounded-2xl border-2 border-primary-500/40 bg-gradient-to-r from-primary-50 to-white py-3.5 text-sm font-semibold text-primary-800 shadow-sm hover:border-primary-500 hover:shadow-md transition disabled:opacity-60"
        >
          <span className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center">
            <FaIcon icon={loading ? 'fa-spinner' : 'fa-location-crosshairs'} className={loading ? 'fa-spin' : ''} />
          </span>
          {loading ? 'Detecting your location…' : 'Use my current location'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Manual</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <section className="location-manual-panel rounded-2xl border border-slate-200/80 bg-white/80 p-4 space-y-4 shadow-inner shadow-slate-900/5">
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <FaIcon icon="fa-map" className="text-primary-600" />
              State
              {states.length > 0 && (
                <span className="text-xs font-normal text-slate-500">({states.length} with care)</span>
              )}
            </p>

            {statesLoading ? (
              <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
            ) : loadError ? (
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                API error: {loadError}. Confirm{' '}
                <code className="text-xs">https://urban.codewavestudio.space/backend/api/health</code> works and
                database seed is imported.
              </p>
            ) : states.length === 0 ? (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                No service areas loaded. Import clinic & doctor seed data, then refresh.
              </p>
            ) : (
              <SearchableLocationSelect
                id="location-state"
                placeholder="Choose state"
                searchPlaceholder="Search states…"
                options={stateOptions}
                value={stateId}
                onChange={setStateId}
                emptyMessage="No states with doctors or clinics"
              />
            )}
          </div>

          {stateId && (
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <FaIcon icon="fa-city" className="text-emerald-600" />
                City in {selectedState?.name}
                {!citiesLoading && cities.length > 0 && (
                  <span className="text-xs font-normal text-slate-500">({cities.length} available)</span>
                )}
              </p>

              {citiesLoading ? (
                <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
              ) : cities.length === 0 ? (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-4 text-center border border-slate-100">
                  No doctors or clinics in this state yet.
                </p>
              ) : (
                <SearchableLocationSelect
                  id="location-city"
                  placeholder="Choose city"
                  searchPlaceholder="Search cities…"
                  options={cityOptions}
                  value={city && cities.some((c) => String(c.id) === String(city.id)) ? String(city.id) : ''}
                  onChange={(id) => {
                    const c = cities.find((x) => String(x.id) === String(id));
                    if (c) pickCity(c);
                  }}
                  emptyMessage="No cities with doctors or clinics"
                />
              )}
            </div>
          )}

          {!stateId && !statesLoading && states.length > 0 && (
            <p className="text-xs text-slate-500 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100">
              <FaIcon icon="fa-circle-info" className="text-primary-500 mt-0.5 shrink-0" />
              Pick a state first — only cities with at least one doctor or clinic will appear.
            </p>
          )}
        </section>

        {canDismiss && !city && (
          <button type="button" onClick={handleClose} className="w-full btn-outline text-sm py-2.5">
            Skip for now
          </button>
        )}
      </div>
    </GlassModal>
  );
}
