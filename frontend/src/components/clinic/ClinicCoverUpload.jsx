import MediaUrlOrUpload from '../admin/MediaUrlOrUpload';
import { uploadClinicCover } from '../../services/api';
import {
  CLINIC_COVER_MAX_MB,
  CLINIC_COVER_SIZE_HINT,
  CLINIC_COVER_SIZE_HINT_MOBILE,
} from '../../utils/clinicProfileUtils';
import { resolveMediaUrl } from '../../utils/mediaUrl';

/**
 * Cover / banner image — URL or file upload with responsive previews.
 * @param {{ coverImage?: string, clinicId?: number | string | null, onChange: (url: string) => void }} props
 */
export default function ClinicCoverUpload({ coverImage, clinicId, onChange }) {
  const resolved = resolveMediaUrl(coverImage) || coverImage;

  return (
    <div className="space-y-3">
      <MediaUrlOrUpload
        label="Cover / banner image"
        hint={`Primary hero on clinic profile, listing cards & preview. Recommended ${CLINIC_COVER_SIZE_HINT} · ${CLINIC_COVER_SIZE_HINT_MOBILE} · JPG, PNG or WebP · max ${CLINIC_COVER_MAX_MB}MB`}
        icon="fa-panorama"
        urlValue={coverImage || ''}
        onUrlChange={onChange}
        onUpload={(file) => uploadClinicCover(file, clinicId || undefined)}
        accept="image/jpeg,image/png,image/webp"
        maxMb={CLINIC_COVER_MAX_MB}
        preview="image"
        devicePreview="default"
        accent="emerald"
        onClear={() => onChange('')}
      />

      {resolved && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Profile banner</p>
            <div className="aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={resolved} alt="" className="w-full h-full object-cover object-center" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Listing card</p>
            <div className="aspect-[2.4/1] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={resolved} alt="" className="w-full h-full object-cover object-center" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
