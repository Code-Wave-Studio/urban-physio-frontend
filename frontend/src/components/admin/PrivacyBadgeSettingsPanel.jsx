import { useCallback, useEffect, useState } from 'react';
import FaIcon from '../FaIcon';
import PrivacyClaimBadges from '../privacy/PrivacyClaimBadges';
import { admin } from '../../services/api';
import { makesUnverifiedClaim } from '../../utils/privacyBadges';
import toast from 'react-hot-toast';

function draftIsBlocked(badge) {
  return makesUnverifiedClaim(badge.label) || makesUnverifiedClaim(badge.description);
}

export default function PrivacyBadgeSettingsPanel({ placements }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    admin
      .privacyBadgeSettings()
      .then((res) => setBadges(res.data?.badges || []))
      .catch((err) => toast.error(err.message || 'Could not load privacy notes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = placements?.length
    ? badges.filter((badge) => placements.includes(badge.placement))
    : badges;

  const updateBadge = (id, patch) => {
    setBadges((current) => current.map((badge) => (badge.id === id ? { ...badge, ...patch } : badge)));
  };

  const save = async () => {
    const savingBadges = placements?.length
      ? badges.filter((badge) => placements.includes(badge.placement))
      : badges;
    const blocked = savingBadges.find((badge) => draftIsBlocked(badge));
    if (blocked) {
      toast.error('Remove certification or compliance claims before saving.');
      return;
    }
    setSaving(true);
    try {
      const res = await admin.updatePrivacyBadgeSettings({
        badges: savingBadges.map((badge) => ({
          id: badge.id,
          enabled: !!badge.enabled,
          label: badge.label,
          description: badge.description,
        })),
      });
      setBadges(res.data?.badges || []);
      toast.success('Privacy notes saved');
    } catch (err) {
      toast.error(err.message || 'Could not save privacy notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-card p-4 md:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <FaIcon icon="fa-shield-halved" className="text-logo-700 mt-0.5" />
        <div className="min-w-0">
          <h2 className="font-bold text-slate-800">Privacy and security notes</h2>
          <p className="text-sm text-slate-600 mt-1">
            These notes stay hidden until you turn one on. They describe encryption in transit and care-team access from the published Privacy and Data Security policies. They are not HIPAA or GDPR certification badges, and they do not certify an individual exercise.
          </p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading privacy notes…</p>}

      {!loading && visible.length === 0 && (
        <p className="text-sm text-slate-500">No privacy notes are available to configure.</p>
      )}

      {!loading && visible.map((badge) => {
        const blocked = draftIsBlocked(badge);
        return (
          <fieldset key={badge.id} className="rounded-xl border border-logo-100 p-3 sm:p-4 space-y-3">
            <legend className="px-1 text-sm font-semibold text-slate-800">{badge.placement_label}</legend>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={!!badge.enabled}
                onChange={(event) => updateBadge(badge.id, { enabled: event.target.checked })}
              />
              <span>Show this note. Leave it off when no approved wording should appear.</span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Label
              <input
                className="input-field mt-1"
                maxLength={48}
                value={badge.label || ''}
                onChange={(event) => updateBadge(badge.id, { label: event.target.value })}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Accessible description
              <textarea
                className="input-field mt-1 min-h-[88px]"
                maxLength={280}
                value={badge.description || ''}
                onChange={(event) => updateBadge(badge.id, { description: event.target.value })}
              />
            </label>
            {blocked ? (
              <p className="text-sm text-rose-700" role="alert">
                This wording claims a certification, compliance status, or third-party approval. The site will not display it.
              </p>
            ) : (
              <PrivacyClaimBadges
                badges={[{
                  id: badge.id,
                  label: badge.label,
                  description: badge.description,
                  icon: badge.icon,
                  href: badge.href,
                }]}
                variant="card"
                linked={false}
              />
            )}
            <button
              type="button"
              className="text-sm font-semibold text-logo-700 hover:text-logo-800"
              onClick={() => updateBadge(badge.id, {
                label: badge.default_label,
                description: badge.default_description,
              })}
            >
              Restore suggested wording
            </button>
          </fieldset>
        );
      })}

      {!loading && visible.length > 0 && (
        <button type="button" className="btn-primary" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save privacy notes'}
        </button>
      )}
    </section>
  );
}
