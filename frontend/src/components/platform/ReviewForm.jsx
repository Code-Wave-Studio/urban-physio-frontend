import { useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { reviews, clinicReviews } from '../../services/api';

export default function ReviewForm({ doctorId, clinicId, appointmentId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (doctorId) {
        await reviews.create({ doctor_id: doctorId, appointment_id: appointmentId, rating, comment });
      } else if (clinicId) {
        await clinicReviews.create({ clinic_id: clinicId, appointment_id: appointmentId, rating, comment });
      }
      toast.success('Thank you for your review!');
      setComment('');
      onSubmitted?.();
    } catch (err) {
      toast.error(err.message || 'Could not submit review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-card p-4 space-y-3">
      <h3 className="font-bold text-slate-800 text-sm">Leave a review</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
            <FaIcon icon="fa-star" className={n <= rating ? 'text-amber-500 text-lg' : 'text-slate-300 text-lg'} />
          </button>
        ))}
      </div>
      <textarea className="input-field min-h-[70px] text-sm" placeholder="Share your experience (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button type="submit" disabled={saving} className="btn-primary text-sm py-2">{saving ? 'Submitting…' : 'Submit review'}</button>
    </form>
  );
}
