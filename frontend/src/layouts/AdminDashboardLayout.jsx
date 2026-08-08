import DashboardLayout from './DashboardLayout';
import { ADMIN_NAV } from '../constants/adminNav';

export default function AdminDashboardLayout({ children }) {
  return (
    <DashboardLayout links={ADMIN_NAV} variant="admin">
      {children}
    </DashboardLayout>
  );
}
