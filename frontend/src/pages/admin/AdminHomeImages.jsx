import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { admin, uploadCmsImage } from '../../services/api';
import { HOME_SECTION_IMAGE_FIELDS, emptySectionImages } from '../../constants/homeSectionImages';
import { unwrapApiData } from '../../utils/contactText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import toast from 'react-hot-toast';

export default function AdminHomeImages() {
  const [images, setImages] = useState(emptySectionImages);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    admin
      .heroSettings()
      .then((res) => {
        const d = unwrapApiData(res);
        const fromApi = d.section_images && typeof d.section_images === 'object' ? d.section_images : {};
        setImages({ ...emptySectionImages(), ...fromApi });
      })
      .catch((e) => toast.error(e.message || 'Could not load images'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setImage = (key, value) => setImages((prev) => ({ ...prev, [key]: value }));

  const clearImage = (key) => setImage(key, '');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.updateHeroSettings({ section_images: images });
      toast.success('Homepage images saved');
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-images" className="text-orange-600" />
            Homepage section images
          </h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Upload or link images for each home page section. Leave empty to use the default image. Promo carousel
            slides are managed separately on{' '}
            <Link to="/admin/home-banners" className="text-primary-600 font-semibold hover:underline">
              Homepage banner
            </Link>
            .
          </p>
        </div>

        {loading ? (
          <div className="glass-card h-72 animate-pulse bg-white/40" />
        ) : (
          <form onSubmit={save} className="space-y-5">
            {HOME_SECTION_IMAGE_FIELDS.map((field) => {
              const url = images[field.key] || '';
              const preview = resolveMediaUrl(url) || url;
              return (
                <div key={field.key} className="glass-card !p-5 md:!p-6 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-slate-900">{field.label}</h2>
                      <p className="text-xs text-slate-500 mt-1">{field.hint}</p>
                      <p className="text-xs font-semibold text-orange-700 mt-2 inline-flex items-center gap-1.5">
                        <FaIcon icon="fa-ruler-combined" className="text-[10px]" />
                        Recommended: {field.recommendedSize} ({field.aspect}) · JPG/PNG/WebP · max 4 MB
                      </p>
                    </div>
                    {url && (
                      <button
                        type="button"
                        onClick={() => clearImage(field.key)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5"
                      >
                        Remove image
                      </button>
                    )}
                  </div>

                  {preview && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48">
                      <img src={preview} alt="" className="w-full h-full max-h-48 object-cover" />
                    </div>
                  )}

                  <MediaUrlOrUpload
                    label="Image URL or upload"
                    icon={field.icon}
                    accent={field.accent}
                    urlValue={url}
                    onUrlChange={(v) => setImage(field.key, v)}
                    onUpload={(file) => uploadCmsImage(file)}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    maxMb={4}
                    preview="none"
                  />
                </div>
              );
            })}

            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? 'Saving…' : 'Save homepage images'}
            </button>
          </form>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
