import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import GlassModal, { GlassModalHeader, GlassModalBody, GlassModalFooter } from '../GlassModal';
import FaIcon from '../FaIcon';
import { documents, doctors, clinicPortal } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Share a document with a patient, doctor, or clinic.
 */
export default function DocumentShareModal({ open, doc, onClose, onShared }) {
  const { user } = useAuth();
  const role = user?.role_slug || '';
  const [targetType, setTargetType] = useState('patient');
  const [targetId, setTargetId] = useState('');
  const [message, setMessage] = useState('');
  const [canDownload, setCanDownload] = useState(true);
  const [busy, setBusy] = useState(false);
  const [shares, setShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctorList, setDoctorList] = useState([]);

  useEffect(() => {
    if (!open || !doc) return;
    setTargetId('');
    setMessage('');
    setCanDownload(true);
    setLoadingShares(true);
    documents
      .shares(doc.id)
      .then((res) => setShares(res.data || []))
      .catch(() => setShares([]))
      .finally(() => setLoadingShares(false));

    if (role === 'doctor' || role === 'admin' || role === 'super_admin') {
      doctors
        .patients()
        .then((res) => setPatients(res.data || []))
        .catch(() => setPatients([]));
    }
    if (role === 'clinic' || role === 'clinic_staff') {
      clinicPortal
        .me()
        .then(async (res) => {
          const me = res.data || res;
          const cid = me.clinic?.id;
          if (!cid) return;
          const [docs, pats] = await Promise.all([
            clinicPortal.doctors(cid).catch(() => ({ data: [] })),
            clinicPortal.patients(cid).catch(() => ({ data: [] })),
          ]);
          setDoctorList(Array.isArray(docs.data) ? docs.data : Array.isArray(docs) ? docs : []);
          const patPayload = pats.data || pats || {};
          setPatients(
            Array.isArray(patPayload)
              ? patPayload
              : Array.isArray(patPayload.items)
                ? patPayload.items
                : []
          );
        })
        .catch(() => {});
    }
  }, [open, doc?.id, role]);

  if (!doc) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!targetId) {
      toast.error('Select who to share with');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        message: message.trim() || undefined,
        can_download: canDownload,
      };
      if (targetType === 'patient') payload.patient_id = Number(targetId);
      if (targetType === 'doctor') payload.doctor_id = Number(targetId);
      if (targetType === 'clinic') payload.clinic_id = Number(targetId);

      await documents.share(doc.id, payload);
      toast.success('Document shared');
      onShared?.();
      const res = await documents.shares(doc.id);
      setShares(res.data || []);
      setTargetId('');
      setMessage('');
    } catch (err) {
      toast.error(err.message || 'Share failed');
    } finally {
      setBusy(false);
    }
  };

  const removeShare = async (shareId) => {
    if (!window.confirm('Remove this share?')) return;
    try {
      await documents.unshare(doc.id, shareId);
      toast.success('Share removed');
      setShares((prev) => prev.filter((s) => Number(s.id) !== Number(shareId)));
      onShared?.();
    } catch (err) {
      toast.error(err.message || 'Could not remove share');
    }
  };

  const targetOptions =
    targetType === 'patient'
      ? patients.map((p) => ({
          id: p.id || p.patient_id,
          label: `${p.first_name || p.patient_name || 'Patient'} ${p.last_name || ''}`.trim()
            + (p.phone ? ` · ${p.phone}` : ''),
        }))
      : targetType === 'doctor'
        ? doctorList.map((d) => ({
            id: d.doctor_id || d.id,
            label: `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim(),
          }))
        : [];

  return (
    <GlassModal open={open} onClose={onClose} size="md">
      <GlassModalHeader
        title="Share document"
        subtitle={doc.title}
        icon="fa-share-nodes"
        onClose={onClose}
      />
      <GlassModalBody>
        <form id="doc-share-form" onSubmit={submit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'patient', label: 'Patient', show: true },
              { key: 'doctor', label: 'Doctor', show: role === 'clinic' || role === 'clinic_staff' || role === 'admin' || role === 'super_admin' },
            ]
              .filter((t) => t.show)
              .map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTargetType(t.key);
                    setTargetId('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    targetType === t.key ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Share with</label>
            <select
              className="input-field"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              required
            >
              <option value="">Select {targetType}…</option>
              {targetOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            {!targetOptions.length && (
              <p className="text-xs text-slate-400 mt-1">No {targetType}s available to share with yet.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message (optional)</label>
            <input
              className="input-field"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Please review this MRI before your next visit"
              maxLength={500}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={canDownload}
              onChange={(e) => setCanDownload(e.target.checked)}
            />
            Allow download (uncheck for view-only share)
          </label>
        </form>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Current shares</p>
          {loadingShares ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-slate-400">Not shared with anyone yet.</p>
          ) : (
            <ul className="space-y-2">
              {shares.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 text-sm bg-slate-50 rounded-xl px-3 py-2"
                >
                  <span className="min-w-0 truncate text-slate-700">
                    {s.patient_name || s.doctor_name || s.clinic_name || s.user_name || 'Recipient'}
                    {!Number(s.can_download) && (
                      <span className="ml-2 text-[10px] uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        view only
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-rose-600 hover:underline shrink-0"
                    onClick={() => removeShare(s.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </GlassModalBody>
      <GlassModalFooter>
        <button type="button" className="btn-outline" onClick={onClose}>
          Close
        </button>
        <button type="submit" form="doc-share-form" className="btn-primary" disabled={busy || !targetId}>
          {busy ? 'Sharing…' : 'Share'}
        </button>
      </GlassModalFooter>
    </GlassModal>
  );
}
