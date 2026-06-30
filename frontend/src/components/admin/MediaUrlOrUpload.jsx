import { useState } from 'react';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import toast from 'react-hot-toast';

const PREVIEW_CLASS = {
  desktop: 'aspect-[4/1] max-h-40',
  mobile: 'aspect-[828/420] max-h-52 max-w-[220px] mx-auto',
  default: 'aspect-[21/9] max-h-36',
};

/**
 * Link OR file upload — modern media field for CMS.
 */
export default function MediaUrlOrUpload({
  label,
  hint,
  icon = 'fa-link',
  urlValue = '',
  onUrlChange,
  onUpload,
  accept,
  maxMb = 25,
  preview = 'none',
  devicePreview = 'default',
  accent = 'violet',
  onClear,
}) {
  const [uploading, setUploading] = useState(false);
  const resolved = resolveMediaUrl(urlValue) || urlValue;
  const borderAccent = accent === 'rose' ? 'border-rose-200 bg-rose-50/40' : 'border-violet-200 bg-violet-50/40';
  const iconAccent = accent === 'rose' ? 'text-rose-600' : 'text-violet-600';
  const previewClass = PREVIEW_CLASS[devicePreview] || PREVIEW_CLASS.default;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File must be ${maxMb}MB or smaller`);
      return;
    }
    setUploading(true);
    try {
      const res = await onUpload(file);
      const url = res?.data?.url ?? res?.url ?? '';
      if (url) onUrlChange(url);
      toast.success('File uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const clearImage = () => {
    if (onClear) {
      onClear();
      return;
    }
    onUrlChange('');
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${borderAccent}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <FaIcon icon={icon} className={iconAccent} />
          {label}
        </p>
        {resolved && (
          <button
            type="button"
            onClick={clearImage}
            className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 shrink-0"
            title="Remove this image only"
          >
            <FaIcon icon="fa-xmark" />
            Remove image
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500 -mt-1">{hint}</p>}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">External link (URL)</label>
        <input
          type="url"
          className="input-field text-sm"
          placeholder="https://…"
          value={urlValue || ''}
          onChange={(e) => onUrlChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <label className="inline-flex">
        <input type="file" accept={accept} className="sr-only" disabled={uploading} onChange={handleFile} />
        <span
          className={`btn-outline text-sm cursor-pointer inline-flex items-center gap-2 !py-2 ${
            uploading ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          <FaIcon icon={uploading ? 'fa-spinner' : 'fa-cloud-arrow-up'} className={uploading ? 'fa-spin' : ''} />
          {uploading ? 'Uploading…' : 'Upload file'}
        </span>
      </label>

      {resolved && preview === 'image' && (
        <div className={`rounded-xl overflow-hidden border border-slate-200 bg-slate-200 w-full ${previewClass}`}>
          <img src={resolved} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      {resolved && preview === 'audio' && (
        <audio controls className="w-full" src={resolved}>
          <track kind="captions" />
        </audio>
      )}
      {resolved && preview === 'video' && (
        <video controls className="w-full max-h-48 rounded-xl bg-black" src={resolved}>
          <track kind="captions" />
        </video>
      )}
    </div>
  );
}
