import { useCallback, useEffect, useRef, useState } from 'react';
import FaIcon from '../FaIcon';
import PatientAvatar from '../PatientAvatar';
import { patientSearch } from '../../services/api';

function getInitials(name) {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export default function SearchablePatientSelect({
  value,
  onChange,
  label = 'Patient (optional)',
  placeholder = 'Search patient by name, ID, or mobile…',
  disabled = false,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const containerRef = useRef(null);

  // Search logic
  const searchPatients = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await patientSearch.run({ q: q || '', limit: 15 });
      const items = res.data?.items || res.items || [];
      const walkins = res.data?.walkins || res.walkins || [];
      const combined = [...items, ...walkins];
      setResults(combined);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial or selected patient info when value changes
  useEffect(() => {
    if (!value) {
      setSelectedPatient(null);
      return;
    }
    // If we already have selectedPatient matching this ID, keep it
    if (selectedPatient && (selectedPatient.patient_id === Number(value) || selectedPatient.id === Number(value))) {
      return;
    }
    // Fetch details
    patientSearch
      .run({ q: String(value), limit: 5 })
      .then((res) => {
        const items = [...(res.data?.items || []), ...(res.data?.walkins || [])];
        const match = items.find(
          (p) => String(p.patient_id || p.id) === String(value) || String(p.user_id) === String(value)
        );
        if (match) {
          setSelectedPatient(match);
        } else {
          setSelectedPatient({
            patient_id: Number(value),
            name: `Patient #${value}`,
            phone: '',
          });
        }
      })
      .catch(() => {
        setSelectedPatient({
          patient_id: Number(value),
          name: `Patient #${value}`,
          phone: '',
        });
      });
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    searchPatients(query);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    searchPatients(val);
  };

  const handleSelect = (patient) => {
    const pid = patient.patient_id || patient.id;
    setSelectedPatient(patient);
    onChange?.(pid, patient);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setSelectedPatient(null);
    onChange?.('', null);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && <label className="doc-label">{label}</label>}

      {selectedPatient ? (
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-teal-200 bg-teal-50/60 shadow-sm transition">
          <div className="flex items-center gap-2.5 min-w-0">
            <PatientAvatar patient={selectedPatient} size="xs" className="w-9 h-9 rounded-full" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-800 truncate">
                  {selectedPatient.name || selectedPatient.patient_name || `Patient #${selectedPatient.patient_id}`}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 tracking-wider">
                  PAT-{selectedPatient.patient_id || selectedPatient.id}
                </span>
              </div>
              {selectedPatient.phone && (
                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <FaIcon icon="fa-phone" className="text-[10px] text-teal-600" />
                  {selectedPatient.phone}
                </p>
              )}
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Remove patient link"
            >
              <FaIcon icon="fa-xmark" className="text-sm" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            className="doc-input !pr-8"
            value={query}
            onFocus={handleFocus}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
          />
          <FaIcon
            icon={loading ? 'fa-spinner' : 'fa-magnifying-glass'}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs ${
              loading ? 'fa-spin' : ''
            }`}
          />
        </div>
      )}

      {/* Dropdown list */}
      {open && !selectedPatient && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          {results.length > 0 ? (
            results.map((patient) => {
              const pid = patient.patient_id || patient.id;
              const pName = patient.name || patient.patient_name || `Patient #${pid}`;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => handleSelect(patient)}
                  className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-teal-50/70 transition group"
                >
                  <PatientAvatar patient={patient} size="xs" className="w-9 h-9 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-900 truncate">
                        {pName}
                      </p>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 group-hover:bg-teal-100 px-1.5 py-0.5 rounded shrink-0">
                        PAT-{pid}
                      </span>
                    </div>
                    {patient.phone ? (
                      <p className="text-xs text-slate-400 group-hover:text-slate-600 truncate mt-0.5">
                        {patient.phone}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-300 italic mt-0.5">No mobile listed</p>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-center text-xs text-slate-400">
              {loading ? 'Searching patients…' : 'No patients found matching your search'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
