import { useEffect, useState } from 'react';

import FaIcon from '../FaIcon';

import { useAuth } from '../../contexts/AuthContext';
import { useRequireAuth } from '../../utils/requireAuth';
import { patients } from '../../services/api';

import { isClinicSaved, toggleSavedClinic } from '../../utils/savedClinics';

import toast from 'react-hot-toast';



export default function SaveClinicButton({ clinic, className = '', compact = false }) {

  const { user, hasRole } = useAuth();
  const { requireAuth } = useRequireAuth();

  const [saved, setSaved] = useState(() => isClinicSaved(clinic?.id));



  useEffect(() => {

    const sync = () => setSaved(isClinicSaved(clinic?.id));

    sync();

    window.addEventListener('saved-clinics-changed', sync);

    return () => window.removeEventListener('saved-clinics-changed', sync);

  }, [clinic?.id]);



  const toggle = async () => {
    if (!requireAuth('Log in to save clinics')) return;
    const { saved: next } = toggleSavedClinic(clinic);

    setSaved(next);



    if (user && hasRole('patient') && clinic?.id) {

      try {

        if (next) await patients.addFavouriteClinic(clinic.id);

        else await patients.removeFavouriteClinic(clinic.id);

      } catch {

        /* local save still works */

      }

    }



    toast.success(next ? 'Clinic saved to your list' : 'Removed from saved clinics', { duration: 2000 });

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

      title={saved ? 'Remove from saved' : 'Save clinic'}

    >

      <FaIcon icon="fa-heart" className={saved ? 'text-rose-500' : 'text-slate-400'} />

      {compact ? (saved ? 'Saved' : 'Save') : saved ? 'Saved' : 'Save'}

    </button>

  );

}

