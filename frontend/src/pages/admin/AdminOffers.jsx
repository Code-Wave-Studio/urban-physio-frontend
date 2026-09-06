import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { CmsField, CmsListEditor, CmsPanel } from '../../components/admin/CmsFormKit';
import { admin, uploadCmsImage } from '../../services/api';
import { OFFERS_DEFAULTS } from '../../constants/offersDefaults';
import toast from 'react-hot-toast';

const MAIN_TABS = [
  { id: 'submissions', label: 'Submissions & Verification', icon: 'fa-list-check' },
  { id: 'settings', label: 'Campaign CMS Settings', icon: 'fa-sliders' },
];

const SETTINGS_SUBTABS = [
  { id: 'hero', label: 'Hero & Highlights', icon: 'fa-flag' },
  { id: 'how', label: 'How It Works & Steps', icon: 'fa-list-ol' },
  { id: 'benefits', label: 'Benefits', icon: 'fa-award' },
  { id: 'rules', label: 'Rules & Rewards', icon: 'fa-scale-balanced' },
  { id: 'faqs', label: 'FAQs & Terms', icon: 'fa-circle-question' },
  { id: 'visibility', label: 'Section Visibility', icon: 'fa-eye' },
  { id: 'seo', label: 'SEO Settings', icon: 'fa-magnifying-glass-chart' },
];

