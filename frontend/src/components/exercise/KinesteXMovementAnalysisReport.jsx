import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { kinestex } from '../../services/api';
import KinesteXWorkoutOverview from './KinesteXWorkoutOverview';
import KinesteXSessionReplay from './KinesteXSessionReplay';

function formatWhen(value) {
  if (!value) return 'N/A';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function movementMessage(analysis) {
  if (!analysis) return 'Movement analysis is not available for this session.';
  if (analysis.message) return analysis.message;
  if (analysis.status === 'upload_failed') {
    return 'Movement recording could not be saved for this session.';
  }
  return 'Movement analysis is not available for this session.';
}

/**
 * Post-exercise AI Movement Analysis.
 * Persisted metrics + official KinesteX session/{id} replay (lazy credentials).
 * Does not invent landmarks, scores, or clinical diagnoses.
 */
export default function KinesteXMovementAnalysisReport({
  session,
  title = 'AI Movement Analysis',
  metricsTitle = 'Performance',
  showReplayButton = true,
  showMetrics = true,
}) {
  const [replaySdk, setReplaySdk] = useState(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState('');

  const analysis = session?.movement_analysis || null;
  const canReplay = !!(analysis?.available && analysis?.replay_supported && session?.id);

  const loadReplay = useCallback(async () => {
    if (!session?.id || replayLoading) return;
    setReplayLoading(true);
    setReplayError('');
    try {
      const res = await kinestex.prepareSessionReplay(session.id);
      const data = res?.data ?? res;
      const sdk = data?.sdk;
      if (!sdk?.key || !sdk?.company || !sdk?.userId || !sdk?.provider_session_id) {
        throw new Error('Movement replay credentials were incomplete.');
      }
      setReplaySdk(sdk);
    } catch (err) {
      const msg =
        err?.status === 403
          ? 'You are not authorized to view this movement report.'
          : err?.status === 404
            ? 'This AI session was not found.'
            : err?.message || 'Movement analysis is not available for this session.';
      setReplayError(msg);
      setReplaySdk(null);
      if (err?.status !== 422) toast.error(msg);
    } finally {
      setReplayLoading(false);
    }
  }, [session?.id, replayLoading]);

  const closeReplay = () => {
    setReplaySdk(null);
    setReplayError('');
  };

  if (!session) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FaIcon icon="fa-person-walking" className="text-teal-600" />
          {title}
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          <span className="font-semibold text-slate-800">{session.exercise_name || 'Exercise'}</span>
          <span className="text-slate-400"> · </span>
          {formatWhen(session.session_at || session.completed_at || session.created_at)}
        </p>
      </div>

      <div className={`grid gap-4 items-start ${showMetrics ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1'}`}>
        <div className={`${showMetrics ? 'lg:col-span-3' : ''} min-w-0 space-y-2`}>
          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
            Movement / skeleton
          </p>
          {replaySdk ? (
            <div className="space-y-2">
              <KinesteXSessionReplay sdk={replaySdk} onExit={closeReplay} onError={(msg) => setReplayError(msg)} />
              <button type="button" className="btn-outline !py-1.5 !px-3 text-xs min-h-10" onClick={closeReplay}>
                Close replay
              </button>
            </div>
          ) : canReplay && showReplayButton ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm text-slate-700">
                View the official KinesteX movement recording for this session.
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Replay is loaded on demand from KinesteX — not a simulated skeleton.
              </p>
              {replayError ? <p className="text-xs text-rose-700 mt-2">{replayError}</p> : null}
              <button
                type="button"
                className="btn-primary mt-3 min-h-10 !py-2 !px-4 text-sm"
                disabled={replayLoading}
                onClick={loadReplay}
              >
                {replayLoading ? 'Preparing…' : 'Open movement replay'}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm text-slate-600">{movementMessage(analysis)}</p>
            </div>
          )}
        </div>

        {showMetrics ? (
          <div className="lg:col-span-2 min-w-0 space-y-2">
            <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">Performance</p>
            <KinesteXWorkoutOverview
              metrics={session.metrics}
              title={metricsTitle}
              emptyMessage="Performance metrics were not included in this session result."
            />
            {analysis?.status === 'upload_failed' ? (
              <p className="text-[11px] text-amber-800 rounded-lg bg-amber-50 px-3 py-2">
                Metrics may still be available even when movement recording failed to upload.
              </p>
            ) : null}
            <p className="text-[10px] text-slate-400">
              Objective KinesteX metrics only — AI Exercise Feedback from recorded session data, not a medical diagnosis.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
