import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from './FaIcon';
import GlassModal, { GlassModalHeader } from './GlassModal';
import {
  fetchDevicePosition,
  geolocationErrorMessage,
  resolveMapPosition,
} from '../utils/locationHelpers';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };

function loadCss(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function loadLeaflet() {
  loadCss(LEAFLET_CSS);
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      const waitForL = () => {
        if (window.L) {
          resolve(window.L);
          return true;
        }
        return false;
      };
      if (waitForL()) return;
      existing.addEventListener('load', () => resolve(window.L));
      const poll = setInterval(() => {
        if (waitForL()) clearInterval(poll);
      }, 40);
      setTimeout(() => {
        clearInterval(poll);
        if (!window.L) reject(new Error('Leaflet failed to load'));
      }, 12000);
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Leaflet script failed'));
    document.body.appendChild(script);
  });
}

function osmLink(lat, lng) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

export default function LocationMapModal({
  open,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  fallbackCoords = null,
  autoLocate = true,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [locating, setLocating] = useState(false);
  const [position, setPosition] = useState(DEFAULT_CENTER);
  const [retryKey, setRetryKey] = useState(0);

  const fallbackLat = fallbackCoords?.lat ?? null;
  const fallbackLng = fallbackCoords?.lng ?? null;

  const destroyMap = useCallback(() => {
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
      markerRef.current = null;
    }
    setReady(false);
  }, []);

  const applyMarkerPosition = useCallback((lat, lng, { panMap = true } = {}) => {
    setPosition({ lat, lng });
    if (!markerRef.current || !mapInstance.current) return;
    markerRef.current.setLatLng([lat, lng]);
    if (panMap) {
      mapInstance.current.setView([lat, lng], Math.max(mapInstance.current.getZoom(), 16), { animate: true });
    }
  }, []);

  const locateCurrentPosition = useCallback(
    async (silent = false) => {
      setLocating(true);
      try {
        const pos = await fetchDevicePosition();
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        applyMarkerPosition(lat, lng);
        if (!silent) toast.success('Current location detected');
        return { lat, lng };
      } catch (err) {
        if (!silent) toast.error(geolocationErrorMessage(err));
        return null;
      } finally {
        setLocating(false);
      }
    },
    [applyMarkerPosition]
  );

  useEffect(() => {
    if (!open) {
      destroyMap();
      setMapError('');
      setLocating(false);
      return undefined;
    }

    const start = resolveMapPosition(initialLat, initialLng, { lat: fallbackLat, lng: fallbackLng }) || DEFAULT_CENTER;
    setPosition(start);
    setMapError('');
    let cancelled = false;

    const initMap = async () => {
      try {
        const L = await loadLeaflet();
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (cancelled || !mapRef.current) return;

        destroyMap();

        const map = L.map(mapRef.current, { scrollWheelZoom: true }).setView([start.lat, start.lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([start.lat, start.lng], { draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const { lat, lng } = marker.getLatLng();
          setPosition({ lat, lng });
        });
        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        });

        mapInstance.current = map;
        markerRef.current = marker;
        setReady(true);

        const fixSize = () => {
          if (mapInstance.current) mapInstance.current.invalidateSize();
        };
        setTimeout(fixSize, 100);
        setTimeout(fixSize, 350);

        const hasSavedPin = initialLat != null && initialLng != null;
        if (autoLocate && !hasSavedPin) {
          await locateCurrentPosition(true);
        }
      } catch {
        if (!cancelled) {
          setMapError('Could not load the map. Check your internet connection and try again.');
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      destroyMap();
    };
  }, [open, initialLat, initialLng, fallbackLat, fallbackLng, autoLocate, retryKey, destroyMap, locateCurrentPosition]);

  const handleConfirm = () => {
    onConfirm(position);
    onClose();
  };

  const externalMap = osmLink(position.lat, position.lng);

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      size="md"
      titleId="location-map-modal-title"
      panelClassName="flex flex-col"
      zIndex={10000}
    >
      <GlassModalHeader
        titleId="location-map-modal-title"
        title="Pin your home location"
        subtitle="Drag the pin or tap the map — we use this for home visits"
        icon="fa-house-medical"
        accent="primary"
        onClose={onClose}
      />

      {mapError ? (
        <div className="p-6 text-center text-sm text-slate-600 space-y-3">
          <FaIcon icon="fa-triangle-exclamation" className="text-amber-500 text-2xl" />
          <p>{mapError}</p>
          <button type="button" className="btn-outline text-sm" onClick={() => { setMapError(''); setRetryKey((k) => k + 1); }}>
            Try again
          </button>
        </div>
      ) : (
        <div
          ref={mapRef}
          className="h-80 w-full bg-slate-100/80 border-y border-white/60 z-0"
          style={{ minHeight: 320 }}
        />
      )}

      <div className="p-4 md:p-5 space-y-3 bg-white/40">
        {!ready && !mapError && (
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <FaIcon icon="fa-spinner" className="fa-spin text-primary-600" />
            Loading map…
          </p>
        )}
        <p className="text-xs text-slate-600 rounded-lg bg-white/70 border border-white/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <span>
            <FaIcon icon="fa-location-dot" className="text-primary-600 mr-1" />
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </span>
          <a
            href={externalMap}
            target="_blank"
            rel="noreferrer"
            className="text-primary-600 font-semibold hover:underline inline-flex items-center gap-1"
          >
            <FaIcon icon="fa-arrow-up-right-from-square" className="text-[10px]" />
            Preview
          </a>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => locateCurrentPosition(false)}
            disabled={locating || !!mapError || !ready}
            className="btn-outline flex-1 text-sm py-2"
          >
            <FaIcon icon={locating ? 'fa-spinner' : 'fa-crosshairs'} className={`mr-1 ${locating ? 'fa-spin' : ''}`} />
            {locating ? 'Detecting…' : 'Use current location'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!!mapError || !ready}
            className="btn-primary flex-1 text-sm py-2"
          >
            Confirm pin
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
