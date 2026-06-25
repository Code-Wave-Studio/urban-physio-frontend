import FaIcon from '../FaIcon';

export default function LocationDoctorsBanner({ city, hasLocation, onSelectLocation, accent = 'primary', hideForOnline = false }) {
  if (hideForOnline) return null;
  const isOrange = accent === 'orange';

  if (hasLocation && city) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm border ${
          isOrange
            ? 'bg-orange-50/90 border-orange-200/70'
            : 'bg-primary-50/80 border-primary-200/50'
        }`}
      >
        <span className="text-slate-700 inline-flex items-center gap-1.5 min-w-0">
          <FaIcon icon="fa-location-dot" className={isOrange ? 'text-orange-600 shrink-0' : 'text-primary-600 shrink-0'} />
          <span>
            Showing doctors in <strong className="text-slate-800">{city.name}</strong>
          </span>
        </span>
        <button
          type="button"
          onClick={onSelectLocation}
          className={`font-semibold text-xs hover:underline shrink-0 ${isOrange ? 'text-orange-700' : 'text-primary-600'}`}
        >
          Change location
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200/70 px-4 py-3.5 text-sm text-amber-900">
      <p className="font-semibold flex items-center gap-2">
        <FaIcon icon="fa-location-dot" />
        Select your location first
      </p>
      <p className="text-xs mt-1 text-amber-800/90">
        We only show physiotherapists available in your city.
      </p>
      <button type="button" onClick={onSelectLocation} className="btn-primary text-xs mt-3 py-2 px-4">
        Choose city
      </button>
    </div>
  );
}
