import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import DoctorAvatar from '../../components/DoctorAvatar';
import ClinicLogo from '../../components/ClinicLogo';
import ExerciseDetailModal from '../../components/exercise/ExerciseDetailModal';
import SavedPodcastModal from '../../components/podcast/SavedPodcastModal';
import { PATIENT_NAV } from '../../constants/patientNav';
import { patients, exercises } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getSavedClinics } from '../../utils/savedClinics';
import { getSavedExercises } from '../../utils/savedExercises';
import { getFavoritePodcasts, removeFavoritePodcast } from '../../utils/favoritePodcasts';
import { getLocalFavourites } from '../../utils/bookingFavourites';
import { doctorProfileUrl, clinicProfileUrl } from '../../utils/profileUrls';
import { bookDoctorUrl, bookClinicUrl } from '../../utils/bookUrl';
import { clinicMapsUrl } from '../../utils/locationHelpers';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const TABS = [
  { id: 'doctors', label: 'Doctors', icon: 'fa-user-doctor' },
  { id: 'clinics', label: 'Clinics', icon: 'fa-hospital' },
  { id: 'exercises', label: 'Exercises', icon: 'fa-dumbbell' },
  { id: 'podcasts', label: 'PhysioFeed', icon: 'fa-podcast' },
];

export default function PatientSaved() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState('doctors');
  const [data, setData] = useState({ doctors: [], clinics: [], exercises: [], podcasts: [] });
  const [loading, setLoading] = useState(true);
  const [exerciseModal, setExerciseModal] = useState(null);
  const [podcastModal, setPodcastModal] = useState(null);
  const [openingExercise, setOpeningExercise] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const podcasts = getFavoritePodcasts();

    if (hasRole('patient')) {
      patients
        .saved()
        .then((res) => {
          const d = res?.data ?? res ?? {};
          setData({
            doctors: d.doctors || [],
            clinics: d.clinics || [],
            exercises: d.exercises || [],
            podcasts,
          });
        })
        .catch(() => setData({ doctors: [], clinics: [], exercises: [], podcasts }))
        .finally(() => setLoading(false));
      return;
    }

    const favIds = getLocalFavourites();
    setData({
      doctors: favIds.map((id) => ({ id: Number(id), first_name: 'Doctor', last_name: `#${id}` })),
      clinics: getSavedClinics(),
      exercises: getSavedExercises(),
      podcasts,
    });
    setLoading(false);
  }, [hasRole]);

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener('saved-clinics-changed', refresh);
    window.addEventListener('saved-exercises-changed', refresh);
    window.addEventListener('saved-doctors-changed', refresh);
    window.addEventListener('favorite-podcasts-changed', refresh);
    return () => {
      window.removeEventListener('saved-clinics-changed', refresh);
      window.removeEventListener('saved-exercises-changed', refresh);
      window.removeEventListener('saved-doctors-changed', refresh);
      window.removeEventListener('favorite-podcasts-changed', refresh);
    };
  }, [load]);

  const openExercise = async (ex) => {
    if (ex.instructions) {
      setExerciseModal(ex);
      return;
    }
    setOpeningExercise(true);
    try {
      const key = ex.slug || ex.id;
      const res = key ? await exercises.get(key) : null;
      setExerciseModal(res?.data ?? res ?? ex);
    } catch {
      setExerciseModal(ex);
    } finally {
      setOpeningExercise(false);
    }
  };

  const removeDoctor = async (id) => {
    try {
      if (hasRole('patient')) await patients.removeFavouriteDoctor(id);
      toast.success('Removed');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not remove');
    }
  };

  const removeClinic = async (id) => {
    try {
      if (hasRole('patient')) await patients.removeFavouriteClinic(id);
      toast.success('Removed');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not remove');
    }
  };

  const removeExercise = async (id) => {
    try {
      if (hasRole('patient')) await patients.removeSavedExercise(id);
      toast.success('Removed');
      load();
    } catch (e) {
      toast.error(e.message || 'Could not remove');
    }
  };

  const removePodcast = (slug) => {
    removeFavoritePodcast(slug);
    toast.success('Removed');
    load();
  };

  const list = data[tab] || [];
  const browseLink =
    tab === 'clinics' ? '/clinics' : tab === 'exercises' ? '/exercises' : tab === 'podcasts' ? '/physiofeed?type=podcast' : '/doctors';

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Saved</h1>
        <p className="text-sm text-slate-600 mt-1">Your saved doctors, clinics, exercises, and PhysioFeed podcasts.</p>
      </div>

      <div className="scroll-x-hide flex flex-nowrap gap-2 mb-6 -mx-1 px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              tab === t.id ? 'bg-primary-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FaIcon icon={t.icon} />
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>
              {(data[t.id] || []).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card text-center py-16">
          <FaIcon icon={TABS.find((t) => t.id === tab)?.icon || 'fa-heart'} className="text-4xl text-slate-300 mb-3" />
          <p className="text-slate-700 font-semibold">Nothing saved yet</p>
          <p className="text-sm text-slate-500 mt-1">
            {tab === 'podcasts'
              ? 'Tap the heart on a podcast to save it here.'
              : `Tap Save on a ${tab.slice(0, -1)} profile or listing to add it here.`}
          </p>
          <Link to={browseLink} className="btn-primary mt-4 inline-flex text-sm">
            Browse {tab === 'podcasts' ? 'PhysioFeed' : tab}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tab === 'doctors' &&
            list.map((d) => (
              <article key={d.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
                <DoctorAvatar doctor={d} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">Dr. {d.first_name} {d.last_name}</p>
                  <p className="text-sm text-primary-700">{d.specialization || 'Physiotherapist'}</p>
                  <p className="text-xs text-slate-500 mt-1">{d.city_name || 'India'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={doctorProfileUrl(d)} className="btn-outline text-sm">Profile</Link>
                  <Link to={bookDoctorUrl(d.id)} className="btn-primary text-sm">Book</Link>
                  <button type="button" className="btn-outline text-sm text-red-700 border-red-200" onClick={() => removeDoctor(d.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}

          {tab === 'clinics' &&
            list.map((c) => {
              const mapUrl = clinicMapsUrl(c);
              return (
                <article key={c.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
                  <ClinicLogo clinic={c} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-sm text-slate-600 line-clamp-2">{c.address || c.city_name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={clinicProfileUrl(c)} className="btn-outline text-sm">Profile</Link>
                    <Link to={bookClinicUrl(c.id)} className="btn-primary text-sm inline-flex items-center gap-1.5">
                      <FaIcon icon="fa-calendar-check" /> Book appointment
                    </Link>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="btn-outline text-sm inline-flex items-center gap-1">
                        <FaIcon icon="fa-phone" /> Call
                      </a>
                    )}
                    {mapUrl && (
                      <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm inline-flex items-center gap-1">
                        <FaIcon icon="fa-diamond-turn-right" /> Directions
                      </a>
                    )}
                    <button type="button" className="btn-outline text-sm text-red-700 border-red-200" onClick={() => removeClinic(c.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}

          {tab === 'exercises' &&
            list.map((ex) => (
              <article
                key={ex.id || ex.slug}
                role="button"
                tabIndex={0}
                onClick={() => openExercise(ex)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openExercise(ex)}
                className="card flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:border-teal-200 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <FaIcon icon="fa-dumbbell" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{ex.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{ex.body_area} · {ex.difficulty}</p>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{ex.instructions || 'Tap to view exercise details'}</p>
                </div>
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
                  <button type="button" className="btn-outline text-sm" onClick={() => openExercise(ex)}>
                    Open
                  </button>
                  <button type="button" className="btn-outline text-sm text-red-700 border-red-200" onClick={() => removeExercise(ex.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}

          {tab === 'podcasts' &&
            list.map((p) => {
              const cover = resolveMediaUrl(p.featured_image);
              return (
                <article
                  key={p.slug}
                  role="button"
                  tabIndex={0}
                  onClick={() => setPodcastModal(p)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPodcastModal(p)}
                  className="card flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:border-rose-200 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : <FaIcon icon="fa-podcast" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 line-clamp-2">{p.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{p.author_name || 'The Urban Physio'} · Podcast</p>
                  </div>
                  <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
                    <button type="button" className="btn-primary text-sm inline-flex items-center gap-1.5" onClick={() => setPodcastModal(p)}>
                      <FaIcon icon="fa-play" /> Play
                    </button>
                    <button type="button" className="btn-outline text-sm text-red-700 border-red-200" onClick={() => removePodcast(p.slug)}>
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
        </div>
      )}

      {openingExercise && (
        <p className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-xs bg-slate-900 text-white px-3 py-2 rounded-full shadow-lg">
          Loading exercise…
        </p>
      )}

      <ExerciseDetailModal exercise={exerciseModal} onClose={() => setExerciseModal(null)} />
      <SavedPodcastModal podcast={podcastModal} onClose={() => setPodcastModal(null)} />
    </DashboardLayout>
  );
}