export default function AdminOffers() {
  const [mainTab, setMainTab] = useState('submissions');
  const [settingsSubtab, setSettingsSubtab] = useState('hero');

  // Submissions State
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [submissionsData, setSubmissionsData] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
    stats: {
      total: 0,
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      rewards_claimed: 0,
    },
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    reward_status: 'all',
    page: 1,
  });

  // Review Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rewardStatusSelect, setRewardStatusSelect] = useState('pending');

  // Settings State
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_image: '',
    seo_title: '',
    seo_description: '',
    sections: { ...OFFERS_DEFAULTS.sections },
  });

  // Load Submissions
  const fetchSubmissions = () => {
    setSubmissionsLoading(true);
    admin
      .offersSubmissions(filters)
      .then((res) => {
        const d = res.data ?? res;
        setSubmissionsData({
          items: d.items || [],
          total: d.total || 0,
          page: d.page || 1,
          limit: d.limit || 20,
          total_pages: d.total_pages || 1,
          stats: d.stats || {
            total: 0,
            pending: 0,
            under_review: 0,
            approved: 0,
            rejected: 0,
            rewards_claimed: 0,
          },
        });
      })
      .catch((err) => toast.error(err.message || 'Could not load campaign submissions'))
      .finally(() => setSubmissionsLoading(false));
  };

  // Load Settings
  const fetchSettings = () => {
    setSettingsLoading(true);
    admin
      .offersSettings()
      .then((res) => {
        const d = res.data ?? res;
        setSettingsForm({
          hero_title: d.hero_title || '',
          hero_subtitle: d.hero_subtitle || '',
          hero_image: d.hero_image || '',
          seo_title: d.seo_title || '',
          seo_description: d.seo_description || '',
          sections: { ...OFFERS_DEFAULTS.sections, ...(d.sections || {}) },
        });
      })
      .catch((err) => toast.error(err.message || 'Could not load campaign settings'))
      .finally(() => setSettingsLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filters.page, filters.status, filters.reward_status]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, page: 1 }));
    fetchSubmissions();
  };

  const handleOpenReview = (sub) => {
    setSelectedSubmission(sub);
    setReviewNote(sub.admin_notes || '');
    setRejectionReason(sub.rejection_reason || '');
    setRewardStatusSelect(sub.reward_status || 'pending');
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedSubmission) return;
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast.error('Please enter a rejection reason for the participant');
      return;
    }

    setReviewActionLoading(true);
    try {
      await admin.updateOffersSubmissionStatus(selectedSubmission.id, {
        status,
        rejection_reason: status === 'rejected' ? rejectionReason.trim() : '',
        admin_notes: reviewNote.trim(),
        reward_status: rewardStatusSelect,
      });
      toast.success(`Submission status marked as ${status.replace('_', ' ')}`);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (err) {
      toast.error(err.message || 'Failed to update submission status');
    } finally {
      setReviewActionLoading(false);
    }
  };

  const handleUpdateRewardStatus = async () => {
    if (!selectedSubmission) return;
    setReviewActionLoading(true);
    try {
      await admin.updateOffersRewardStatus(selectedSubmission.id, {
        reward_status: rewardStatusSelect,
        reward_notes: reviewNote.trim(),
      });
      toast.success('Reward status updated successfully');
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (err) {
      toast.error(err.message || 'Failed to update reward status');
    } finally {
      setReviewActionLoading(false);
    }
  };

  const setSetting = (k, v) => setSettingsForm((f) => ({ ...f, [k]: v }));
  const setSection = (k, v) =>
    setSettingsForm((f) => ({ ...f, sections: { ...f.sections, [k]: v } }));

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await admin.updateOffersSettings(settingsForm);
      toast.success('Campaign settings published successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const s = settingsForm.sections;
  const stats = submissionsData.stats;

  const statusBadge = (st) => {
    switch (st) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'under_review':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-300';
    }
  };

  const rewardBadge = (rw) => {
    switch (rw) {
      case 'claimed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'approved':
      case 'eligible':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  return (
    <AdminDashboardLayout>
      {/* Top Banner */}
      <div className="rounded-3xl border border-primary-200/80 bg-gradient-to-br from-primary-50 via-white to-orange-50/50 p-5 sm:p-7 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-100/80 px-2.5 py-0.5 rounded-md">
                Campaign &amp; Offers
              </span>
              <span className="text-xs text-slate-500 font-semibold">CRF-2026-0006</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Run 10 KM &amp; Get Free Physiotherapy
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review and verify participant submissions, manage rewards, and customize landing page copy.{' '}
              <Link to="/offers" target="_blank" className="text-primary-600 font-semibold hover:underline">
                /offers <FaIcon icon="fa-arrow-up-right-from-square" className="text-xs" />
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/offers" target="_blank" className="btn-outline text-sm shrink-0 inline-flex items-center gap-2">
              <FaIcon icon="fa-eye" />
              View Live Page
            </Link>
          </div>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-3">
        {MAIN_TABS.map((t) => {
          const active = mainTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setMainTab(t.id)}
              className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                active
                  ? 'border-primary-600 text-primary-700 bg-primary-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FaIcon icon={t.icon} />
              {t.label}
              {t.id === 'submissions' && stats.pending > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                  {stats.pending} pending
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: SUBMISSIONS & VERIFICATION ───────────────────────────────── */}
      {mainTab === 'submissions' && (
        <div className="space-y-6">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entries</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Review</p>
              <p className="text-2xl font-extrabold text-amber-900 mt-1">{stats.pending}</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Under Review</p>
              <p className="text-2xl font-extrabold text-sky-900 mt-1">{stats.under_review}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Approved</p>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1">{stats.approved}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Rejected</p>
              <p className="text-2xl font-extrabold text-rose-900 mt-1">{stats.rejected}</p>
            </div>
            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Rewards Claimed</p>
              <p className="text-2xl font-extrabold text-purple-900 mt-1">{stats.rewards_claimed}</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <FaIcon
                  icon="fa-magnifying-glass"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search participant name, email, phone, or ID..."
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
              <button type="submit" className="btn-primary text-xs !py-2 !px-3.5 shrink-0">
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500">Status:</span>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Reward Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500">Reward:</span>
                <select
                  value={filters.reward_status}
                  onChange={(e) => setFilters({ ...filters, reward_status: e.target.value, page: 1 })}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                >
                  <option value="all">All Rewards</option>
                  <option value="pending">Pending</option>
                  <option value="eligible">Eligible</option>
                  <option value="approved">Approved</option>
                  <option value="claimed">Claimed</option>
                </select>
              </div>

              <button
                type="button"
                onClick={fetchSubmissions}
                className="btn-outline text-xs !py-1.5 !px-3"
                title="Refresh submissions"
              >
                <FaIcon icon="fa-arrows-rotate" />
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {submissionsLoading ? (
              <div className="p-12 text-center text-slate-500">
                <FaIcon icon="fa-spinner" className="fa-spin text-2xl mb-2 text-primary-600" />
                <p className="text-sm">Loading campaign submissions...</p>
              </div>
            ) : submissionsData.items.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <FaIcon icon="fa-inbox" className="text-3xl mb-2 text-slate-300" />
                <p className="text-base font-bold text-slate-700">No submissions found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Ref / ID</th>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">Run Date</th>
                      <th className="py-3 px-4">Distance</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4">Reward Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissionsData.items.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          #{sub.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{sub.full_name}</p>
                          <p className="text-[11px] text-slate-500">{sub.email}</p>
                          <p className="text-[11px] text-slate-400">{sub.phone} {sub.city ? `• ${sub.city}` : ''}</p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{sub.run_date}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900">{sub.distance_km} KM</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge(
                              sub.status
                            )}`}
                          >
                            {sub.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${rewardBadge(
                              sub.reward_status
                            )}`}
                          >
                            {sub.reward_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(sub)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold text-xs transition"
                          >
                            <FaIcon icon="fa-magnifying-glass" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Bar */}
            {submissionsData.total_pages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing page {submissionsData.page} of {submissionsData.total_pages} ({submissionsData.total} total)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={filters.page <= 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    className="btn-outline text-xs !py-1 !px-2.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={filters.page >= submissionsData.total_pages}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    className="btn-outline text-xs !py-1 !px-2.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: CAMPAIGN CMS SETTINGS ────────────────────────────────────── */}
      {mainTab === 'settings' && (
        <div>
          {settingsLoading ? (
            <div className="glass-card p-12 text-center text-slate-500">
              <FaIcon icon="fa-spinner" className="fa-spin text-2xl mb-2 text-primary-600" />
              Loading campaign settings...
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Settings Sub-navigation Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                {SETTINGS_SUBTABS.map((sub) => {
                  const active = settingsSubtab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSettingsSubtab(sub.id)}
                      className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold border transition ${
                        active
                          ? 'bg-primary-700 text-white border-primary-700 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                      }`}
                    >
                      <FaIcon icon={sub.icon} />
                      {sub.label}
                    </button>
                  );
                })}
              </div>

              {/* Subtab 1: Hero & Highlights */}
              {settingsSubtab === 'hero' && (
                <CmsPanel title="Hero Section & Highlights" icon="fa-flag">
                  <div className="space-y-4">
                    <CmsField label="Hero Badge Text">
                      <input
                        type="text"
                        value={s.hero_badge || ''}
                        onChange={(e) => setSection('hero_badge', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>
                    <CmsField label="Hero Headline">
                      <input
                        type="text"
                        value={settingsForm.hero_title || ''}
                        onChange={(e) => setSetting('hero_title', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>
                    <CmsField label="Hero Subtitle / Description">
                      <textarea
                        rows={3}
                        value={settingsForm.hero_subtitle || ''}
                        onChange={(e) => setSetting('hero_subtitle', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>
                    <CmsField label="Hero Image">
                      <MediaUrlOrUpload
                        value={settingsForm.hero_image || ''}
                        onChange={(v) => setSetting('hero_image', v)}
                        uploadFn={uploadCmsImage}
                        presetImages={HEALTHCARE_IMAGES}
                        label="Hero visual image"
                      />
                    </CmsField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CmsField label="Primary CTA Label">
                        <input
                          type="text"
                          value={s.hero_primary_cta_label || ''}
                          onChange={(e) => setSection('hero_primary_cta_label', e.target.value)}
                          className="input-base"
                        />
                      </CmsField>
                      <CmsField label="Secondary CTA Label">
                        <input
                          type="text"
                          value={s.hero_secondary_cta_label || ''}
                          onChange={(e) => setSection('hero_secondary_cta_label', e.target.value)}
                          className="input-base"
                        />
                      </CmsField>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                        Hero Quick Stat Cards
                      </h4>
                      <CmsListEditor
                        items={s.hero_highlights || []}
                        onChange={(items) => setSection('hero_highlights', items)}
                        itemTemplate={{ label: '', value: '', icon: 'fa-check' }}
                        renderItem={(item, onChange) => (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => onChange({ ...item, label: e.target.value })}
                              placeholder="Label"
                              className="input-base text-xs"
                            />
                            <input
                              type="text"
                              value={item.value}
                              onChange={(e) => onChange({ ...item, value: e.target.value })}
                              placeholder="Value"
                              className="input-base text-xs"
                            />
                            <input
                              type="text"
                              value={item.icon}
                              onChange={(e) => onChange({ ...item, icon: e.target.value })}
                              placeholder="FontAwesome Icon"
                              className="input-base text-xs"
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </CmsPanel>
              )}

              {/* Subtab 2: How It Works & Steps */}
              {settingsSubtab === 'how' && (
                <CmsPanel title="How It Works Timeline" icon="fa-list-ol">
                  <div className="space-y-4">
                    <CmsField label="Section Heading">
                      <input
                        type="text"
                        value={s.how_heading || ''}
                        onChange={(e) => setSection('how_heading', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>
                    <CmsField label="Section Subtitle">
                      <input
                        type="text"
                        value={s.how_subheading || ''}
                        onChange={(e) => setSection('how_subheading', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pt-3">
                      Step Progression (5 Steps)
                    </h4>
                    <CmsListEditor
                      items={s.how_steps || []}
                      onChange={(items) => setSection('how_steps', items)}
                      itemTemplate={{ step: '01', title: '', summary: '', details: '', icon: 'fa-check' }}
                      renderItem={(step, onChange) => (
                        <div className="space-y-2 flex-1">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={step.step}
                              onChange={(e) => onChange({ ...step, step: e.target.value })}
                              placeholder="Step #"
                              className="input-base text-xs"
                            />
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => onChange({ ...step, title: e.target.value })}
                              placeholder="Step Title"
                              className="input-base text-xs sm:col-span-2"
                            />
                          </div>
                          <input
                            type="text"
                            value={step.summary}
                            onChange={(e) => onChange({ ...step, summary: e.target.value })}
                            placeholder="Short summary copy"
                            className="input-base text-xs"
                          />
                          <textarea
                            rows={2}
                            value={step.details}
                            onChange={(e) => onChange({ ...step, details: e.target.value })}
                            placeholder="Detailed explanation"
                            className="input-base text-xs"
                          />
                        </div>
                      )}
                    />
                  </div>
                </CmsPanel>
              )}

              {/* Subtab 3: Benefits */}
              {settingsSubtab === 'benefits' && (
                <CmsPanel title="Campaign Benefits" icon="fa-award">
                  <div className="space-y-4">
                    <CmsField label="Benefits Heading">
                      <input
                        type="text"
                        value={s.benefits_heading || ''}
                        onChange={(e) => setSection('benefits_heading', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>
                    <CmsField label="Benefits Subheading">
                      <textarea
                        rows={2}
                        value={s.benefits_subheading || ''}
                        onChange={(e) => setSection('benefits_subheading', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pt-3">
                      Benefits List
                    </h4>
                    <CmsListEditor
                      items={s.benefits || []}
                      onChange={(items) => setSection('benefits', items)}
                      itemTemplate={{ title: '', description: '', icon: 'fa-heart-pulse' }}
                      renderItem={(b, onChange) => (
                        <div className="space-y-2 flex-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={b.title}
                              onChange={(e) => onChange({ ...b, title: e.target.value })}
                              placeholder="Benefit Title"
                              className="input-base text-xs"
                            />
                            <input
                              type="text"
                              value={b.icon}
                              onChange={(e) => onChange({ ...b, icon: e.target.value })}
                              placeholder="Icon (e.g. fa-user-doctor)"
                              className="input-base text-xs"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={b.description}
                            onChange={(e) => onChange({ ...b, description: e.target.value })}
                            placeholder="Benefit Description"
                            className="input-base text-xs"
                          />
                        </div>
                      )}
                    />
                  </div>
                </CmsPanel>
              )}

              {/* Subtab 4: Rules & Rewards */}
              {settingsSubtab === 'rules' && (
                <CmsPanel title="Eligibility, Rules &amp; Reward Configuration" icon="fa-scale-balanced">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <CmsField label="Campaign Status">
                        <select
                          value={s.campaign_status || 'active'}
                          onChange={(e) => setSection('campaign_status', e.target.value)}
                          className="input-base"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="ended">Ended</option>
                        </select>
                      </CmsField>
                      <CmsField label="Start Date">
                        <input
                          type="date"
                          value={s.start_date || ''}
                          onChange={(e) => setSection('start_date', e.target.value)}
                          className="input-base"
                        />
                      </CmsField>
                      <CmsField label="End Date">
                        <input
                          type="date"
                          value={s.end_date || ''}
                          onChange={(e) => setSection('end_date', e.target.value)}
                          className="input-base"
                        />
                      </CmsField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CmsField label="Required Distance (KM)">
                        <input
                          type="number"
                          step="0.1"
                          value={s.required_distance_km || '10.0'}
                          onChange={(e) => setSection('required_distance_km', e.target.value)}
                          className="input-base"
                        />
                      </CmsField>
                      <CmsField label="Reward Validity (Days)">
                        <input
                          type="number"
                          value={s.reward_validity_days || '60'}
                          onChange={(e) => setSection('reward_validity_days', e.target.value)}
                          className="input-base"
                        />
                      </CmsField>
                    </div>

                    <CmsField label="Reward Title / Description">
                      <input
                        type="text"
                        value={s.reward_details || ''}
                        onChange={(e) => setSection('reward_details', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>

                    <CmsField label="Accepted Proof Types Description">
                      <input
                        type="text"
                        value={s.accepted_proof_types || ''}
                        onChange={(e) => setSection('accepted_proof_types', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pt-3">
                      Rules Checklist
                    </h4>
                    <CmsListEditor
                      items={s.rules || []}
                      onChange={(items) => setSection('rules', items)}
                      itemTemplate=""
                      renderItem={(rule, onChange) => (
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => onChange(e.target.value)}
                          placeholder="Rule description..."
                          className="input-base text-xs flex-1"
                        />
                      )}
                    />

                    <CmsField label="Terms &amp; Disclaimer Text">
                      <textarea
                        rows={2}
                        value={s.terms_text || ''}
                        onChange={(e) => setSection('terms_text', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>
                  </div>
                </CmsPanel>
              )}

              {/* Subtab 5: FAQs */}
              {settingsSubtab === 'faqs' && (
                <CmsPanel title="Frequently Asked Questions" icon="fa-circle-question">
                  <CmsListEditor
                    items={s.faqs || []}
                    onChange={(items) => setSection('faqs', items)}
                    itemTemplate={{ q: '', a: '' }}
                    renderItem={(faq, onChange) => (
                      <div className="space-y-2 flex-1">
                        <input
                          type="text"
                          value={faq.q}
                          onChange={(e) => onChange({ ...faq, q: e.target.value })}
                          placeholder="Question"
                          className="input-base text-xs font-bold"
                        />
                        <textarea
                          rows={2}
                          value={faq.a}
                          onChange={(e) => onChange({ ...faq, a: e.target.value })}
                          placeholder="Answer"
                          className="input-base text-xs"
                        />
                      </div>
                    )}
                  />
                </CmsPanel>
              )}

              {/* Subtab 6: Section Visibility */}
              {settingsSubtab === 'visibility' && (
                <CmsPanel title="Section Visibility Toggles" icon="fa-eye">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(s.sections_visibility || {}).map(([key, val]) => (
                      <label
                        key={key}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          {key.replace('_', ' ')}
                        </span>
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) =>
                            setSection('sections_visibility', {
                              ...s.sections_visibility,
                              [key]: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    ))}
                  </div>
                </CmsPanel>
              )}

              {/* Subtab 7: SEO */}
              {settingsSubtab === 'seo' && (
                <CmsPanel title="SEO &amp; Social Metadata" icon="fa-magnifying-glass-chart">
                  <div className="space-y-4">
                    <CmsField label="Page Meta Title">
                      <input
                        type="text"
                        value={settingsForm.seo_title || ''}
                        onChange={(e) => setSetting('seo_title', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>
                    <CmsField label="Page Meta Description">
                      <textarea
                        rows={3}
                        value={settingsForm.seo_description || ''}
                        onChange={(e) => setSetting('seo_description', e.target.value)}
                        className="input-base"
                      />
                    </CmsField>
                  </div>
                </CmsPanel>
              )}

              {/* Save Bar */}
              <div className="sticky bottom-4 z-20 flex justify-end p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-primary text-sm font-bold !py-2.5 !px-6 shadow-md"
                >
                  {savingSettings ? (
                    <>
                      <FaIcon icon="fa-spinner" className="fa-spin" />
                      Saving Settings...
                    </>
                  ) : (
                    <>
                      <FaIcon icon="fa-floppy-disk" />
                      Save &amp; Publish Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ─── SUBMISSION REVIEW MODAL ─────────────────────────────────────────── */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-fade-in space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Submission Details
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedSubmission.full_name} (#{selectedSubmission.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm"
              >
                <FaIcon icon="fa-xmark" />
              </button>
            </div>

            {/* Participant Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Email</span>
                <a href={`mailto:${selectedSubmission.email}`} className="font-bold text-primary-600 hover:underline">
                  {selectedSubmission.email}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Phone</span>
                <a href={`tel:${selectedSubmission.phone}`} className="font-bold text-slate-800">
                  {selectedSubmission.phone}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">City</span>
                <span className="font-bold text-slate-800">{selectedSubmission.city || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Run Date</span>
                <span className="font-bold text-slate-800">{selectedSubmission.run_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Distance</span>
                <span className="font-bold text-emerald-700">{selectedSubmission.distance_km} KM</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Submitted On</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedSubmission.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Notes if provided */}
            {selectedSubmission.notes && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold block mb-1">Participant Notes:</span>
                <p className="text-slate-700">{selectedSubmission.notes}</p>
              </div>
            )}

            {/* Proof Attachment */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                Uploaded Proof Document / Screenshot
              </span>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-center">
                {selectedSubmission.proof_file_mime?.includes('pdf') ||
                selectedSubmission.proof_file_name?.endsWith('.pdf') ? (
                  <div className="py-4">
                    <FaIcon icon="fa-file-pdf" className="text-4xl text-rose-500 mb-2" />
                    <p className="text-xs font-bold text-slate-700 mb-2">{selectedSubmission.proof_file_name}</p>
                    <a
                      href={selectedSubmission.proof_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs inline-flex items-center gap-2"
                    >
                      <FaIcon icon="fa-arrow-up-right-from-square" />
                      Open PDF in New Window
                    </a>
                  </div>
                ) : (
                  <div>
                    <img
                      src={selectedSubmission.proof_file_url}
                      alt="Run proof screenshot"
                      className="max-h-72 mx-auto rounded-xl border border-slate-200 object-contain shadow-xs"
                    />
                    <div className="mt-2">
                      <a
                        href={selectedSubmission.proof_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary-600 hover:underline inline-flex items-center gap-1.5"
                      >
                        <FaIcon icon="fa-arrow-up-right-from-square" />
                        View Full Resolution Image
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Status Updates */}
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Update Verification Decision
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Reward Status
                  </label>
                  <select
                    value={rewardStatusSelect}
                    onChange={(e) => setRewardStatusSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="eligible">Eligible</option>
                    <option value="approved">Approved</option>
                    <option value="claimed">Claimed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Internal Admin Notes
                  </label>
                  <input
                    type="text"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="e.g. Strava link verified, distance confirmed."
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              {/* Rejection reason box if rejecting */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Rejection Reason (Visible to participant if rejected)
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Screenshot does not show completed distance or date."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={reviewActionLoading}
                    onClick={() => handleUpdateStatus('approved')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    <FaIcon icon="fa-check" />
                    Approve Submission
                  </button>
                  <button
                    type="button"
                    disabled={reviewActionLoading}
                    onClick={() => handleUpdateStatus('under_review')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition"
                  >
                    <FaIcon icon="fa-clock" />
                    Under Review
                  </button>
                  <button
                    type="button"
                    disabled={reviewActionLoading}
                    onClick={() => handleUpdateStatus('rejected')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    <FaIcon icon="fa-xmark" />
                    Reject
                  </button>
                </div>

                <button
                  type="button"
                  disabled={reviewActionLoading}
                  onClick={handleUpdateRewardStatus}
                  className="btn-outline text-xs !py-2 !px-3"
                >
                  Save Reward Status Only
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
