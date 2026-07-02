import { useCallback, useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { admin, uploadCmsImage, uploadCmsVideo } from '../../services/api';
import { unwrapApiData } from '../../utils/contactText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import toast from 'react-hot-toast';

const MAX_ITEMS = 30;

function newItem(type = 'text', order = 0) {
  return {
    id: `tst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    name: '',
    city: '',
    text: '',
    rating: 5,
    video_url: '',
    poster: '',
    sort_order: order,
  };
}

function isComplete(item) {
  if (item.type === 'video') return Boolean(item.video_url?.trim());
  return Boolean(item.name?.trim() && item.text?.trim());
}

export default function AdminTestimonials() {
  const [enabled, setEnabled] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    admin
      .testimonialsSettings()
      .then((res) => {
        const d = unwrapApiData(res);
        setEnabled(d.is_enabled !== false);
        setItems(Array.isArray(d.items) ? d.items : []);
      })
      .catch((e) => toast.error(e.message || 'Could not load reviews'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setItem = (index, key, value) => {
    setItems((list) => list.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  };

  const addItem = (type) => {
    if (items.length >= MAX_ITEMS) {
      toast.error(`Maximum ${MAX_ITEMS} reviews`);
      return;
    }
    setItems((list) => [...list, newItem(type, list.length)]);
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

  const readyCount = items.filter(isComplete).length;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.updateTestimonialsSettings({
        is_enabled: enabled,
        items: items.map((it, i) => ({ ...it, sort_order: i })),
      });
      toast.success('Homepage reviews saved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-comment-dots" className="text-orange-600" />
            Homepage reviews
          </h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Full control over the &ldquo;What Patients Say&rdquo; section. Add text or video reviews, edit, reorder, or
            delete. Video reviews can be uploaded or linked (YouTube/MP4).
          </p>
        </div>

        {loading ? (
          <div className="glass-card h-72 animate-pulse bg-white/40" />
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
                <span className="font-semibold text-slate-900 block">Show reviews section on homepage</span>
                <span className="text-xs text-slate-500">When off, the whole section is hidden.</span>
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-800">
                Reviews ({readyCount}/{items.length} ready to show)
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addItem('text')}
                  disabled={items.length >= MAX_ITEMS}
                  className="text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 rounded-lg px-3 py-2 inline-flex items-center gap-1.5"
                >
                  <FaIcon icon="fa-plus" /> Add text review
                </button>
                <button
                  type="button"
                  onClick={() => addItem('video')}
                  disabled={items.length >= MAX_ITEMS}
                  className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-lg px-3 py-2 inline-flex items-center gap-1.5"
                >
                  <FaIcon icon="fa-video" /> Add video review
                </button>
              </div>
            </div>

            {items.length === 0 && (
              <div className="glass-card text-center py-12">
                <FaIcon icon="fa-comment-slash" className="text-3xl text-slate-300 mb-3" />
                <p className="text-slate-700 font-semibold">No reviews yet</p>
                <p className="text-sm text-slate-500 mt-1">Add a text or video review to get started.</p>
              </div>
            )}

            <div className="space-y-5">
              {items.map((item, index) => {
                const posterPreview = resolveMediaUrl(item.poster) || item.poster;
                return (
                  <div key={item.id || index} className="rounded-2xl border border-slate-200 bg-white/80 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            item.type === 'video'
                              ? 'text-violet-700 bg-violet-50 border border-violet-200'
                              : 'text-orange-700 bg-orange-50 border border-orange-200'
                          }`}
                        >
                          <FaIcon icon={item.type === 'video' ? 'fa-video' : 'fa-quote-left'} className="mr-1" />
                          {item.type === 'video' ? 'Video' : 'Text'}
                        </span>
                        Review {index + 1}
                        {isComplete(item) ? (
                          <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Incomplete
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveItem(index, -1)}
                          disabled={index === 0}
                          className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <FaIcon icon="fa-chevron-up" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, 1)}
                          disabled={index === items.length - 1}
                          className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <FaIcon icon="fa-chevron-down" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-slate-400 hover:text-red-600"
                          aria-label="Delete review"
                          title="Delete this review"
                        >
                          <FaIcon icon="fa-trash" />
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        className="input-field text-sm"
                        placeholder="Name (e.g. Rahul M.)"
                        value={item.name || ''}
                        onChange={(ev) => setItem(index, 'name', ev.target.value)}
                      />
                      <input
                        className="input-field text-sm"
                        placeholder="City (e.g. Mumbai)"
                        value={item.city || ''}
                        onChange={(ev) => setItem(index, 'city', ev.target.value)}
                      />
                    </div>

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

                    <textarea
                      className="input-field text-sm min-h-[80px]"
                      placeholder={
                        item.type === 'video'
                          ? 'Optional caption shown under the video'
                          : 'Review text (what the patient said)'
                      }
                      value={item.text || ''}
                      onChange={(ev) => setItem(index, 'text', ev.target.value)}
                    />

                    {item.type === 'video' && (
                      <div className="grid lg:grid-cols-2 gap-4">
                        <MediaUrlOrUpload
                          label="Video (upload or link)"
                          hint="MP4 upload or paste a YouTube / video URL"
                          icon="fa-video"
                          urlValue={item.video_url}
                          onUrlChange={(v) => setItem(index, 'video_url', v)}
                          onClear={() => setItem(index, 'video_url', '')}
                          onUpload={uploadCmsVideo}
                          accept="video/mp4,video/webm,video/quicktime"
                          maxMb={50}
                          preview="video"
                          accent="violet"
                        />
                        <div className="space-y-2">
                          <MediaUrlOrUpload
                            label="Thumbnail (optional)"
                            hint="Poster image shown before play"
                            icon="fa-image"
                            urlValue={item.poster}
                            onUrlChange={(v) => setItem(index, 'poster', v)}
                            onClear={() => setItem(index, 'poster', '')}
                            onUpload={uploadCmsImage}
                            accept="image/jpeg,image/png,image/webp"
                            maxMb={4}
                            preview="none"
                            accent="rose"
                          />
                          {posterPreview && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-32">
                              <img src={posterPreview} alt="" className="w-full h-full object-cover max-h-32" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save reviews'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
