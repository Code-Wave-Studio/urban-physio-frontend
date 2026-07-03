import { useState } from 'react';
import FaIcon from './FaIcon';
import ClinicLogo from './ClinicLogo';
import { uploadClinicLogo } from '../services/api';
import { CLINIC_LOGO_MAX_MB, CLINIC_LOGO_SIZE_HINT } from '../utils/clinicProfileUtils';
import toast from 'react-hot-toast';

/**
 * @param {{ logo?: string, name?: string, clinicId?: number | string | null, onUploaded: (url: string) => void }} props
 */
export default function ClinicLogoUpload({ logo, name, clinicId, onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a JPG, PNG or WebP image');
      return;
    }
    if (file.size > CLINIC_LOGO_MAX_MB * 1024 * 1024) {
      toast.error(`Image must be ${CLINIC_LOGO_MAX_MB}MB or smaller`);
      return;
    }
    setUploading(true);
    try {
      const res = await uploadClinicLogo(file, clinicId || undefined);
      const url = res.data?.logo ?? res.data?.logo_url ?? '';
      onUploaded(url);
      toast.success(clinicId ? 'Clinic logo updated' : 'Logo ready — save clinic to apply');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Logo upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 flex flex-col sm:flex-row items-center gap-4">
      <ClinicLogo logo={logo} name={name} size="xl" />
      <div className="flex-1 text-center sm:text-left space-y-2">
        <p className="font-medium text-slate-800">Clinic logo</p>
        <p className="text-xs text-slate-500">
          Shown on clinic listings and booking. Recommended {CLINIC_LOGO_SIZE_HINT} · JPG, PNG or WebP · max {CLINIC_LOGO_MAX_MB}MB.
        </p>
        <label className="inline-flex">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={handleChange}
          />
          <span
            className={`btn-primary text-sm cursor-pointer inline-flex items-center gap-2 ${
              uploading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            <FaIcon icon={uploading ? 'fa-spinner' : 'fa-image'} className={uploading ? 'fa-spin' : ''} />
            {uploading ? 'Uploading…' : logo ? 'Change logo' : 'Upload logo'}
          </span>
        </label>
      </div>
    </div>
  );
}
