import { useState } from 'react';
import FaIcon from '../FaIcon';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import toast from 'react-hot-toast';

const PREVIEW_CLASS = {
  desktop: 'aspect-[4/1] max-h-44 w-full',
  mobile: 'aspect-[828/420] max-h-56 max-w-[240px] mx-auto sm:mx-0',
  '4:3': 'aspect-[4/3] max-w-md w-full',
  '4/3': 'aspect-[4/3] max-w-md w-full',
  '16:9': 'aspect-[16/9] max-w-lg w-full',
  '1:1': 'aspect-square max-w-[260px] w-full',
  '21:9': 'aspect-[21/9] max-h-40 w-full',
  default: 'aspect-[21/9] max-h-40 w-full',
};

const ACCENT_STYLES = {
  orange: {
    card: 'border-orange-200/90 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40',
    icon: 'text-orange-600',
    badge: 'bg-orange-100/90 text-orange-800 border-orange-200/90',
    uploadBtn: 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400',
  },
  primary: {
    card: 'border-primary-200/90 bg-gradient-to-br from-primary-50/60 via-white to-orange-50/40',
    icon: 'text-primary-600',
    badge: 'bg-primary-100/90 text-primary-800 border-primary-200/90',
    uploadBtn: 'border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400',
  },
  rose: {
    card: 'border-rose-200/90 bg-gradient-to-br from-rose-50/60 via-white to-pink-50/40',
    icon: 'text-rose-600',
    badge: 'bg-rose-100/90 text-rose-800 border-rose-200/90',
    uploadBtn: 'border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400',
  },
  emerald: {
    card: 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40',
    icon: 'text-emerald-600',
    badge: 'bg-emerald-100/90 text-emerald-800 border-emerald-200/90',
    uploadBtn: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400',
  },
  violet: {
    card: 'border-violet-200/90 bg-gradient-to-br from-violet-50/60 via-white to-purple-50/40',
    icon: 'text-violet-600',
    badge: 'bg-violet-100/90 text-violet-800 border-violet-200/90',
    uploadBtn: 'border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400',
  },
};

/**
 * Link OR file upload — modern media field for CMS with recommended size guidance and aspect ratio preview.
 */
