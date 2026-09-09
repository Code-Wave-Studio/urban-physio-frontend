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
  PHYSIO_TEAM_COPY,
  PHYSIO_TEAM_MAX_ITEMS,
  blankPhysio,
  isPhysioComplete,
} from '../../constants/physioTeamDefaults';
import toast from 'react-hot-toast';

function specialtiesToText(value) {
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
}

export default function AdminPhysioTeam() {
  const [enabled, setEnabled] = useState(true);
  const [heading, setHeading] = useState(PHYSIO_TEAM_COPY.heading);
  const [highlight, setHighlight] = useState(PHYSIO_TEAM_COPY.heading_highlight);
  const [description, setDescription] = useState(PHYSIO_TEAM_COPY.description);
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    admin
      .physioTeamSettings()
      .then((res) => {
        const d = unwrapApiData(res);
        setEnabled(d.is_enabled !== false);
        setHeading(d.heading || PHYSIO_TEAM_COPY.heading);
        setHighlight(d.heading_highlight || PHYSIO_TEAM_COPY.heading_highlight);
        setDescription(d.description || '');
        const next = Array.isArray(d.items) ? d.items : [];
        setItems(next);
        if (next[0]?.id) setOpenId(next[0].id);
      })
      .catch((e) => toast.error(e.message || 'Could not load physiotherapists'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setItem = (index, key, value) => {
    setItems((list) => list.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  };

  const setApproach = (index, rowIndex, key, value) => {
    setItems((list) =>
      list.map((it, i) => {
        if (i !== index) return it;
        const approach = [...(it.approach || [])];
        approach[rowIndex] = { ...(approach[rowIndex] || { title: '', body: '' }), [key]: value };
        return { ...it, approach };
      })
    );
  };

  const addApproach = (index) => {
    setItems((list) =>
      list.map((it, i) => {
        if (i !== index) return it;
        const approach = [...(it.approach || [])];
        if (approach.length >= 8) return it;
        return { ...it, approach: [...approach, { title: '', body: '' }] };
      })
    );
  };

  const removeApproach = (index, rowIndex) => {
    setItems((list) =>
      list.map((it, i) => {
        if (i !== index) return it;
        return { ...it, approach: (it.approach || []).filter((_, j) => j !== rowIndex) };
      })
    );
  };

  const addItem = () => {
    if (items.length >= PHYSIO_TEAM_MAX_ITEMS) {
      toast.error(`Maximum ${PHYSIO_TEAM_MAX_ITEMS} physiotherapists`);
      return;
    }
    const next = blankPhysio(items.length);
    next.show_in_list = true;
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

  const toggleList = (index, on) => {
    setItem(index, 'show_in_list', on);
  };

  const listCount = items.filter((it) => it.show_in_list).length;
  const readyCount = items.filter(isPhysioComplete).length;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.updatePhysioTeamSettings({
        is_enabled: enabled,
        heading,
        heading_highlight: highlight,
        description,
        items: items.map((it, i) => ({
          ...it,
          specialties: specialtiesToText(it.specialties),
          sort_order: i,
        })),
      });
      toast.success('Physiotherapist section published on Home Physiotherapy and TelePhysio');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Our Physiotherapists</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            One shared section for{' '}
            <Link to="/home-physiotherapy" target="_blank" className="text-primary-700 font-semibold hover:underline">
              Home Physiotherapy
            </Link>{' '}
            and{' '}
            <Link to="/telephysio" target="_blank" className="text-teal-700 font-semibold hover:underline">
              TelePhysio by Myoreset
            </Link>
            . Changes here appear on both pages automatically.
          </p>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center text-slate-500">
            <FaIcon icon="fa-spinner" className="fa-spin text-2xl mb-2" />
            Loading physiotherapists…
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
                <span className="text-xs text-slate-500">When off, the whole block is hidden on Home Physiotherapy and TelePhysio.</span>
              </span>
            </label>

            <CmsPanel title="Heading" icon="fa-heading">
              <div className="grid sm:grid-cols-2 gap-3">
                <CmsField label="Heading">
                  <input className="input-field" value={heading} onChange={(e) => setHeading(e.target.value)} />
                </CmsField>
                <CmsField label="Highlighted word" hint="Must appear inside the heading (e.g. Physiotherapists).">
                  <input className="input-field" value={highlight} onChange={(e) => setHighlight(e.target.value)} />
                </CmsField>
              </div>
              <CmsField label="Supporting description">
                <textarea
                  className="input-field min-h-[88px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </CmsField>
            </CmsPanel>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-800">
                Profiles ({readyCount}/{items.length} ready) · {listCount} in main list
              </h2>
              <button
                type="button"
                onClick={addItem}
                disabled={items.length >= PHYSIO_TEAM_MAX_ITEMS}
                className="text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 rounded-lg px-3 py-2 inline-flex items-center gap-1.5"
              >
                <FaIcon icon="fa-plus" /> Add physiotherapist
              </button>
            </div>

            {items.length === 0 && (
              <div className="glass-card text-center py-12">
                <FaIcon icon="fa-user-doctor" className="text-3xl text-slate-300 mb-3" />
                <p className="text-slate-700 font-semibold">No physiotherapists yet</p>
                <p className="text-sm text-slate-500 mt-1">Add a profile to populate both public pages.</p>
              </div>
            )}

            <div className="space-y-4">
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
                        <span className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 shrink-0">
                          {preview ? (
                            <img src={preview} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-xs font-bold text-orange-700">
                              {(item.name || '?').slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-900 truncate">{item.name || `Physiotherapist ${index + 1}`}</span>
                          <span className="block text-xs text-slate-500 truncate">{item.qualification || 'No qualification yet'}</span>
                        </span>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        {isPhysioComplete(item) ? (
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
                        <button type="button" onClick={() => removeItem(index)} className="p-2 text-slate-400 hover:text-red-600" aria-label="Delete" title="Delete this physiotherapist">
                          <FaIcon icon="fa-trash" />
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="border-t border-slate-100 p-4 sm:p-5 space-y-4 bg-slate-50/40">
                        <div className="flex flex-wrap gap-4 text-sm">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-orange-600"
                              checked={item.is_enabled !== false}
                              onChange={(e) => setItem(index, 'is_enabled', e.target.checked)}
                            />
                            Enabled
                          </label>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-orange-600"
                              checked={!!item.show_in_list}
                              onChange={(e) => toggleList(index, e.target.checked)}
                            />
                            Main list
                          </label>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-orange-600"
                              checked={item.show_in_carousel !== false}
                              onChange={(e) => setItem(index, 'show_in_carousel', e.target.checked)}
                            />
                            Bottom carousel
                          </label>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-4">
                          <MediaUrlOrUpload
                            label="Profile image"
                            hint="Cut-out PNG works best for the large showcase photo."
                            icon="fa-image"
                            urlValue={item.image}
                            onUrlChange={(v) => setItem(index, 'image', v)}
                            onClear={() => setItem(index, 'image', '')}
                            onUpload={uploadCmsImage}
                            accept="image/jpeg,image/png,image/webp"
                            maxMb={4}
                            preview="1:1"
                            accent="orange"
                          />
                          <MediaUrlOrUpload
                            label="Carousel image (optional)"
                            hint="Leave blank to reuse the profile image in grayscale."
                            icon="fa-images"
                            urlValue={item.carousel_image}
                            onUrlChange={(v) => setItem(index, 'carousel_image', v)}
                            onClear={() => setItem(index, 'carousel_image', '')}
                            onUpload={uploadCmsImage}
                            accept="image/jpeg,image/png,image/webp"
                            maxMb={4}
                            preview="1:1"
                            accent="primary"
                          />
                        </div>

                        <CmsField label="Image alt text">
                          <input
                            className="input-field text-sm"
                            value={item.image_alt || ''}
                            onChange={(e) => setItem(index, 'image_alt', e.target.value)}
                            placeholder={`${item.name || 'Physiotherapist'} portrait`}
                          />
                        </CmsField>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <input className="input-field text-sm" placeholder="Name" value={item.name || ''} onChange={(e) => setItem(index, 'name', e.target.value)} />
                          <input className="input-field text-sm" placeholder="Qualification (e.g. BPT, MPT)" value={item.qualification || ''} onChange={(e) => setItem(index, 'qualification', e.target.value)} />
                          <input className="input-field text-sm" placeholder="Designation" value={item.designation || ''} onChange={(e) => setItem(index, 'designation', e.target.value)} />
                          <input className="input-field text-sm" placeholder="Experience (e.g. 8+ years)" value={item.experience || ''} onChange={(e) => setItem(index, 'experience', e.target.value)} />
                        </div>

                        <input
                          className="input-field text-sm"
                          placeholder="Badge (e.g. Treated over 350+ patients)"
                          value={item.badge || ''}
                          onChange={(e) => setItem(index, 'badge', e.target.value)}
                        />

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-600">Rating</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setItem(index, 'rating', star)}
                                className={`text-lg ${star <= (item.rating || 0) ? 'text-amber-500' : 'text-slate-300'}`}
                                aria-label={`${star} star`}
                              >
                                <FaIcon icon="fa-star" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <CmsField label="Specialties" hint="Comma-separated. Shown as chips on the profile.">
                          <input
                            className="input-field text-sm"
                            value={specialtiesToText(item.specialties)}
                            onChange={(e) => setItem(index, 'specialties', e.target.value)}
                            placeholder="Sports rehab, ACL, Shoulder"
                          />
                        </CmsField>

                        <CmsField label="Profile description">
                          <textarea
                            className="input-field text-sm min-h-[120px]"
                            value={item.description || ''}
                            onChange={(e) => setItem(index, 'description', e.target.value)}
                          />
                        </CmsField>

                        <CmsField label="Approach heading">
                          <input
                            className="input-field text-sm"
                            value={item.approach_heading || ''}
                            onChange={(e) => setItem(index, 'approach_heading', e.target.value)}
                          />
                        </CmsField>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-600">Approach points</p>
                          {(item.approach || []).map((row, ri) => (
                            <div key={ri} className="grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_auto] gap-2">
                              <input
                                className="input-field text-sm"
                                placeholder="Title"
                                value={row.title || ''}
                                onChange={(e) => setApproach(index, ri, 'title', e.target.value)}
                              />
                              <input
                                className="input-field text-sm"
                                placeholder="Explanation"
                                value={row.body || ''}
                                onChange={(e) => setApproach(index, ri, 'body', e.target.value)}
                              />
                              <button
                                type="button"
                                className="p-2 text-slate-400 hover:text-red-600"
                                onClick={() => removeApproach(index, ri)}
                                aria-label="Remove approach point"
                              >
                                <FaIcon icon="fa-trash" />
                              </button>
                            </div>
                          ))}
                          <button type="button" className="btn-outline text-xs !py-1.5" onClick={() => addApproach(index)}>
                            <FaIcon icon="fa-plus" /> Add approach point
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Publishing…' : 'Publish on both pages'}
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
