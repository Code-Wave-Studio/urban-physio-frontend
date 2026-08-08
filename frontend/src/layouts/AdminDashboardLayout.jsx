import DashboardLayout from './DashboardLayout';

export default function AdminDashboardLayout({ children }) {
  return (
    <DashboardLayout links={[]} variant="admin">
      {children}
    </DashboardLayout>
  );
}

