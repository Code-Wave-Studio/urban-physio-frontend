import { useState } from 'react';
import FaIcon from '../FaIcon';
import { uploadClinicGallery } from '../../services/api';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import toast from 'react-hot-toast';

/**
 * @param {{ images: string[], clinicId?: string | number | null, onChange: (urls: string[]) => void, max?: number }} props
 */
export default function ClinicGalleryUpload({ images = [], clinicId, onChange, max = 10 }) {
  const [uploading, setUploading] = useState(false);

  const addUrl = (url) => {
    if (!url || images.includes(url)) return;
    if (images.length >= max) {
      toast.error(`Maximum ${max} images`);
      return;
    }
    onChange([...images, url]);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!clinicId) {
      toast.error('Save the clinic first, then upload gallery photos');
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadClinicGallery(file, clinicId);
      const url = res.data?.image_url ?? res.data?.url ?? '';
      if (url) addUrl(url);
      toast.success('Photo added');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const remove = (idx) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((url, i) => (
          <div key={`${url}-${i}`} className="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-slate-200 snap-start">
            <img src={resolveMediaUrl(url) || url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-slate-900/70 text-white text-xs flex items-center justify-center"
              aria-label="Remove photo"
            >
              <FaIcon icon="fa-xmark" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <label className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-emerald-400 hover:text-emerald-600 transition snap-start">
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={handleFile} />
            <FaIcon icon={uploading ? 'fa-spinner' : 'fa-plus'} className={`text-lg mb-1 ${uploading ? 'fa-spin' : ''}`} />
            <span className="text-[10px] font-semibold text-center px-1">{clinicId ? 'Add photo' : 'Save first'}</span>
          </label>
        )}
      </div>
      <p className="text-xs text-slate-500">Swipe on mobile · JPG, PNG or WebP · max 3MB each · up to {max} photos</p>
    </div>
  );
}
