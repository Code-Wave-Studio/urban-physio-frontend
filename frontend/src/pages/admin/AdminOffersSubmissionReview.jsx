import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import toast from 'react-hot-toast';

export default function AdminOffersSubmissionReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rewardActionLoading, setRewardActionLoading] = useState(false);

  // Form states for review actions
  const [selectedAction, setSelectedAction] = useState('approved'); // 'approved' | 'under_review' | 'rejected'
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rewardStatus, setRewardStatus] = useState('pending');
  const [rewardNote, setRewardNote] = useState('');

  // Proof Image Preview Modal / Zoom
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Copy helper
  const [copiedField, setCopiedField] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await admin.offersSubmissionDetail(id);
      const data = res.data ?? res;
      setSubmission(data);
      setAdminNote(data.admin_notes || '');
      setRejectionReason(data.rejection_reason || '');
      setRewardStatus(data.reward_status || 'pending');
      setRewardNote(data.reward_notes || '');
      // Default selected action based on current status
      if (data.status === 'rejected') setSelectedAction('rejected');
      else if (data.status === 'under_review') setSelectedAction('under_review');
      else setSelectedAction('approved');
    } catch (err) {
      toast.error(err.message || 'Could not load submission details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = `Review Submission #${id} | The Urban Physio Admin`;
    fetchDetail();
  }, [id]);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdateStatus = async (statusOverride) => {
    const targetStatus = statusOverride || selectedAction;

    if (targetStatus === 'rejected' && !rejectionReason.trim()) {
      toast.error('Please enter a rejection reason (visible to the participant)');
      return;
    }

    setActionLoading(true);
    try {
      await admin.updateOffersSubmissionStatus(id, {
        status: targetStatus,
        rejection_reason: targetStatus === 'rejected' ? rejectionReason.trim() : '',
        admin_notes: adminNote.trim(),
        reward_status: rewardStatus,
      });

      toast.success(
        targetStatus === 'approved'
          ? '🎉 Submission approved successfully!'
          : targetStatus === 'rejected'
          ? 'Submission rejected with reason provided.'
          : 'Submission marked as under review / changes requested.'
      );
      fetchDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to update submission status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateReward = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setRewardActionLoading(true);
    try {
      await admin.updateOffersRewardStatus(id, {
        reward_status: rewardStatus,
        reward_notes: rewardNote.trim(),
      });
      toast.success('Reward status updated successfully');
      fetchDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to update reward status');
    } finally {
      setRewardActionLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'approved':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: 'fa-circle-check',
          label: 'Approved & Verified',
        };
      case 'rejected':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: 'fa-circle-xmark',
          label: 'Rejected',
        };
      case 'under_review':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: 'fa-clock-rotate-left',
          label: 'Under Review',
        };
      default:
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          dot: 'bg-sky-500',
          icon: 'fa-hourglass-start',
          label: 'Pending Verification',
        };
    }
  };

  const getRewardBadge = (rw) => {
    switch (rw) {
      case 'claimed':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: 'fa-gift',
          label: 'Reward Claimed',
        };
      case 'approved':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: 'fa-ticket',
          label: 'Voucher Ready (Approved)',
        };
      case 'eligible':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: 'fa-circle-check',
          label: 'Eligible (Qualified)',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          icon: 'fa-clock',
          label: 'Reward Pending',
        };
    }
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500">
          <div className="relative mb-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
            <FaIcon
              icon="fa-shield-halved"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600 text-sm"
            />
          </div>
          <p className="text-base font-bold text-slate-700">Loading Submission #{id} Details...</p>
          <p className="text-xs text-slate-400 mt-1">Fetching participant records and run proof documents</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (!submission) {
    return (
      <AdminDashboardLayout>
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm max-w-xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl mx-auto mb-4">
            <FaIcon icon="fa-triangle-exclamation" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Submission Not Found</h2>
          <p className="text-sm text-slate-600 mb-6">
            The campaign submission #{id} could not be found or has been removed.
          </p>
          <Link
            to="/admin/offers"
            className="btn-primary inline-flex items-center gap-2 text-sm !px-5 !py-2.5"
          >
            <FaIcon icon="fa-arrow-left" />
            Back to Submissions List
          </Link>
        </div>
      </AdminDashboardLayout>
    );
  }

  const isPdf =
    submission.proof_file_mime?.includes('pdf') ||
    submission.proof_file_name?.toLowerCase().endsWith('.pdf') ||
    submission.proof_file_url?.toLowerCase().endsWith('.pdf');

  const resolvedProofUrl = submission.proof_file_url
    ? resolveMediaUrl(submission.proof_file_url) || submission.proof_file_url
    : null;

  const currentStatusBadge = getStatusBadge(submission.status);
  const currentRewardBadge = getRewardBadge(submission.reward_status);

  return (
    <AdminDashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ━━━ TOP BREADCRUMB & HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col gap-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/admin"
                className="hover:text-primary-600 transition flex items-center gap-1.5 font-medium"
              >
                <FaIcon icon="fa-gauge-high" className="text-slate-400" />
                Dashboard
              </Link>
              <span>/</span>
              <Link
                to="/admin/offers"
                className="hover:text-primary-600 transition font-medium"
              >
                Campaign &amp; Offers
              </Link>
              <span>/</span>
              <Link
                to="/admin/offers"
                className="hover:text-primary-600 transition font-medium"
              >
                Submissions
              </Link>
              <span>/</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                Review #{submission.id}
              </span>
            </div>

            <Link
              to="/admin/offers"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary-600 transition bg-white border border-slate-200 hover:border-primary-300 px-3 py-1.5 rounded-xl shadow-xs"
            >
              <FaIcon icon="fa-arrow-left" />
              Back to Submissions
            </Link>
          </div>

          {/* Hero Profile Bar */}
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-slate-50 to-primary-50/30 p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
                  {(submission.full_name || 'U')[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {submission.full_name}
                    </h1>
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-lg">
                      #{submission.id}
                    </span>
                    {submission.user_id && (
                      <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                        <FaIcon icon="fa-user-check" className="text-[10px]" />
                        User ID #{submission.user_id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>
                      Campaign:{' '}
                      <strong className="text-slate-800 font-bold">
                        Run 10 KM &amp; Get Free Physiotherapy
                      </strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      Submitted on{' '}
                      <strong className="text-slate-700 font-semibold">
                        {new Date(submission.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Pills & Reload Action Button */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold border shadow-xs ${currentStatusBadge.bg}`}
                >
                  <span className={`h-2 w-2 rounded-full ${currentStatusBadge.dot}`} />
                  <FaIcon icon={currentStatusBadge.icon} className="text-xs" />
                  <span>{currentStatusBadge.label}</span>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold border shadow-xs ${currentRewardBadge.bg}`}
                >
                  <FaIcon icon={currentRewardBadge.icon} className="text-xs" />
                  <span>{currentRewardBadge.label}</span>
                </div>

                <button
                  type="button"
                  onClick={fetchDetail}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-primary-600 font-bold text-xs shadow-xs transition cursor-pointer"
                  title="Reload Submission Details"
                >
                  <FaIcon icon="fa-arrows-rotate" className={loading ? 'fa-spin text-primary-600' : 'text-slate-400'} />
                  <span>Reload</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━ QUICK METRIC STRIP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Run Distance</span>
              <FaIcon icon="fa-person-running" className="text-base" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-900">
                {submission.distance_km}
              </span>
              <span className="text-xs font-extrabold text-emerald-700">KM</span>
            </div>
            <p className="text-[11px] font-medium text-emerald-700 mt-1">
              {Number(submission.distance_km) >= 10 ? '✓ Meets 10 KM Target' : '⚠ Below 10 KM Target'}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/70 via-white to-sky-50/30 p-4 shadow-xs">
            <div className="flex items-center justify-between text-sky-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Run Date</span>
              <FaIcon icon="fa-calendar-days" className="text-base" />
            </div>
            <p className="text-lg sm:text-xl font-black text-sky-950 mt-1 truncate">
              {submission.run_date}
            </p>
            <p className="text-[11px] font-medium text-sky-700 mt-1">Activity completed date</p>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 p-4 shadow-xs">
            <div className="flex items-center justify-between text-purple-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Reward Status</span>
              <FaIcon icon="fa-gift" className="text-base" />
            </div>
            <p className="text-base sm:text-lg font-black text-purple-950 mt-1 capitalize truncate">
              {submission.reward_status}
            </p>
            <p className="text-[11px] font-medium text-purple-700 mt-1">
              {submission.reward_status === 'claimed'
                ? 'Claimed by participant'
                : submission.reward_status === 'approved'
                ? 'Voucher ready'
                : 'Free session reward'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/70 via-white to-slate-50/30 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Reviewer</span>
              <FaIcon icon="fa-user-shield" className="text-base" />
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 mt-1 truncate">
              {submission.reviewer_name || (submission.reviewed_by ? `Admin #${submission.reviewed_by}` : 'Unassigned')}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1 truncate">
              {submission.reviewed_at
                ? new Date(submission.reviewed_at).toLocaleDateString('en-IN')
                : 'Pending verification'}
            </p>
          </div>
        </div>

        {/* ━━━ MAIN CONTENT GRID (2 COLUMNS) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ────────────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN: Participant Details & Proof Viewer (7 cols)       */}
          {/* ────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Participant & Contact Information */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                    <FaIcon icon="fa-id-card" />
                  </div>
                  <h2 className="text-base font-black text-slate-900">
                    Participant Profile &amp; Contact
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  Verification ID: #{submission.id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Full Name
                  </span>
                  <p className="text-sm font-extrabold text-slate-900">{submission.full_name}</p>
                </div>

                {/* City */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    City / Location
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FaIcon icon="fa-location-dot" className="text-rose-500 text-xs" />
                    {submission.city || 'Not specified'}
                  </p>
                </div>

                {/* Email */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 sm:col-span-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Email Address
                    </span>
                    <a
                      href={`mailto:${submission.email}`}
                      className="text-sm font-extrabold text-primary-700 hover:underline truncate block"
                    >
                      {submission.email}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(submission.email, 'email')}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-primary-600 hover:border-primary-300 text-xs transition shrink-0"
                    title="Copy email"
                  >
                    <FaIcon icon={copiedField === 'email' ? 'fa-check' : 'fa-copy'} />
                  </button>
                </div>

                {/* Phone */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 sm:col-span-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Contact Phone
                    </span>
                    <a
                      href={`tel:${submission.phone}`}
                      className="text-sm font-extrabold text-slate-900 hover:text-primary-600 transition truncate block"
                    >
                      {submission.phone}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(submission.phone, 'phone')}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-primary-600 hover:border-primary-300 text-xs transition shrink-0"
                    title="Copy phone"
                  >
                    <FaIcon icon={copiedField === 'phone' ? 'fa-check' : 'fa-copy'} />
                  </button>
                </div>
              </div>

              {/* Linked User Account Info */}
              {submission.user_id && (
                <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      <FaIcon icon="fa-user" />
                    </div>
                    <div>
                      <span className="font-bold text-indigo-950 block">
                        Linked Urban Physio Account: {submission.user_account_name || 'Registered Patient'}
                      </span>
                      <span className="text-indigo-600 text-[11px]">
                        User Account ID #{submission.user_id}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/admin/users?search=${encodeURIComponent(submission.email)}`}
                    className="font-bold text-indigo-700 hover:underline shrink-0"
                  >
                    View Account &rarr;
                  </Link>
                </div>
              )}

              {/* Participant's Note */}
              {submission.notes ? (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs">
                  <div className="flex items-center gap-2 text-amber-800 font-bold mb-1.5">
                    <FaIcon icon="fa-comment-dots" className="text-amber-500" />
                    <span>Participant's Note / Remarks:</span>
                  </div>
                  <p className="text-amber-950 leading-relaxed font-medium pl-5 whitespace-pre-line">
                    {submission.notes}
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-400 flex items-center gap-2">
                  <FaIcon icon="fa-circle-info" className="text-slate-300" />
                  No additional notes provided by participant.
                </div>
              )}
            </div>

            {/* 2. Uploaded Proof & Documents Viewer */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                    <FaIcon icon="fa-file-shield" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Run Proof &amp; Activity Evidence</h2>
                    <p className="text-[11px] text-slate-500">
                      Uploaded activity screenshot, GPS tracking or event certificate
                    </p>
                  </div>
                </div>

                {resolvedProofUrl && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isPdf && (
                      <button
                        type="button"
                        onClick={() => setImageModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs hover:text-primary-700 cursor-pointer"
                        title="Inspect and Zoom Image"
                      >
                        <FaIcon icon="fa-magnifying-glass-plus" className="text-primary-600 text-[11px]" />
                        Inspect &amp; Zoom
                      </button>
                    )}
                    <a
                      href={resolvedProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs hover:text-primary-700"
                      title="Open full resolution in new tab"
                    >
                      <FaIcon icon="fa-arrow-up-right-from-square" className="text-[11px]" />
                      Open Full
                    </a>
                    <a
                      href={resolvedProofUrl}
                      download={submission.proof_file_name || `proof_${submission.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200/50 text-xs font-bold transition shadow-2xs"
                      title="Download file"
                    >
                      <FaIcon icon="fa-download" className="text-[11px]" />
                      Download
                    </a>
                  </div>
                )}
              </div>

              {/* Document Meta Badges */}
              <div className="flex items-center gap-2.5 mb-4 flex-wrap text-xs">
                <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                  <FaIcon icon="fa-paperclip" className="text-slate-400" />
                  {submission.proof_file_name || 'Uploaded_Proof_File'}
                </div>
                {submission.proof_file_mime && (
                  <div className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-xl font-semibold">
                    {submission.proof_file_mime}
                  </div>
                )}
                {submission.proof_file_size && (
                  <div className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-xl font-semibold">
                    {formatFileSize(submission.proof_file_size)}
                  </div>
                )}
              </div>

              {/* Main Proof Display Area */}
              <div className="rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden relative min-h-[380px] flex items-center justify-center">
                {isPdf ? (
                  /* PDF Document View */
                  <div className="p-8 text-center text-white w-full max-w-md my-auto">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-4xl shadow-inner">
                      <FaIcon icon="fa-file-pdf" />
                    </div>
                    <h3 className="text-base font-black text-slate-100 mb-1 truncate">
                      {submission.proof_file_name || 'Proof_Document.pdf'}
                    </h3>
                    <p className="text-xs text-slate-400 mb-5">
                      PDF Document • {formatFileSize(submission.proof_file_size)}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <a
                        href={resolvedProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex items-center gap-2 text-xs !py-2.5 !px-5"
                      >
                        <FaIcon icon="fa-arrow-up-right-from-square" />
                        Open PDF in New Window
                      </a>
                    </div>
                  </div>
                ) : resolvedProofUrl ? (
                  /* Clean Image Proof View - Click to Zoom without any blocking hover overlay */
                  <div
                    onClick={() => setImageModalOpen(true)}
                    className="w-full flex flex-col items-center justify-center p-3 min-h-[380px] max-h-[600px] overflow-hidden bg-slate-950 cursor-zoom-in group"
                    title="Click image to inspect in zoom view"
                  >
                    <img
                      src={resolvedProofUrl}
                      alt="Participant Run Proof"
                      className="max-h-[530px] w-auto max-w-full object-contain rounded-xl transition duration-300 group-hover:scale-[1.01]"
                    />
                    <div className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                      <FaIcon icon="fa-magnifying-glass-plus" className="text-[9px]" />
                      Click image to inspect in zoom view
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="p-12 text-center text-slate-500">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-600 flex items-center justify-center text-2xl mx-auto mb-3">
                      <FaIcon icon="fa-image-slash" />
                    </div>
                    <p className="text-sm font-bold text-slate-300">No proof file available</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Participant did not upload an activity file or document.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN: Review Decision & Verification Actions (5 cols)  */}
          {/* ────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Decision Control Center */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs sticky top-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                    <FaIcon icon="fa-gavel" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Verification Decision</h2>
                    <p className="text-[11px] text-slate-500">Take review action on this submission</p>
                  </div>
                </div>
              </div>

              {/* Action Mode Radio Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5">
                <button
                  type="button"
                  onClick={() => setSelectedAction('approved')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
                    selectedAction === 'approved'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50'
                  }`}
                >
                  <FaIcon icon="fa-circle-check" className="text-sm" />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAction('under_review')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
                    selectedAction === 'under_review'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50/50'
                  }`}
                >
                  <FaIcon icon="fa-clock-rotate-left" className="text-sm" />
                  <span>Under Review</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAction('rejected')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
                    selectedAction === 'rejected'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/50'
                  }`}
                >
                  <FaIcon icon="fa-circle-xmark" className="text-sm" />
                  <span>Reject</span>
                </button>
              </div>

              {/* Action Description Banner */}
              {selectedAction === 'approved' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 mb-4 flex items-start gap-2.5">
                  <FaIcon icon="fa-circle-check" className="text-emerald-600 mt-0.5 shrink-0 text-sm" />
                  <div>
                    <span className="font-extrabold block">Approve Submission</span>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      Validates the participant's 10 KM run proof. The reward status will automatically be set to <strong>Eligible</strong> if currently pending.
                    </p>
                  </div>
                </div>
              )}

              {selectedAction === 'under_review' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-4 flex items-start gap-2.5">
                  <FaIcon icon="fa-triangle-exclamation" className="text-amber-600 mt-0.5 shrink-0 text-sm" />
                  <div>
                    <span className="font-extrabold block">Mark Under Review / Request Changes</span>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Places submission on hold for manual re-check or requesting updated proof from participant.
                    </p>
                  </div>
                </div>
              )}

              {selectedAction === 'rejected' && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 mb-4 flex items-start gap-2.5">
                  <FaIcon icon="fa-ban" className="text-rose-600 mt-0.5 shrink-0 text-sm" />
                  <div>
                    <span className="font-extrabold block">Reject Submission</span>
                    <p className="text-rose-800 text-[11px] mt-0.5">
                      Rejects this entry. You must provide a clear rejection reason below that will be visible to the participant.
                    </p>
                  </div>
                </div>
              )}

              {/* Rejection Reason Textarea (Mandatory if Reject selected) */}
              {selectedAction === 'rejected' && (
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-bold text-rose-800 flex items-center justify-between">
                    <span>Rejection Reason (Visible to Participant) *</span>
                    <span className="text-[10px] text-rose-500 font-normal">Mandatory</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Activity screenshot does not clearly display 10 KM distance or date stamp. Please re-submit with clear GPS map proof..."
                    className="w-full rounded-xl border border-rose-300 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 resize-none shadow-2xs"
                  />
                </div>
              )}

              {/* Internal Admin Note Textarea */}
              <div className="space-y-1.5 mb-5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Internal Admin Notes (Team Only)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Private</span>
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Verified on Strava app; run pace & distance valid..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none shadow-2xs"
                />
              </div>

              {/* Confirm Action Button */}
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus()}
                className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${
                  selectedAction === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : selectedAction === 'under_review'
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {actionLoading ? (
                  <>
                    <FaIcon icon="fa-spinner" className="fa-spin" />
                    Processing Decision...
                  </>
                ) : (
                  <>
                    <FaIcon
                      icon={
                        selectedAction === 'approved'
                          ? 'fa-circle-check'
                          : selectedAction === 'under_review'
                          ? 'fa-clock-rotate-left'
                          : 'fa-circle-xmark'
                      }
                    />
                    {selectedAction === 'approved'
                      ? 'Confirm & Approve Submission'
                      : selectedAction === 'under_review'
                      ? 'Mark as Under Review'
                      : 'Confirm Rejection'}
                  </>
                )}
              </button>
            </div>

            {/* 2. Reward & Voucher Management Box */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                    <FaIcon icon="fa-gift" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Reward &amp; Voucher Status</h2>
                    <p className="text-[11px] text-slate-500">Manage campaign prize distribution</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateReward} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Reward State
                  </label>
                  <select
                    value={rewardStatus}
                    onChange={(e) => setRewardStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs"
                  >
                    <option value="pending">🟡 Pending (Awaiting run verification)</option>
                    <option value="eligible">🟢 Eligible (Qualified for Free Session)</option>
                    <option value="approved">⭐ Approved (Voucher Ready for Participant)</option>
                    <option value="claimed">🎉 Claimed (Session Redeemed / Voucher Used)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Reward Notes / Voucher Reference
                  </label>
                  <input
                    type="text"
                    value={rewardNote}
                    onChange={(e) => setRewardNote(e.target.value)}
                    placeholder="e.g. Voucher Code #UP-RUN10-9428 or Clinic ID"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={rewardActionLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100 font-bold text-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaIcon
                    icon={rewardActionLoading ? 'fa-spinner' : 'fa-floppy-disk'}
                    className={rewardActionLoading ? 'fa-spin' : ''}
                  />
                  {rewardActionLoading ? 'Saving Reward...' : 'Update Reward Status'}
                </button>
              </form>
            </div>

            {/* 3. Reviewer Audit Trail & Metadata Card */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-xs text-xs space-y-2.5 text-slate-600">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <FaIcon icon="fa-clock-rotate-left" className="text-slate-400" />
                Audit Trail &amp; Timestamps
              </h3>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Submission Created:</span>
                <span className="font-bold text-slate-800">
                  {new Date(submission.created_at).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Last Reviewed By:</span>
                <span className="font-bold text-slate-800">
                  {submission.reviewer_name || (submission.reviewed_by ? `Admin #${submission.reviewed_by}` : 'None yet')}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Last Reviewed At:</span>
                <span className="font-bold text-slate-800">
                  {submission.reviewed_at
                    ? new Date(submission.reviewed_at).toLocaleString('en-IN')
                    : 'Not yet reviewed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━ HIGH-RESOLUTION ZOOM MODAL FOR PROOF ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {imageModalOpen && resolvedProofUrl && !isPdf && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls */}
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">Proof Document Inspection</span>
                <span className="text-xs text-slate-400">
                  {submission.full_name} • #{submission.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs"
                  title="Zoom Out"
                >
                  <FaIcon icon="fa-magnifying-glass-minus" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono"
                  title="Reset Zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs"
                  title="Zoom In"
                >
                  <FaIcon icon="fa-magnifying-glass-plus" />
                </button>
                <a
                  href={resolvedProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs"
                  title="Open in New Tab"
                >
                  <FaIcon icon="fa-arrow-up-right-from-square" />
                </a>
                <button
                  type="button"
                  onClick={() => setImageModalOpen(false)}
                  className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs ml-2"
                  title="Close (Esc)"
                >
                  <FaIcon icon="fa-xmark" />
                </button>
              </div>
            </div>

            {/* Scrollable / Zoomable Image Canvas */}
            <div className="w-full max-h-[80vh] overflow-auto rounded-2xl bg-black/60 border border-slate-800 p-4 flex items-center justify-center">
              <img
                src={resolvedProofUrl}
                alt="Run proof high resolution"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg transition-transform duration-150"
              />
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
