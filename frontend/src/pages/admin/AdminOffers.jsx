import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { CmsField, CmsListEditor, CmsPanel } from '../../components/admin/CmsFormKit';
import { admin, uploadCmsImage } from '../../services/api';
import { HEALTHCARE_IMAGES } from '../../utils/healthcareImages';
import { OFFERS_DEFAULTS, mergeOffersSections } from '../../constants/offersDefaults';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import toast from 'react-hot-toast';

const MAIN_TABS = [
  { id: 'submissions', label: 'Submissions & Verification', icon: 'fa-list-check' },
  { id: 'settings', label: 'Campaign CMS & Content Customizer', icon: 'fa-sliders' },
];

const SETTINGS_SUBTABS = [
  { id: 'hero', label: 'Hero & Highlights', icon: 'fa-flag' },
  { id: 'highlights', label: '4-Step Overview', icon: 'fa-cubes' },
  { id: 'how', label: 'How It Works (5 Steps)', icon: 'fa-list-ol' },
  { id: 'benefits', label: 'Why Join Benefits', icon: 'fa-award' },
  { id: 'rules', label: 'Eligibility & Rules', icon: 'fa-scale-balanced' },
  { id: 'form', label: 'Form & Tracker Copy', icon: 'fa-pen-to-square' },
  { id: 'faqs', label: 'FAQs Accordion', icon: 'fa-circle-question' },
  { id: 'final_cta', label: 'Bottom CTA Banner', icon: 'fa-bullhorn' },
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
          sections: mergeOffersSections(d?.sections || {}),
        });
      })
      .catch((err) => toast.error(err.message || 'Could not load campaign settings'))
      .finally(() => setSettingsLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filters.page, filters.status, filters.reward_status]);

  useEffect(() => {
    document.title = 'Offers & Campaign Submissions | The Urban Physio Admin';
    fetchSettings();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, page: 1 }));
    fetchSubmissions();
  };

  const setSetting = (k, v) => setSettingsForm((f) => ({ ...f, [k]: v }));
  const setSection = (k, v) =>
    setSettingsForm((f) => ({ ...f, sections: { ...f.sections, [k]: v } }));

  const handleSaveSettings = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setSavingSettings(true);
    try {
      await admin.updateOffersSettings(settingsForm);
      toast.success('Campaign settings & copy published successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all campaign text & sections to the original default copy? This will overwrite unsaved changes.'
      )
    ) {
      setSettingsForm({
        hero_title: OFFERS_DEFAULTS.hero_title,
        hero_subtitle: OFFERS_DEFAULTS.hero_subtitle,
        hero_image: OFFERS_DEFAULTS.hero_image,
        seo_title: OFFERS_DEFAULTS.seo_title,
        seo_description: OFFERS_DEFAULTS.seo_description,
        sections: { ...OFFERS_DEFAULTS.sections },
      });
      toast.success('Reset to default copy in form. Click "Save & Publish Changes" to apply.');
    }
  };

  const s = settingsForm?.sections || OFFERS_DEFAULTS.sections;
  const stats = submissionsData?.stats || {
    total: 0,
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    rewards_claimed: 0,
  };

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
            <Link
              to="/offers"
              target="_blank"
              className="btn-outline text-sm shrink-0 inline-flex items-center gap-2 bg-white"
            >
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
              className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                active
                  ? 'border-primary-600 text-primary-700 bg-primary-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FaIcon icon={t.icon} />
              {t.label}
              {t.id === 'submissions' && (stats.pending || 0) > 0 && (
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
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total || 0}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Review</p>
              <p className="text-2xl font-extrabold text-amber-900 mt-1">{stats.pending || 0}</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Under Review</p>
              <p className="text-2xl font-extrabold text-sky-900 mt-1">{stats.under_review || 0}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Approved</p>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1">{stats.approved || 0}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Rejected</p>
              <p className="text-2xl font-extrabold text-rose-900 mt-1">{stats.rejected || 0}</p>
            </div>
            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Rewards Claimed</p>
              <p className="text-2xl font-extrabold text-purple-900 mt-1">{stats.rewards_claimed || 0}</p>
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
                          <p className="text-[11px] text-slate-400">
                            {sub.phone} {sub.city ? `• ${sub.city}` : ''}
                          </p>
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
                          <Link
                            to={`/admin/offers/submissions/${sub.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white font-bold text-xs shadow-2xs hover:shadow transition"
                          >
                            <FaIcon icon="fa-magnifying-glass" />
                            Review
                          </Link>
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
                    className="btn-outline text-xs !py-1 !px-2.5 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={filters.page >= submissionsData.total_pages}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    className="btn-outline text-xs !py-1 !px-2.5 disabled:opacity-40 cursor-pointer"
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
                      className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer ${
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
                <div className="space-y-6">
                  <CmsPanel title="Hero Section Header &amp; Copy" icon="fa-flag">
                    <CmsField label="Hero Badge Text" hint="Small pill badge displayed above the main headline">
                      <input
                        type="text"
                        value={s.hero_badge || ''}
                        onChange={(e) => setSection('hero_badge', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Exclusive Fitness & Recovery Campaign"
                      />
                    </CmsField>
                    <CmsField label="Hero Headline (Main Title)">
                      <input
                        type="text"
                        value={settingsForm.hero_title || ''}
                        onChange={(e) => setSetting('hero_title', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Run 10 KM. Get Free Physiotherapy Sessions."
                      />
                    </CmsField>
                    <CmsField label="Hero Subtitle / Description Copy">
                      <textarea
                        rows={3}
                        value={settingsForm.hero_subtitle || ''}
                        onChange={(e) => setSetting('hero_subtitle', e.target.value)}
                        className="input-field min-h-[80px]"
                        placeholder="e.g. Complete your 10 KM run and take a step toward better recovery with free physiotherapy sessions..."
                      />
                    </CmsField>
                    <CmsField label="Hero Visual Banner Image">
                      <MediaUrlOrUpload
                        label="Hero campaign photo"
                        hint="Displayed on the main offer campaign hero card. High-resolution 4:3 landscape image recommended."
                        recommendedSize="1200 × 900 px (4:3 ratio)"
                        aspectRatio="4/3"
                        devicePreview="4:3"
                        accent="primary"
                        icon="fa-image"
                        urlValue={settingsForm.hero_image || ''}
                        onUrlChange={(v) => setSetting('hero_image', v)}
                        onUpload={uploadCmsImage}
                        accept="image/jpeg,image/png,image/webp"
                        maxMb={4}
                        preview="image"
                      />
                    </CmsField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CmsField label="Primary CTA Button Label">
                        <input
                          type="text"
                          value={s.hero_primary_cta_label || ''}
                          onChange={(e) => setSection('hero_primary_cta_label', e.target.value)}
                          className="input-field"
                          placeholder="e.g. Join the Campaign"
                        />
                      </CmsField>
                      <CmsField label="Secondary CTA Button Label">
                        <input
                          type="text"
                          value={s.hero_secondary_cta_label || ''}
                          onChange={(e) => setSection('hero_secondary_cta_label', e.target.value)}
                          className="input-field"
                          placeholder="e.g. Learn How It Works"
                        />
                      </CmsField>
                    </div>
                  </CmsPanel>

                  <CmsPanel title="Hero 3 Quick Stat Highlight Badges" icon="fa-chart-simple">
                    <p className="text-xs text-slate-500 mb-2">
                      Cards shown beneath the hero CTAs highlighting target distance, reward, and process.
                    </p>
                    <CmsListEditor
                      items={s.hero_highlights || []}
                      onChange={(items) => setSection('hero_highlights', items)}
                      addLabel="Add Hero Stat Card"
                      fields={[
                        { key: 'label', label: 'Label (e.g. Target Distance)' },
                        { key: 'value', label: 'Value (e.g. 10 KM)' },
                        { key: 'icon', label: 'FontAwesome Icon (e.g. fa-person-running)' },
                      ]}
                    />
                  </CmsPanel>
                </div>
              )}

              {/* Subtab 2: 4-Step Overview Cards */}
              {settingsSubtab === 'highlights' && (
                <CmsPanel title="4-Card Campaign Overview Section" icon="fa-cubes">
                  <CmsField label="Section Header Title">
                    <input
                      type="text"
                      value={s.highlights_heading || ''}
                      onChange={(e) => setSection('highlights_heading', e.target.value)}
                      className="input-field"
                      placeholder="e.g. Campaign Overview"
                    />
                  </CmsField>
                  <CmsField label="Section Subheading Description">
                    <input
                      type="text"
                      value={s.highlights_subheading || ''}
                      onChange={(e) => setSection('highlights_subheading', e.target.value)}
                      className="input-field"
                      placeholder="e.g. A simple, transparent 4-step campaign designed to reward your active lifestyle..."
                    />
                  </CmsField>
                  <CmsListEditor
                    items={s.highlights_cards || []}
                    onChange={(items) => setSection('highlights_cards', items)}
                    addLabel="Add Overview Step Card"
                    fields={[
                      { key: 'step', label: 'Step Number (e.g. 01)' },
                      { key: 'title', label: 'Card Title (e.g. Run 10 KM)' },
                      { key: 'description', label: 'Card Description', type: 'textarea' },
                      { key: 'icon', label: 'Icon (e.g. fa-person-running)' },
                    ]}
                  />
                </CmsPanel>
              )}

              {/* Subtab 3: How It Works & Steps */}
              {settingsSubtab === 'how' && (
                <CmsPanel title="How It Works Timeline (5 Detailed Progression Steps)" icon="fa-list-ol">
                  <CmsField label="Section Header Title">
                    <input
                      type="text"
                      value={s.how_heading || ''}
                      onChange={(e) => setSection('how_heading', e.target.value)}
                      className="input-field"
                      placeholder="e.g. How It Works"
                    />
                  </CmsField>
                  <CmsField label="Section Subtitle Copy">
                    <input
                      type="text"
                      value={s.how_subheading || ''}
                      onChange={(e) => setSection('how_subheading', e.target.value)}
                      className="input-field"
                      placeholder="e.g. Follow these five steps to participate and redeem your physiotherapy recovery session."
                    />
                  </CmsField>
                  <CmsListEditor
                    items={s.how_steps || []}
                    onChange={(items) => setSection('how_steps', items)}
                    addLabel="Add Progression Step"
                    fields={[
                      { key: 'step', label: 'Step Number (e.g. 01)' },
                      { key: 'title', label: 'Step Title (e.g. Run 10 KM)' },
                      { key: 'summary', label: 'Short Summary Copy' },
                      { key: 'details', label: 'Detailed Clinical Explanation', type: 'textarea' },
                      { key: 'icon', label: 'Icon (e.g. fa-circle-check)' },
                    ]}
                  />
                </CmsPanel>
              )}

              {/* Subtab 4: Benefits */}
              {settingsSubtab === 'benefits' && (
                <CmsPanel title="Campaign Benefits &amp; Clinical Motivation" icon="fa-award">
                  <CmsField label="Benefits Section Heading">
                    <input
                      type="text"
                      value={s.benefits_heading || ''}
                      onChange={(e) => setSection('benefits_heading', e.target.value)}
                      className="input-field"
                      placeholder="e.g. Why Join the Campaign?"
                    />
                  </CmsField>
                  <CmsField label="Benefits Subheading Description">
                    <textarea
                      rows={2}
                      value={s.benefits_subheading || ''}
                      onChange={(e) => setSection('benefits_subheading', e.target.value)}
                      className="input-field min-h-[70px]"
                      placeholder="e.g. Combining fitness motivation with evidence-based physiotherapy recovery..."
                    />
                  </CmsField>
                  <CmsListEditor
                    items={s.benefits || []}
                    onChange={(items) => setSection('benefits', items)}
                    addLabel="Add Benefit Item"
                    fields={[
                      { key: 'title', label: 'Benefit Title (e.g. Professional Physiotherapy Support)' },
                      { key: 'description', label: 'Benefit Description', type: 'textarea' },
                      { key: 'icon', label: 'Icon (e.g. fa-heart-pulse)' },
                    ]}
                  />
                </CmsPanel>
              )}

              {/* Subtab 5: Rules & Rewards */}
              {settingsSubtab === 'rules' && (
                <CmsPanel title="Eligibility, Rules &amp; Reward Configuration" icon="fa-scale-balanced">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CmsField label="Eligibility Section Heading">
                      <input
                        type="text"
                        value={s.eligibility_heading || ''}
                        onChange={(e) => setSection('eligibility_heading', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Eligibility & Campaign Rules"
                      />
                    </CmsField>
                    <CmsField label="Eligibility Section Subheading">
                      <input
                        type="text"
                        value={s.eligibility_subheading || ''}
                        onChange={(e) => setSection('eligibility_subheading', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Please review the participation requirements and verification guidelines."
                      />
                    </CmsField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <CmsField label="Campaign Live Status">
                      <select
                        value={s.campaign_status || 'active'}
                        onChange={(e) => setSection('campaign_status', e.target.value)}
                        className="input-field"
                      >
                        <option value="active">Active (Accepting Submissions)</option>
                        <option value="paused">Paused</option>
                        <option value="ended">Ended</option>
                      </select>
                    </CmsField>
                    <CmsField label="Campaign Start Date">
                      <input
                        type="date"
                        value={s.start_date || ''}
                        onChange={(e) => setSection('start_date', e.target.value)}
                        className="input-field"
                      />
                    </CmsField>
                    <CmsField label="Campaign End Date">
                      <input
                        type="date"
                        value={s.end_date || ''}
                        onChange={(e) => setSection('end_date', e.target.value)}
                        className="input-field"
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
                        className="input-field"
                        placeholder="10.0"
                      />
                    </CmsField>
                    <CmsField label="Reward Validity Window (Days)">
                      <input
                        type="number"
                        value={s.reward_validity_days || '60'}
                        onChange={(e) => setSection('reward_validity_days', e.target.value)}
                        className="input-field"
                        placeholder="60"
                      />
                    </CmsField>
                  </div>

                  <CmsField label="Reward Title / Description">
                    <input
                      type="text"
                      value={s.reward_details || ''}
                      onChange={(e) => setSection('reward_details', e.target.value)}
                      className="input-field"
                      placeholder="e.g. 1 Complimentary Clinical Physiotherapy Assessment & Recovery Session"
                    />
                  </CmsField>

                  <CmsField label="Accepted Proof Types Description">
                    <input
                      type="text"
                      value={s.accepted_proof_types || ''}
                      onChange={(e) => setSection('accepted_proof_types', e.target.value)}
                      className="input-field"
                      placeholder="e.g. Strava, Nike Run Club, Garmin, Apple Health, Samsung Health, or GPS running watch export (JPG, PNG, WebP, PDF)"
                    />
                  </CmsField>

                  <CmsPanel title="Campaign Conditions &amp; Rules Checklist" icon="fa-list-check">
                    <CmsListEditor
                      items={s.rules || []}
                      onChange={(items) => setSection('rules', items)}
                      addLabel="Add Rule Condition"
                      fields={[{ key: 'value', label: 'Rule condition statement' }]}
                    />
                  </CmsPanel>

                  <CmsField label="Terms &amp; Disclaimer Text">
                    <textarea
                      rows={3}
                      value={s.terms_text || ''}
                      onChange={(e) => setSection('terms_text', e.target.value)}
                      className="input-field min-h-[80px]"
                      placeholder="e.g. The Urban Physio reserves the right to verify activity logs..."
                    />
                  </CmsField>
                </CmsPanel>
              )}

              {/* Subtab 6: Form & Tracker Copy */}
              {settingsSubtab === 'form' && (
                <div className="space-y-6">
                  <CmsPanel title="Submission Form Copy &amp; Instructions" icon="fa-pen-to-square">
                    <CmsField label="Form Section Badge">
                      <input
                        type="text"
                        value={s.form_badge || ''}
                        onChange={(e) => setSection('form_badge', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Participation Desk"
                      />
                    </CmsField>
                    <CmsField label="Form Section Heading">
                      <input
                        type="text"
                        value={s.form_heading || ''}
                        onChange={(e) => setSection('form_heading', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Submit Your 10 KM Run Proof"
                      />
                    </CmsField>
                    <CmsField label="Form Subtitle / Instructions">
                      <textarea
                        rows={2}
                        value={s.form_subheading || ''}
                        onChange={(e) => setSection('form_subheading', e.target.value)}
                        className="input-field min-h-[70px]"
                        placeholder="e.g. Fill in your activity details and upload your run proof for verification..."
                      />
                    </CmsField>
                    <CmsField label="Consent Checkbox Confirmation Copy">
                      <textarea
                        rows={2}
                        value={s.form_consent_text || ''}
                        onChange={(e) => setSection('form_consent_text', e.target.value)}
                        className="input-field min-h-[70px]"
                        placeholder="e.g. I confirm that I have completed the 10 KM run, the uploaded activity details are authentic..."
                      />
                    </CmsField>
                    <CmsField label="Success Receipt Message">
                      <textarea
                        rows={2}
                        value={s.form_success_message || ''}
                        onChange={(e) => setSection('form_success_message', e.target.value)}
                        className="input-field min-h-[70px]"
                        placeholder="e.g. Your 10 KM campaign submission has been received and is currently under review..."
                      />
                    </CmsField>
                  </CmsPanel>

                  <CmsPanel title="Live Status Tracker Copy" icon="fa-magnifying-glass">
                    <CmsField label="Status Tracker Heading">
                      <input
                        type="text"
                        value={s.status_heading || ''}
                        onChange={(e) => setSection('status_heading', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Check Live Submission Status"
                      />
                    </CmsField>
                    <CmsField label="Status Tracker Subtitle">
                      <input
                        type="text"
                        value={s.status_subheading || ''}
                        onChange={(e) => setSection('status_subheading', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Already submitted? Check your verification and reward status in real time."
                      />
                    </CmsField>
                    <CmsField label="Search Box Placeholder">
                      <input
                        type="text"
                        value={s.status_search_placeholder || ''}
                        onChange={(e) => setSection('status_search_placeholder', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Enter Submission ID, Email, or Phone number"
                      />
                    </CmsField>
                  </CmsPanel>
                </div>
              )}

              {/* Subtab 7: FAQs */}
              {settingsSubtab === 'faqs' && (
                <CmsPanel title="Frequently Asked Questions (Accordion)" icon="fa-circle-question">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CmsField label="FAQ Badge Text">
                      <input
                        type="text"
                        value={s.faqs_badge || ''}
                        onChange={(e) => setSection('faqs_badge', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Got Questions?"
                      />
                    </CmsField>
                    <CmsField label="FAQ Section Heading">
                      <input
                        type="text"
                        value={s.faqs_heading || ''}
                        onChange={(e) => setSection('faqs_heading', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Frequently Asked Questions"
                      />
                    </CmsField>
                  </div>
                  <CmsField label="FAQ Section Subheading">
                    <input
                      type="text"
                      value={s.faqs_subheading || ''}
                      onChange={(e) => setSection('faqs_subheading', e.target.value)}
                      className="input-field"
                      placeholder="e.g. Everything you need to know about participation, verification, and claiming your reward."
                    />
                  </CmsField>
                  <CmsListEditor
                    items={s.faqs || []}
                    onChange={(items) => setSection('faqs', items)}
                    addLabel="Add FAQ Item"
                    fields={[
                      { key: 'q', label: 'Question' },
                      { key: 'a', label: 'Answer', type: 'textarea' },
                    ]}
                  />
                </CmsPanel>
              )}

              {/* Subtab 8: Bottom Final CTA */}
              {settingsSubtab === 'final_cta' && (
                <CmsPanel title="Bottom Call to Action Banner" icon="fa-bullhorn">
                  <CmsField label="CTA Headline">
                    <input
                      type="text"
                      value={s.final_heading || ''}
                      onChange={(e) => setSection('final_heading', e.target.value)}
                      className="input-field"
                      placeholder="e.g. Ready to Run 10 KM?"
                    />
                  </CmsField>
                  <CmsField label="CTA Subtitle / Description">
                    <textarea
                      rows={2}
                      value={s.final_subheading || ''}
                      onChange={(e) => setSection('final_subheading', e.target.value)}
                      className="input-field min-h-[70px]"
                      placeholder="e.g. Complete your run, submit your proof, and take the next step toward better recovery..."
                    />
                  </CmsField>
                  <CmsField label="CTA Button Label">
                    <input
                      type="text"
                      value={s.final_primary_cta_label || ''}
                      onChange={(e) => setSection('final_primary_cta_label', e.target.value)}
                      className="input-field"
                      placeholder="e.g. Join the Campaign"
                    />
                  </CmsField>
                </CmsPanel>
              )}

              {/* Subtab 9: Section Visibility */}
              {settingsSubtab === 'visibility' && (
                <CmsPanel title="Section Visibility Toggles" icon="fa-eye">
                  <p className="text-xs text-slate-500 mb-2">
                    Enable or disable any section from being rendered on the live public page.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(s.sections_visibility || {}).map(([key, val]) => (
                      <label
                        key={key}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          {key.replace(/_/g, ' ')}
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

              {/* Subtab 10: SEO */}
              {settingsSubtab === 'seo' && (
                <CmsPanel title="SEO &amp; Social Metadata" icon="fa-magnifying-glass-chart">
                  <CmsField label="Page Meta Title">
                    <input
                      type="text"
                      value={settingsForm.seo_title || ''}
                      onChange={(e) => setSetting('seo_title', e.target.value)}
                      className="input-field"
                      placeholder="e.g. Run 10 KM & Get Free Physiotherapy Sessions | The Urban Physio"
                    />
                  </CmsField>
                  <CmsField label="Page Meta Description">
                    <textarea
                      rows={3}
                      value={settingsForm.seo_description || ''}
                      onChange={(e) => setSetting('seo_description', e.target.value)}
                      className="input-field min-h-[90px]"
                      placeholder="e.g. Run 10 KM, submit your run proof and get a chance to receive free physiotherapy sessions..."
                    />
                  </CmsField>
                </CmsPanel>
              )}

              {/* Save & Reset Floating Bar */}
              <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl">
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="btn-outline text-xs !py-2.5 !px-4 text-slate-600 hover:text-rose-600 cursor-pointer"
                >
                  <FaIcon icon="fa-rotate-left" />
                  Reset to Default Template
                </button>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-primary text-sm font-bold !py-3 !px-8 shadow-md cursor-pointer"
                >
                  {savingSettings ? (
                    <>
                      <FaIcon icon="fa-spinner" className="fa-spin" />
                      Publishing Changes...
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

    </AdminDashboardLayout>
  );
}
