import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import FaIcon from './FaIcon';
import SearchableLocationSelect from './SearchableLocationSelect';
import { location } from '../services/api';
import { useLocation } from '../contexts/LocationContext';

const AUTO_DELAY_MS = 5000;
const SWIPE_DISMISS_PX = 72;

/**
 * Soft location prompt — bottom drawer (mobile) / bottom-right card (desktop).
 * No dark overlay. Auto-prompt waits 5s and shows once per session.
 */
export default function LocationSelector() {
  const {
    showSelector,
    selectorIntent,
    selectCity,
    setShowSelector,
    dismissSelector,
    requestGeolocation,
    city,
    locationLabel,
    detectingGps,
  } = useLocation();

  const [panelVisible, setPanelVisible] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateId, setStateId] = useState('');
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const panelRef = useRef(null);
  const delayRef = useRef(null);
  const touchStartY = useRef(0);

  const closePanel = () => {
    setPanelVisible(false);
    setDragY(0);
    dismissSelector?.() ?? setShowSelector(false);
  };

  // Auto: 5s delay · Manual: immediate · Cancel pending timers when closed
  useEffect(() => {
    clearTimeout(delayRef.current);
    if (!showSelector) {
      setPanelVisible(false);
      setDragY(0);
      return undefined;
    }

    if (selectorIntent === 'auto') {
      delayRef.current = setTimeout(() => {
        setPanelVisible(true);
      }, AUTO_DELAY_MS);
      return () => clearTimeout(delayRef.current);
    }

    setPanelVisible(true);
    return undefined;
  }, [showSelector, selectorIntent]);

  useEffect(() => {
    if (!panelVisible) return;
    setLoadError('');
    setStatesLoading(true);
    location
      .servedStates()
      .then((res) => setStates(res.data || []))
      .catch(() => {
        setStates([]);
        setLoadError('Could not load service areas. Check your connection and try again.');
      })
      .finally(() => setStatesLoading(false));

    if (city?.state_id) setStateId(String(city.state_id));
  }, [panelVisible, city?.state_id]);

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

  // Click / tap outside closes (page stays usable — no dimmed overlay)
  useEffect(() => {
    if (!panelVisible) return undefined;
    const onPointer = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      // SearchableLocationSelect menu is portaled outside the panel
      if (e.target.closest?.('.location-select-menu')) return;
      closePanel();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [panelVisible]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    setDragging(true);
  };

  const onTouchMove = (e) => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    setDragY(Math.max(0, dy));
  };

  const onTouchEnd = () => {
    setDragging(false);
    if (dragY >= SWIPE_DISMISS_PX) {
      closePanel();
    } else {
      setDragY(0);
    }
  };

  if (!panelVisible) return null;

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="location-selector-title"
      className="location-soft-prompt fixed z-[10000] flex flex-col
        inset-x-0 bottom-0 max-h-[min(78dvh,560px)]
        sm:inset-auto sm:right-5 sm:bottom-5 sm:left-auto sm:w-[min(24rem,calc(100vw-2.5rem))] sm:max-h-[min(70dvh,520px)]
        rounded-t-3xl sm:rounded-2xl
        bg-white/95 backdrop-blur-xl border border-slate-200/90 border-b-0 sm:border-b
        shadow-[0_-8px_40px_-8px_rgba(15,23,42,0.18),0_20px_40px_-16px_rgba(15,23,42,0.2)]
        animate-location-prompt-in
        overflow-hidden"
      style={{
        transform: dragY ? `translateY(${dragY}px)` : undefined,
        transition: dragging ? 'none' : 'transform 0.2s ease-out',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Mobile drag handle */}
      <div
        className="sm:hidden flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none shrink-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        aria-hidden
      >
        <span className="w-10 h-1 rounded-full bg-slate-300" />
      </div>

      <header className="flex items-start gap-3 px-4 pt-2 sm:pt-4 pb-3 shrink-0 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
          <FaIcon icon="fa-location-dot" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="location-selector-title" className="font-bold text-slate-900 text-base leading-snug">
            Select your location
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Only states &amp; cities with verified care
          </p>
        </div>
        <button
          type="button"
          onClick={closePanel}
          className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 -mr-1"
          aria-label="Close"
        >
          <FaIcon icon="fa-xmark" />
        </button>
      </header>

      <div className="location-selector-body flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3.5">
        {city && (
          <div className="flex items-center gap-2.5 rounded-xl border border-primary-200/60 bg-primary-50/70 px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shrink-0 text-sm">
              <FaIcon icon="fa-location-dot" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-primary-700 font-medium uppercase tracking-wide">Current</p>
              <p className="text-sm font-semibold text-slate-900 truncate">
                {locationLabel || city.name}
                {!locationLabel && city.state_name ? `, ${city.state_name}` : ''}
              </p>
            </div>
            <button type="button" onClick={closePanel} className="btn-primary text-xs !py-1.5 !px-2.5 shrink-0">
              Done
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={requestGeolocation}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-primary-500/40 bg-gradient-to-r from-primary-50 to-white py-3 text-sm font-semibold text-primary-800 shadow-sm hover:border-primary-500 transition disabled:opacity-60"
          disabled={detectingGps}
        >
          <FaIcon
            icon={detectingGps ? 'fa-spinner' : 'fa-location-crosshairs'}
            className={detectingGps ? 'fa-spin text-primary-600' : 'text-primary-600'}
          />
          {detectingGps ? 'Detecting…' : 'Use my current location'}
        </button>
        <p className="text-[11px] text-slate-500 text-center -mt-1.5 leading-relaxed">
          Your browser will ask to allow location — choose <strong className="font-semibold text-slate-600">Allow</strong>.
        </p>

        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <section className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <FaIcon icon="fa-map" className="text-primary-600" />
              State
              {states.length > 0 && (
                <span className="text-[11px] font-normal text-slate-500">({states.length} with care)</span>
              )}
            </p>

            {statesLoading ? (
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            ) : loadError ? (
              <div className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 space-y-2">
                <p>{loadError}</p>
                <button
                  type="button"
                  className="btn-outline text-xs !py-1"
                  onClick={() => {
                    setLoadError('');
                    setStatesLoading(true);
                    location
                      .servedStates()
                      .then((res) => setStates(res.data || []))
                      .catch(() => setLoadError('Still unable to load areas. Try again later.'))
                      .finally(() => setStatesLoading(false));
                  }}
                >
                  Retry
                </button>
              </div>
            ) : states.length === 0 ? (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                No service areas loaded. Import clinic &amp; doctor seed data, then refresh.
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
              <p className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <FaIcon icon="fa-city" className="text-emerald-600" />
                City in {selectedState?.name}
                {!citiesLoading && cities.length > 0 && (
                  <span className="text-[11px] font-normal text-slate-500">({cities.length})</span>
                )}
              </p>

              {citiesLoading ? (
                <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
              ) : cities.length === 0 ? (
                <p className="text-xs text-slate-600 bg-white rounded-xl px-3 py-3 text-center border border-slate-100">
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
            <p className="text-[11px] text-slate-500 flex items-start gap-2 rounded-lg bg-white px-2.5 py-2 border border-slate-100">
              <FaIcon icon="fa-circle-info" className="text-primary-500 mt-0.5 shrink-0" />
              Pick a state first — only cities with care will appear.
            </p>
          )}
        </section>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
