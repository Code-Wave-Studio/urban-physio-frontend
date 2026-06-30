import { useCallback, useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { admin, uploadCmsImage } from '../../services/api';
import { unwrapApiData } from '../../utils/contactText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import toast from 'react-hot-toast';

const DESKTOP_HINT = 'Desktop: 1920 × 480 px (4:1 wide) · JPG, PNG or WebP · max 4 MB';
const MOBILE_HINT = 'Mobile: 828 × 420 px (~2:1) · JPG, PNG or WebP · max 4 MB';

const emptyBanner = () => ({
  id: 'home_banner_1',
  desktop_image: '',
  mobile_image: '',
  alt_text: '',
  link_url: '',
  sort_order: 0,
});

export default function AdminHomeBanners() {
  const [enabled, setEnabled] = useState(false);
  const [banner, setBanner] = useState(emptyBanner);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    admin
      .homeBannerSettings()
      .then((res) => {
        const d = unwrapApiData(res);
        setEnabled(!!d.is_enabled);
        const first = Array.isArray(d.slides) && d.slides.length ? d.slides[0] : emptyBanner();
        setBanner({ ...emptyBanner(), ...first });
      })
      .catch((e) => toast.error(e.message || 'Could not load banner settings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key, value) => setBanner((b) => ({ ...b, [key]: value }));

  const isComplete = Boolean(banner.desktop_image?.trim() && banner.mobile_image?.trim());

  const save = async (e) => {
    e.preventDefault();
    if (enabled && !isComplete) {
      toast.error('Add both desktop and mobile images to show the banner');
      return;
    }
    setSaving(true);
    try {
      await admin.updateHomeBannerSettings({
        is_enabled: enabled,
        slides: isComplete ? [{ ...banner, sort_order: 0 }] : [],
      });
      toast.success(enabled && isComplete ? 'Homepage banner published' : 'Banner saved (hidden on homepage)');
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const removeBanner = async () => {
    if (!window.confirm('Remove homepage banner? Emergency bookings section will show instead.')) return;
    setRemoving(true);
    try {
      await admin.updateHomeBannerSettings({
        is_enabled: false,
        slides: [],
      });
      setEnabled(false);
      setBanner(emptyBanner());
      toast.success('Banner removed — emergency section will show on homepage');
    } catch (err) {
      toast.error(err.message || 'Could not remove banner');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FaIcon icon="fa-image" className="text-orange-600" />
            Homepage banner
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            One banner in place of the emergency bookings section. When off or removed, emergency bookings show instead.
          </p>
        </div>

        {loading ? (
          <div className="glass-card h-72 animate-pulse bg-white/40" />
        ) : (
          <form onSubmit={save} className="glass-card !p-6 md:!p-8 space-y-6">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-sm text-sky-900 space-y-1">
              <p className="font-bold flex items-center gap-2">
                <FaIcon icon="fa-ruler-combined" />
                Recommended image sizes
              </p>
              <p>
                <strong>Desktop:</strong> {DESKTOP_HINT}
              </p>
              <p>
                <strong>Mobile:</strong> {MOBILE_HINT}
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-slate-200 bg-white/70 p-4">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-slate-900 block">Show banner on homepage</span>
                <span className="text-xs text-slate-500">
                  When on, banner replaces emergency section. When off, emergency bookings section shows.
                </span>
              </span>
            </label>

            <div className="grid lg:grid-cols-2 gap-4">
              <MediaUrlOrUpload
                label="Desktop banner"
                hint={DESKTOP_HINT}
                icon="fa-desktop"
                urlValue={banner.desktop_image}
                onUrlChange={(v) => setField('desktop_image', v)}
                onUpload={uploadCmsImage}
                accept="image/jpeg,image/png,image/webp,image/gif"
                preview="image"
                accent="rose"
              />
              <MediaUrlOrUpload
                label="Mobile banner"
                hint={MOBILE_HINT}
                icon="fa-mobile-screen"
                urlValue={banner.mobile_image}
                onUrlChange={(v) => setField('mobile_image', v)}
                onUpload={uploadCmsImage}
                accept="image/jpeg,image/png,image/webp,image/gif"
                preview="image"
                accent="violet"
              />
            </div>

            {(banner.desktop_image || banner.mobile_image) && (
              <div className="grid sm:grid-cols-2 gap-3">
                {banner.desktop_image && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[4/1] bg-slate-100">
                    <img
                      src={resolveMediaUrl(banner.desktop_image) || banner.desktop_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {banner.mobile_image && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[828/420] bg-slate-100 max-w-xs">
                    <img
                      src={resolveMediaUrl(banner.mobile_image) || banner.mobile_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="input-field text-sm"
                placeholder="Alt text (accessibility)"
                value={banner.alt_text || ''}
                onChange={(e) => setField('alt_text', e.target.value)}
              />
              <input
                className="input-field text-sm"
                placeholder="Optional link (https://… or /book)"
                value={banner.link_url || ''}
                onChange={(e) => setField('link_url', e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={saving || removing} className="btn-primary">
                {saving ? 'Saving…' : enabled && isComplete ? 'Publish banner' : 'Save settings'}
              </button>
              {(isComplete || enabled) && (
                <button
                  type="button"
                  onClick={removeBanner}
                  disabled={saving || removing}
                  className="btn-outline text-red-700 border-red-200 hover:bg-red-50"
                >
                  <FaIcon icon="fa-trash" className="mr-1.5" />
                  {removing ? 'Removing…' : 'Remove banner'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
