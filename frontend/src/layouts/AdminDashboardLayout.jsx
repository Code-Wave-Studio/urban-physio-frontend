import Navbar from '../components/Navbar';

export default function AdminDashboardLayout({ children }) {
  return (
    <div className="min-h-screen relative admin-shell">
      <Navbar portalMode />
      <div className="admin-main-wrap">
        <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 animate-fade-in min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
