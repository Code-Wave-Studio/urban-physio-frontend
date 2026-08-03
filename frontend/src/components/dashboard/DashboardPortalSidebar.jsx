import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FaIcon from '../FaIcon';
import Logo from '../Logo';
import PortalNavSections from '../portal/PortalNavSections';
import PortalSpeedDial from '../portal/PortalSpeedDial';
import PortalProfileCard from '../portal/PortalProfileCard';
import { PATIENT_SPEED_DIAL, PATIENT_SECTION_ORDER } from '../../constants/patientNav';
import { DOCTOR_SPEED_DIAL, DOCTOR_SECTION_ORDER } from '../../constants/doctorNav';
import { CLINIC_SPEED_DIAL, CLINIC_SECTION_ORDER } from '../../constants/clinicNav';
import { isClinicNavActive } from '../../constants/clinicNav';

/**
 * Slide-in sidebar for Doctor, Patient & Clinic portals.
 * Categorized accordion menus + speed dial + profile card.
 */
export default function DashboardPortalSidebar({
  open,
  onClose,
  links,
  unreadCount = 0,
  title,
  subtitle,
  accent = 'primary',
  footerExtra = null,
  logoSrc = null,
  logoAlt = 'The Urban Physio',
  variant = 'patient',
  clinicId = null,
  clinicClosed = false,
  avatarUrl = null,
  onAvatarUpdated,
}) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const accentLabel =
    accent === 'teal' ? 'text-teal-700' : accent === 'emerald' ? 'text-emerald-700' : 'text-primary-600';

  const sectionOrder =
    variant === 'doctor'
      ? DOCTOR_SECTION_ORDER
      : variant === 'clinic'
        ? CLINIC_SECTION_ORDER
        : PATIENT_SECTION_ORDER;

  const speedDial =
    variant === 'doctor'
      ? DOCTOR_SPEED_DIAL
      : variant === 'clinic'
        ? CLINIC_SPEED_DIAL
        : PATIENT_SPEED_DIAL;

  const showPresence = variant === 'doctor' || variant === 'clinic';
  const presenceOnline =
    variant === 'clinic' ? !clinicClosed : Number(user?.profile_public ?? 1) === 1;

  const displayName =
    variant === 'doctor'
      ? `Dr. ${user?.first_name || ''} ${user?.last_name || ''}`.trim()
      : `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || subtitle;

  const onSpeedAction = (action) => {
    if (action === 'book') {
      window.dispatchEvent(new CustomEvent('clinic-fab-open', { detail: { mode: 'booking' } }));
    }
    if (action === 'new-patient') {
      window.dispatchEvent(new CustomEvent('clinic-fab-open', { detail: { mode: 'patient' } }));
    }
  };

  // Fallback flat render if links have no sections (legacy)
  const hasSections = Array.isArray(links) && links.some((l) => l.section);

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className={`admin-sidebar-backdrop fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`admin-sidebar fixed left-0 z-[95] w-[min(18rem,88vw)] flex flex-col glass-strong border-r border-white/60 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] lg:top-16 lg:h-[calc(100vh-4rem)] lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b border-slate-200/80 lg:hidden shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Logo
              linkToHome={false}
              showText={false}
              className="h-9 w-auto max-w-[110px] object-contain shrink-0"
              src={logoSrc || undefined}
              alt={logoAlt}
            />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm">{title}</p>
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            </div>
          </div>
          <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close menu">
            <FaIcon icon="fa-xmark" />
          </button>
        </div>

        <div className="hidden lg:block p-4 pb-3 border-b border-slate-200/80 shrink-0 space-y-3">
          <div className="flex items-center gap-3">
            <Logo
              linkToHome={false}
              showText={false}
              className="h-11 w-auto max-w-[130px] object-contain shrink-0"
              src={logoSrc || undefined}
              alt={logoAlt}
            />
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${accentLabel}`}>{title}</p>
              <p className="text-[10px] text-slate-500 truncate mt-1">{subtitle}</p>
            </div>
          </div>
          <PortalProfileCard
            name={displayName}
            roleLabel={title}
            avatarUrl={avatarUrl || user?.avatar}
            accent={accent}
            showPresence={showPresence}
            presenceOnline={presenceOnline}
            allowAvatarUpload={variant === 'doctor' || variant === 'patient'}
            onAvatarUpdated={onAvatarUpdated}
            clinicId={variant === 'clinic' ? clinicId : null}
          />
          <PortalSpeedDial items={speedDial} onAction={onSpeedAction} onNavigate={onClose} />
        </div>

        {/* Mobile: profile + speed dial under header */}
        <div className="lg:hidden px-3 pt-2.5 space-y-2.5 shrink-0">
          <PortalProfileCard
            name={displayName}
            roleLabel={title}
            avatarUrl={avatarUrl || user?.avatar}
            accent={accent}
            showPresence={showPresence}
            presenceOnline={presenceOnline}
            allowAvatarUpload={variant === 'doctor' || variant === 'patient'}
            onAvatarUpdated={onAvatarUpdated}
            clinicId={variant === 'clinic' ? clinicId : null}
          />
          <PortalSpeedDial items={speedDial} onAction={onSpeedAction} onNavigate={onClose} />
        </div>

        <nav className="dashboard-sidebar-nav flex-1 p-3 overflow-y-auto overscroll-contain" aria-label="Portal navigation">
          {hasSections ? (
            <PortalNavSections
              links={links}
              sectionOrder={sectionOrder}
              unreadCount={unreadCount}
              onNavigate={onClose}
              accent={accent}
              open={open}
            />
          ) : (
            <div className="space-y-0.5">
              {(links || []).map((link) => {
                const active = isClinicNavActive(pathname, link) || pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={`portal-nav-link ${
                      active
                        ? accent === 'teal'
                          ? 'portal-nav-link--active-teal'
                          : accent === 'emerald'
                            ? 'portal-nav-link--active-emerald'
                            : 'portal-nav-link--active-primary'
                        : ''
                    }`}
                  >
                    <FaIcon icon={link.icon} className="text-sm w-6 text-center" />
                    <span className="truncate flex-1">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200/80 shrink-0 text-xs text-slate-500 space-y-3">
          {footerExtra}
          <Link to="/" className={`${accentLabel} font-medium hover:underline inline-flex items-center gap-1`}>
            <FaIcon icon="fa-arrow-up-right-from-square" className="text-[10px]" />
            View public site
          </Link>
        </div>
      </aside>
    </>
  );
}
