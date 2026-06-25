import { useEffect, useState } from 'react';
import FaIcon from './FaIcon';
import { useAuth } from '../contexts/AuthContext';
import { useRequireAuth } from '../utils/requireAuth';
import { patients } from '../services/api';
import { isLocalFavourite, toggleLocalFavourite } from '../utils/bookingFavourites';
import toast from 'react-hot-toast';

export default function SaveDoctorButton({ doctor, className = '', compact = false }) {
  const { user, hasRole } = useAuth();
  const { requireAuth } = useRequireAuth();  const doctorId = doctor?.id;
  const [saved, setSaved] = useState(() => isLocalFavourite(doctorId));

  useEffect(() => {
    const sync = () => setSaved(isLocalFavourite(doctorId));
    sync();
    window.addEventListener('saved-doctors-changed', sync);
    return () => window.removeEventListener('saved-doctors-changed', sync);
  }, [doctorId]);

  const toggle = async () => {
    if (!doctorId) return;
    if (!requireAuth('Log in to save doctors')) return;
    const nowFav = toggleLocalFavourite(doctorId);
    setSaved(nowFav);
    window.dispatchEvent(new CustomEvent('saved-doctors-changed'));

    if (user && hasRole('patient')) {
      try {
        if (nowFav) await patients.addFavouriteDoctor(doctorId);
        else await patients.removeFavouriteDoctor(doctorId);
      } catch {
        /* local save still works */
      }
    }

    toast.success(nowFav ? 'Doctor saved' : 'Removed from saved doctors', { duration: 2000 });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center justify-center gap-1.5 font-semibold border transition ${
        compact ? 'text-xs !px-3 !py-2.5 rounded-xl' : 'text-sm !px-4 !py-3 rounded-xl'
      } ${
        saved
          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
      } ${className}`}
      aria-pressed={saved}
      title={saved ? 'Remove from saved' : 'Save doctor'}
    >
      <FaIcon icon="fa-heart" className={saved ? 'text-rose-500' : 'text-slate-400'} />
      {compact ? (saved ? 'Saved' : 'Save') : saved ? 'Saved' : 'Save doctor'}
    </button>
  );
}
