import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

import { location, doctors, clinics } from '../services/api';

import { hasFunctionalConsent } from '../constants/cookieConsent';

import toast from 'react-hot-toast';

import {
  fetchDevicePosition,
  geolocationErrorMessage,
  canAutoRequestGeolocation,
  queryGeolocationPermission,
} from '../utils/locationHelpers';

const LocationContext = createContext(null);
const STORAGE_KEY = 'selectedCity';

function unwrapList(res) {
  return res?.data ?? res ?? [];
}

function readSavedCity() {
  if (!hasFunctionalConsent()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

function formatLocationLabel(city, detectedLabel) {
  if (detectedLabel) return detectedLabel;
  if (!city?.name) return null;
  return city.state_name ? `${city.name}, ${city.state_name}` : city.name;
}

function resolveCityFromPayload(data, cityOverride = null) {
  return data?.city || data?.service_city || cityOverride || null;
}

async function fetchProvidersForCity(cityId, coords = null) {
  try {
    const params = { city_id: cityId };
    if (coords?.lat != null && coords?.lng != null) {
      params.lat = coords.lat;
      params.lng = coords.lng;
    }
    const res = await location.cityProviders(cityId, params.lat, params.lng);
    return res?.data ?? res;
  } catch {
    const [docRes, clinicRes] = await Promise.all([
      doctors.list({ city_id: cityId }),
      clinics.list({ city_id: cityId }),
    ]);
    const docList = unwrapList(docRes);
    const clinicList = unwrapList(clinicRes);
    return {
      doctors: docList,
      clinics: clinicList,
      has_nearby_providers: docList.length > 0 || clinicList.length > 0,
    };
  }
}

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null);
  const [city, setCity] = useState(null);
  const [locationLabel, setLocationLabel] = useState(null);
  /** 'gps' = device location, 'city' = manually selected city */
  const [locationSource, setLocationSource] = useState(null);
  const [nearbyDoctors, setNearbyDoctors] = useState([]);
  const [nearbyClinics, setNearbyClinics] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detectingGps, setDetectingGps] = useState(false);
  const [locationResolved, setLocationResolved] = useState(false);

  const initDone = useRef(false);
  /** Bumps when user manually picks a city — stale GPS callbacks are ignored */
  const locationEpoch = useRef(0);

  const hasNearbyProviders = nearbyDoctors.length > 0 || nearbyClinics.length > 0;

  const persistCity = useCallback((resolvedCity, source = 'gps') => {
    if (resolvedCity && hasFunctionalConsent()) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...resolvedCity,
          source,
          saved_at: Date.now(),
        })
      );
    }
  }, []);

  const applyProviderPayload = useCallback(
    (data, cityOverride = null, { userInitiated = false, fromGps = false } = {}) => {
      const resolvedCity = resolveCityFromPayload(data, cityOverride);
      const detectedLabel = data?.detected_label || resolvedCity?.detected_label || null;
      const docList = data?.doctors || [];
      const clinicList = data?.clinics || [];
      const has =
        data?.has_nearby_providers ??
        (docList.length > 0 || clinicList.length > 0);

      if (resolvedCity) {
        setCity(resolvedCity);
        setLocationLabel(formatLocationLabel(resolvedCity, detectedLabel));
      } else if (detectedLabel) {
        setLocationLabel(detectedLabel);
      }

      setNearbyDoctors(docList);
      setNearbyClinics(clinicList);

      if (userInitiated) {
        setCoords(data?.coords ?? null);
        setShowSelector(false);
        if (resolvedCity) persistCity(resolvedCity, fromGps ? 'gps' : 'manual');
        return has;
      }

      if (fromGps) {
        setCoords(data?.coords ?? null);
        setLocationSource('gps');
        if (!has) {
          setShowSelector(true);
          return false;
        }
        setShowSelector(false);
        if (resolvedCity) persistCity(resolvedCity, 'gps');
        return true;
      }

      setShowSelector(!has);
      if (has && resolvedCity) persistCity(resolvedCity, 'gps');
      return has;
    },
    [persistCity]
  );

  const loadCityProviders = useCallback(
    async (cityId, cityData = null, options = {}) => {
      if (!cityId) {
        toast.error('Please choose a valid city');
        return false;
      }

      setLoading(true);
      try {
        const payload = await fetchProvidersForCity(cityId, options.coords ?? coords);
        const merged = {
          ...payload,
          city: payload.city || cityData,
        };
        const has = applyProviderPayload(merged, cityData, options);

        if (options.userInitiated && cityData?.name) {
          const label = formatLocationLabel(cityData, merged.detected_label);
          if (has) {
            toast.success(`Showing care in ${label || cityData.name}`);
          } else {
            toast(`No doctors or clinics in ${cityData.name} yet. Try another nearby city.`, { icon: '📍' });
          }
        }
        return has;
      } catch {
        if (options.userInitiated && cityData) {
          setCity(cityData);
          setLocationLabel(formatLocationLabel(cityData));
          setCoords(options.coords ?? null);
          setLocationSource(options.fromGps ? 'gps' : 'city');
          setShowSelector(false);
          persistCity(cityData, options.fromGps ? 'gps' : 'manual');
          toast.success(`Location set to ${cityData.name}`);
          return false;
        }
        if (!options.userInitiated) setShowSelector(true);
        toast.error('Could not load providers for this city.');
        return false;
      } finally {
        setLoading(false);
        setLocationResolved(true);
      }
    },
    [applyProviderPayload, persistCity, coords]
  );

  const detectLocation = useCallback(
    async (lat, lng, epoch, { userInitiated = false } = {}) => {
      if (epoch !== locationEpoch.current) return;

      setLoading(true);
      try {
        const res = await location.detect(lat, lng);
        if (epoch !== locationEpoch.current) return;

        const data = res?.data ?? res;
        const displayCity = resolveCityFromPayload(data);
        const merged = {
          ...data,
          city: displayCity,
          coords: data?.coords ?? { lat, lng },
        };

        setCoords({ lat, lng });
        setLocationSource('gps');

        const hasProviders = applyProviderPayload(merged, null, {
          fromGps: true,
          userInitiated,
        });

        if (epoch !== locationEpoch.current) return;

        const label =
          data?.detected_label ||
          formatLocationLabel(displayCity) ||
          displayCity?.name;

        if (hasProviders && label) {
          const serviceName = data?.service_city?.name;
          const displayName = displayCity?.name;
          if (serviceName && displayName && serviceName !== displayName) {
            toast.success(`Showing care near ${displayName} · Providers in ${serviceName} area`);
          } else {
            toast.success(`Showing care near ${label}`);
          }
        } else if (label) {
          setShowSelector(true);
          toast(`We detected ${label}, but no doctors/clinics nearby yet. Please confirm your city.`, {
            icon: '📍',
            duration: 5000,
          });
        } else {
          setShowSelector(true);
          toast('No doctors or clinics near your current location. Please select your city manually.', {
            icon: '📍',
            duration: 5000,
          });
        }
      } catch (err) {
        if (epoch !== locationEpoch.current) return;
        setShowSelector(true);
        toast.error(err?.message || 'Could not detect location. Please select your city manually.');
      } finally {
        setLoading(false);
        setDetectingGps(false);
        if (epoch === locationEpoch.current) {
          setLocationResolved(true);
        }
      }
    },
    [applyProviderPayload]
  );

  const requestGeolocation = useCallback(
    async ({ userInitiated = false, skipSavedFallback = false } = {}) => {
      const epoch = ++locationEpoch.current;
      setLocationSource('gps');
      setDetectingGps(true);
      setLoading(true);

      if (userInitiated) {
        localStorage.removeItem(STORAGE_KEY);
      }

      if (!navigator.geolocation) {
        setDetectingGps(false);
        setLoading(false);
        setShowSelector(true);
        setLocationResolved(true);
        toast.error('Geolocation not supported. Please select your city manually.');
        return;
      }

      try {
        const pos = await fetchDevicePosition();
        if (epoch !== locationEpoch.current) return;
        await detectLocation(pos.coords.latitude, pos.coords.longitude, epoch, { userInitiated });
      } catch (err) {
        if (epoch !== locationEpoch.current) return;

        if (!skipSavedFallback && !userInitiated) {
          const saved = readSavedCity();
          if (saved?.id) {
            locationEpoch.current += 1;
            setLocationSource(saved.source === 'manual' ? 'city' : 'gps');
            setCoords(null);
            setDetectingGps(false);
            await loadCityProviders(saved.id, saved, {
              userInitiated: false,
              fromGps: saved.source !== 'manual',
            });
            return;
          }
        }

        setShowSelector(true);
        if (userInitiated) {
          const permission = await queryGeolocationPermission();
          if (err?.code === 1) {
            if (permission === 'denied') {
              toast.error(
                'Location is blocked in your browser. Open site settings, allow Location, then tap "Use my current location" again.'
              );
            } else {
              toast('Tap "Use my current location" again and choose Allow when your browser asks.', {
                icon: '📍',
              });
            }
          } else {
            toast.error(geolocationErrorMessage(err));
          }
        } else if (err?.code !== 1) {
          toast.error(geolocationErrorMessage(err));
        }
      } finally {
        setDetectingGps(false);
        setLoading(false);
        if (epoch === locationEpoch.current) {
          setLocationResolved(true);
        }
      }
    },
    [detectLocation, loadCityProviders]
  );

  const promptForLocationAccess = useCallback(
    async ({ saved = null } = {}) => {
      if (saved?.id) {
        locationEpoch.current += 1;
        setLocationSource(saved.source === 'manual' ? 'city' : 'gps');
        setCoords(null);
        await loadCityProviders(saved.id, saved, {
          userInitiated: false,
          fromGps: saved.source !== 'manual',
        });
        return;
      }

      setShowSelector(true);
      setLoading(false);
      setDetectingGps(false);
      setLocationResolved(false);
    },
    [loadCityProviders]
  );

  const refreshLocation = useCallback(() => {
    if (locationSource === 'city' && city?.id) {
      return loadCityProviders(city.id, city, { userInitiated: true, coords });
    }
    return requestGeolocation({ userInitiated: true, skipSavedFallback: true });
  }, [locationSource, city, coords, loadCityProviders, requestGeolocation]);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const bootstrap = async () => {
      const saved = readSavedCity();

      if (saved?.source === 'manual' && saved?.id) {
        locationEpoch.current += 1;
        setLocationSource('city');
        setCoords(null);
        await loadCityProviders(saved.id, saved, { userInitiated: false });
        return;
      }

      const autoOk = await canAutoRequestGeolocation();
      if (!autoOk) {
        await promptForLocationAccess({ saved });
        return;
      }

      await requestGeolocation({ userInitiated: false, skipSavedFallback: false });
    };

    bootstrap();
  }, [loadCityProviders, promptForLocationAccess, requestGeolocation]);

  useEffect(() => {
    const onConsent = () => {
      if (!hasFunctionalConsent()) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const saved = readSavedCity();
        if (saved?.id && !city) {
          if (saved.source === 'manual') {
            loadCityProviders(saved.id, saved, { userInitiated: false });
          } else {
            canAutoRequestGeolocation().then((autoOk) => {
              if (autoOk) {
                requestGeolocation({ userInitiated: false, skipSavedFallback: false });
              } else {
                promptForLocationAccess({ saved });
              }
            });
          }
        }
      }
    };

    window.addEventListener('tup-cookie-consent-updated', onConsent);
    return () => window.removeEventListener('tup-cookie-consent-updated', onConsent);
  }, [city, loadCityProviders, promptForLocationAccess, requestGeolocation]);

  const selectCity = async (cityData) => {
    if (!cityData?.id) return;
    locationEpoch.current += 1;
    setShowSelector(false);
    setCoords(null);
    setLocationSource('city');
    await loadCityProviders(cityData.id, cityData, { userInitiated: true });
  };

  const useCurrentLocation = useCallback(() => {
    requestGeolocation({ userInitiated: true, skipSavedFallback: true });
  }, [requestGeolocation]);

  return (
    <LocationContext.Provider
      value={{
        coords,
        city,
        locationLabel,
        locationSource,
        nearbyDoctors,
        nearbyClinics,
        hasNearbyProviders,
        locationResolved,
        showSelector,
        loading,
        detectingGps,
        requestGeolocation: useCurrentLocation,
        refreshLocation,
        selectCity,
        detectLocation,
        loadCityProviders,
        setShowSelector,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
