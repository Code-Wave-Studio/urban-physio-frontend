import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import AdvancedPatientSearch from '../../components/search/AdvancedPatientSearch';

export default function AdminAdvancedSearchPage() {
  return (
    <AdminDashboardLayout>
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Advanced Patient Search</h1>
        <p className="text-sm text-slate-500 mt-1">
          Instantly find any patient across the whole platform — by name, phone, disease,
          diagnosis, therapist, date, city, package, session number, tags or treatment status.
        </p>
      </div>
      <AdvancedPatientSearch />
    </AdminDashboardLayout>
  );
}
