import FaIcon from '../FaIcon';
import { buildDoctorQualifications } from '../../utils/doctorProfileUtils';

const headingClass = {
  default: 'text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2',
  compact: 'text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2',
};

/**
 * Professional qualifications, certifications, and experience for doctor profiles & popups.
 *
 * @param {{ doctor: object, variant?: 'default' | 'compact' }} props
 */
export default function DoctorCredentialsSection({ doctor, variant = 'default', className = '' }) {
  const compact = variant === 'compact';
  const qualifications = buildDoctorQualifications(doctor);
  const certifications = doctor.certifications_list?.length ? doctor.certifications_list : [];
  const timeline = doctor.experience_timeline_list?.length ? doctor.experience_timeline_list : [];

  const hasContent = qualifications.length > 0 || certifications.length > 0 || timeline.length > 0;
  if (!hasContent) return null;

  const heading = headingClass[variant] || headingClass.default;

  return (
    <div className={`${compact ? 'space-y-5' : 'space-y-6'} ${className}`.trim()}>
      {qualifications.length > 0 && (
        <div>
          <h3 className={heading}>
            <FaIcon icon="fa-graduation-cap" className={compact ? 'text-primary-500 text-xs' : 'text-primary-600'} />
            Qualifications
          </h3>
          <div className={`grid gap-2.5 ${compact ? '' : 'sm:grid-cols-2 gap-3'}`}>
            {qualifications.map((q) => (
              <div
                key={`${q.title}-${q.institution}`}
                className={`rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50/80 to-white shadow-sm ${
                  compact ? 'px-3 py-2.5' : 'px-4 py-3.5'
                }`}
              >
                <p className={`font-bold uppercase tracking-wider text-primary-600 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                  {q.title}
                </p>
                <p className={`font-semibold text-slate-800 mt-0.5 leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
                  {q.institution}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {certifications.length > 0 && (
        <div>
          <h3 className={heading}>
            <FaIcon icon="fa-certificate" className={compact ? 'text-amber-500 text-xs' : 'text-amber-600'} />
            Certifications
          </h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {certifications.map((cert) => (
              <span
                key={cert}
                className={`inline-flex items-center gap-1.5 rounded-xl bg-amber-50 text-amber-900 font-medium border border-amber-100/80 shadow-sm ${
                  compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
                }`}
              >
                <FaIcon icon="fa-award" className="text-amber-500 text-[10px] shrink-0" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {timeline.length > 0 && (
        <div>
          <h3 className={heading}>
            <FaIcon icon="fa-briefcase-medical" className={compact ? 'text-emerald-500 text-xs' : 'text-emerald-600'} />
            Experience
          </h3>
          <ol className={`relative border-l-2 border-emerald-200/80 ml-3 ${compact ? 'space-y-0' : 'space-y-0'}`}>
            {timeline.map((entry, idx) => (
              <li key={`${entry.organization}-${idx}`} className="relative pl-5 pb-4 last:pb-0">
                <span className="absolute -left-[7px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" />
                {entry.duration && (
                  <p className={`font-bold text-slate-900 leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
                    {entry.duration}
                  </p>
                )}
                {entry.organization && (
                  <p className={`text-slate-600 mt-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>{entry.organization}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