export default function MediaUrlOrUpload({
  label,
  hint,
  icon = 'fa-link',
  urlValue = '',
  value,
  onUrlChange,
  onChange,
  onUpload,
  uploadFn,
  accept,
  maxMb = 25,
  preview = 'none',
  devicePreview = 'default',
  aspectRatio,
  recommendedSize,
  accent = 'violet',
  onClear,
  previewClass: customPreviewClass,
}) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const currentUrl = urlValue || value || '';
  const handleUrlUpdate = onUrlChange || onChange || (() => {});
  const handleFileUpload = onUpload || uploadFn || (async () => {});
  
  const resolved = resolveMediaUrl(currentUrl) || currentUrl;

  const currentAccent = ACCENT_STYLES[accent] || ACCENT_STYLES.violet;
  const ratioKey = aspectRatio || devicePreview || 'default';
  const previewClass = customPreviewClass || PREVIEW_CLASS[ratioKey] || PREVIEW_CLASS.default;

  const processFile = async (file) => {
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File must be ${maxMb}MB or smaller`);
      return;
    }
    setUploading(true);
    try {
      const res = await handleFileUpload(file);
      const url = res?.data?.url ?? res?.url ?? '';
      if (url) handleUrlUpdate(url);
      toast.success('File uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const clearImage = () => {
    if (onClear) {
      onClear();
      return;
    }
    onUrlChange('');
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-4 shadow-sm transition-all duration-200 ${
        currentAccent.card
      } ${isDragging ? 'ring-2 ring-primary-500 border-primary-500 scale-[1.005]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-xs border border-slate-200/60 ${currentAccent.icon}`}>
            <FaIcon icon={icon} className="text-sm" />
          </span>
          <div>
            <p className="font-bold text-slate-800 text-sm">{label}</p>
            {hint && <p className="text-xs text-slate-500">{hint}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {recommendedSize && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs ${currentAccent.badge}`}
              title="Recommended image dimensions"
            >
              <FaIcon icon="fa-ruler-combined" className="text-[10px]" />
              <span>{recommendedSize}</span>
            </span>
          )}

          {resolved && (
            <button
              type="button"
              onClick={clearImage}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition inline-flex items-center gap-1.5"
              title="Remove this image"
            >
              <FaIcon icon="fa-trash-can" className="text-[11px]" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* Input controls (URL + File Upload) */}
      <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 items-center">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Image URL / Link
          </label>
          <div className="relative">
            <input
              type="url"
              className="input-field text-sm !py-2 !pl-9 pr-3 w-full bg-white"
              placeholder="https://example.com/image.webp"
              value={urlValue || ''}
              onChange={(e) => onUrlChange(e.target.value)}
            />
            <FaIcon
              icon="fa-link"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"
            />
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center px-1 pt-4 text-slate-300 font-bold text-xs uppercase tracking-wider">
          or
        </div>

        <div className="pt-0 md:pt-4">
          <label className="inline-flex w-full sm:w-auto">
            <input
              type="file"
              accept={accept}
              className="sr-only"
              disabled={uploading}
              onChange={handleFileInput}
            />
            <span
              className={`btn-outline text-sm cursor-pointer inline-flex items-center justify-center gap-2 !py-2 !px-4 w-full sm:w-auto bg-white font-semibold transition ${
                currentAccent.uploadBtn
              } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <FaIcon
                icon={uploading ? 'fa-spinner' : 'fa-cloud-arrow-up'}
                className={uploading ? 'fa-spin text-sm' : 'text-sm'}
              />
              <span>{uploading ? 'Uploading…' : 'Upload file'}</span>
            </span>
          </label>
        </div>
      </div>

      {/* File specifications helper text */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-0.5">
        <span className="inline-flex items-center gap-1.5">
          <FaIcon icon="fa-file-image" className="text-slate-400" />
          Supported formats: {accept ? accept.replaceAll('image/', '').toUpperCase() : 'JPG, PNG, WEBP'}
        </span>
        <span>Max size: {maxMb} MB</span>
      </div>

      {/* Preview Section */}
      {preview === 'image' && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5">
              <FaIcon icon="fa-eye" className="text-slate-400 text-[11px]" />
              Image preview {ratioKey ? `(${ratioKey})` : ''}
            </span>
            {resolved && (
              <a
                href={resolved}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>View full size</span>
                <FaIcon icon="fa-arrow-up-right-from-square" className="text-[10px]" />
              </a>
            )}
          </div>

          {resolved ? (
            <div
              className={`rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900/5 shadow-inner relative group ${previewClass}`}
            >
              <img
                src={resolved}
                alt={label || 'Media preview'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3 pointer-events-none">
                <span className="text-xs text-white font-medium drop-shadow-sm flex items-center gap-1.5">
                  <FaIcon icon="fa-check-circle" className="text-emerald-400" />
                  Active live preview
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-2xl border-2 border-dashed border-slate-300/80 bg-slate-50/60 flex flex-col items-center justify-center p-6 text-center text-slate-400 transition hover:border-slate-400 hover:bg-slate-50 ${previewClass}`}
            >
              <FaIcon icon="fa-image" className="text-3xl text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-500">No image uploaded or linked</p>
              {recommendedSize && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Target aspect & size: {recommendedSize}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {resolved && preview === 'audio' && (
        <audio controls className="w-full mt-2" src={resolved}>
          <track kind="captions" />
        </audio>
      )}

      {resolved && preview === 'video' && (
        <video controls className="w-full max-h-48 rounded-2xl bg-black mt-2 shadow-inner" src={resolved}>
          <track kind="captions" />
        </video>
      )}
    </div>
  );
}
