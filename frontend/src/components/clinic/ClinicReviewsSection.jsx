import { useCallback, useEffect, useMemo, useState } from 'react';
import FaIcon from '../FaIcon';
import ReviewStars from '../platform/ReviewStars';
import ReviewForm from '../platform/ReviewForm';
import { useAuth } from '../../contexts/AuthContext';
import { clinicReviews } from '../../services/api';

function formatReviewDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(iso).slice(0, 10);
  }
}

function computeStats(reviews) {
  const list = reviews || [];
  const count = list.length;
  if (!count) return { avg: 0, count: 0 };
  const sum = list.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return { avg: sum / count, count };
}

export default function ClinicReviewsSection({ clinicId, initialReviews = [], initialRating, initialCount }) {
  const { user, hasRole } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await clinicReviews.list({ clinic_id: clinicId });
      setReviews(res.data || []);
    } catch {
      /* keep existing */
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews, clinicId]);

  useEffect(() => {
    if (clinicId && !initialReviews?.length) refresh();
  }, [clinicId, initialReviews?.length, refresh]);

  const stats = useMemo(() => {
    const fromList = computeStats(reviews);
    if (fromList.count > 0) return fromList;
    return {
      avg: Number(initialRating) || 0,
      count: Number(initialCount) || 0,
    };
  }, [reviews, initialRating, initialCount]);

  const onSubmitted = async (newReview) => {
    if (newReview?.id) {
      setReviews((prev) => {
        const exists = prev.some((r) => r.id === newReview.id);
        return exists ? prev : [newReview, ...prev];
      });
    }
    await refresh();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-amber-50 border border-amber-100 px-6 py-4 text-center w-fit max-w-full">
          <p className="text-3xl font-bold text-amber-900">
            {stats.avg > 0 ? stats.avg.toFixed(1) : stats.count > 0 ? '—' : 'New'}
          </p>
          <ReviewStars rating={stats.avg} count={stats.count} size="md" showValue={false} className="justify-center mt-1" />
        </div>

      {user && hasRole('patient') && (
        <ReviewForm clinicId={clinicId} onSubmitted={onSubmitted} />
      )}

      {loading && !reviews.length ? (
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <FaIcon icon="fa-spinner" className="fa-spin text-emerald-500" />
          Loading reviews…
        </p>
      ) : reviews.length > 0 ? (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="font-semibold text-slate-900 text-sm">
                  {r.patient_first_name || 'Patient'}
                </p>
                <span className="text-xs text-slate-400">{formatReviewDate(r.created_at)}</span>
              </div>
              <ReviewStars rating={r.rating} count={0} size="sm" showValue={false} />
              {r.comment?.trim() && (
                <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 p-4 text-center">
          No reviews yet. Be the first to share your experience.
        </p>
      )}
    </div>
  );
}
