import DashboardLayout from './DashboardLayout';
import { ADMIN_NAV } from '../constants/adminNav';
import { useTeleRehabPageName } from '../hooks/useTeleRehabPageName';

export default function AdminDashboardLayout({ children }) {
  const telePageName = useTeleRehabPageName();
  const links = ADMIN_NAV.map((link) =>
    link.to === '/admin/telephysio' ? { ...link, label: telePageName } : link
  );
  return (
    <DashboardLayout links={links} variant="admin">
      {children}
    </DashboardLayout>
  );
}
