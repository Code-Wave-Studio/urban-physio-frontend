import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { CmsField, CmsPanel } from '../../components/admin/CmsFormKit';
import { admin, uploadCmsImage } from '../../services/api';
import { unwrapApiData } from '../../utils/contactText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  ORG_LOGOS_COPY,
  ORG_LOGOS_MAX_ITEMS,
  blankOrgLogo,
  isOrgLogoComplete,
} from '../../constants/orgLogosDefaults';
import toast from 'react-hot-toast';

export default function AdminOrgLogos() {
  const [enabled, setEnabled] = useState(true);
  const [heading, setHeading] = useState(ORG_LOGOS_COPY.heading);
  const [highlight, setHighlight] = useState(ORG_LOGOS_COPY.heading_highlight);
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    admin
      .orgLogosSettings()
      .then((res) => {
        const d = unwrapApiData(res);
        setEnabled(d.is_enabled !== false);
        setHeading(d.heading || ORG_LOGOS_COPY.heading);
        setHighlight(d.heading_highlight || '');
        const next = Array.isArray(d.items) ? d.items : [];
        setItems(next);
        if (next[0]?.id) setOpenId(next[0].id);
      })
      .catch((e) => toast.error(e.message || 'Could not load organisation logos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setItem = (index, key, value) => {
    setItems((list) => list.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  };

  const addItem = () => {
    if (items.length >= ORG_LOGOS_MAX_ITEMS) {
      toast.error(`Maximum ${ORG_LOGOS_MAX_ITEMS} logos`);
      return;
    }
    const next = blankOrgLogo(items.length);
    setItems((list) => [...list, next]);
    setOpenId(next.id);
  };

  const removeItem = (index) => {
    setItems((list) => list.filter((_, i) => i !== index).map((it, i) => ({ ...it, sort_order: i })));
  };

  const moveItem = (index, dir) => {
    setItems((list) => {
      const next = [...list];
      const j = index + dir;
      if (j < 0 || j >= next.length) return list;
      [next[index], next[j]] = [next[j], next[index]];
      return next.map((it, i) => ({ ...it, sort_order: i }));
    });
  };

  const readyCount = items.filter(isOrgLogoComplete).length;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.updateOrgLogosSettings({
        is_enabled: enabled,
        heading,
        heading_highlight: highlight,
        items: items.map((it, i) => ({ ...it, sort_order: i })),
      });
      toast.success('Organisation logos published on Home Physiotherapy and TelePhysio');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-3xl border border-orange-200/60 bg-gradient-to-br from-orange-50 via-white to-primary-50/80 p-5 sm:p-7 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-1">Website CMS</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Organisation logos</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            One shared “trusted by” strip for{' '}
            <Link to="/home-physiotherapy" target="_blank" className="text-primary-700 font-semibold hover:underline">
              Home Physiotherapy
            </Link>{' '}
            and{' '}
            <Link to="/telephysio" target="_blank" className="text-teal-700 font-semibold hover:underline">
              TelePhysio by Myoreset
            </Link>
            . Heading and logos update on both pages automatically.
          </p>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center text-slate-500">
            <FaIcon icon="fa-spinner" className="fa-spin text-2xl mb-2" />
            Loading logos…
          </div>
        ) : (
          <form onSubmit={save} className="space-y-5">
            <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-slate-200 bg-white/70 p-4">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                checked={enabled}
                onChange={(ev) => setEnabled(ev.target.checked)}
              />
              <span>
                <span className="font-semibold text-slate-900 block">Show this section on both pages</span>
                <span className="text-xs text-slate-500">When off, the logo strip is hidden on Home Physiotherapy and TelePhysio.</span>
              </span>
            </label>

            <CmsPanel title="Heading" icon="fa-heading">
              <CmsField label="Heading">
                <input
                  className="input-field"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  maxLength={220}
                />
              </CmsField>
              <CmsField label="Highlighted phrase" hint="Must appear inside the heading (e.g. 12K+). Leave blank for no accent.">
                <input
                  className="input-field"
                  value={highlight}
                  onChange={(e) => setHighlight(e.target.value)}
                  maxLength={80}
                />
              </CmsField>
            </CmsPanel>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-800">
                Logos ({readyCount}/{items.length} ready)
              </h2>
              <button
                type="button"
                onClick={addItem}
                disabled={items.length >= ORG_LOGOS_MAX_ITEMS}
                className="text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 rounded-lg px-3 py-2 inline-flex items-center gap-1.5"
              >
                <FaIcon icon="fa-plus" /> Add logo
              </button>
            </div>

            {items.length === 0 && (
              <div className="glass-card text-center py-12">
                <FaIcon icon="fa-building" className="text-3xl text-slate-300 mb-3" />
                <p className="text-slate-700 font-semibold">No organisations yet</p>
                <p className="text-sm text-slate-500 mt-1">Add a name and optional logo image for the scrolling strip.</p>
              </div>
            )}

            <div className="space-y-3">
              {items.map((item, index) => {
                const preview = resolveMediaUrl(item.image) || item.image;
                const open = openId === item.id;
                return (
                  <div key={item.id || index} className="rounded-2xl border border-slate-200 bg-white/90 overflow-hidden">
                    <div className="flex items-center gap-3 p-3 sm:p-4">
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-3 text-left min-w-0"
                        onClick={() => setOpenId(open ? '' : item.id)}
                      >
                        <span className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center px-1">
                          {preview ? (
                            <img src={preview} alt="" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 truncate">{(item.name || '?').slice(0, 8)}</span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-900 truncate">{item.name || `Organisation ${index + 1}`}</span>
                          <span className="block text-xs text-slate-500 truncate">{item.is_enabled === false ? 'Hidden' : 'Visible in marquee'}</span>
                        </span>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        {isOrgLogoComplete(item) ? (
                          <span className="hidden sm:inline text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Ready
                          </span>
                        ) : (
                          <span className="hidden sm:inline text-[10px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Incomplete
                          </span>
                        )}
                        <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-30" aria-label="Move up">
                          <FaIcon icon="fa-chevron-up" />
                        </button>
                        <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-30" aria-label="Move down">
                          <FaIcon icon="fa-chevron-down" />
                        </button>
                        <button type="button" onClick={() => removeItem(index)} className="p-2 text-slate-400 hover:text-red-600" aria-label="Delete">
                          <FaIcon icon="fa-trash" />
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="border-t border-slate-100 p-4 sm:p-5 space-y-4 bg-slate-50/40">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-orange-600"
                            checked={item.is_enabled !== false}
                            onChange={(e) => setItem(index, 'is_enabled', e.target.checked)}
                          />
                          Enabled
                        </label>
                        <CmsField label="Organisation name">
                          <input
                            className="input-field"
                            value={item.name || ''}
                            onChange={(e) => setItem(index, 'name', e.target.value)}
                            placeholder="e.g. Deloitte"
                          />
                        </CmsField>
                        <MediaUrlOrUpload
                          label="Logo image"
                          hint="Transparent PNG or SVG-style PNG works best. Shown in grayscale on the site."
                          icon="fa-image"
                          urlValue={item.image}
                          onUrlChange={(v) => setItem(index, 'image', v)}
                          onClear={() => setItem(index, 'image', '')}
                          onUpload={uploadCmsImage}
                          accept="image/jpeg,image/png,image/webp,image/svg+xml"
                          maxMb={3}
                          preview="21:9"
                          previewFit="contain"
                          accent="orange"
                        />
                        <CmsField label="Image alt text">
                          <input
                            className="input-field text-sm"
                            value={item.image_alt || ''}
                            onChange={(e) => setItem(index, 'image_alt', e.target.value)}
                            placeholder={`${item.name || 'Organisation'} logo`}
                          />
                        </CmsField>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 sticky bottom-3 z-10">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save & publish'}
              </button>
              <Link to="/home-physiotherapy" target="_blank" className="btn-outline text-sm">
                Preview Home Physiotherapy
              </Link>
              <Link to="/telephysio" target="_blank" className="btn-outline text-sm">
                Preview TelePhysio
              </Link>
            </div>
          </form>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
