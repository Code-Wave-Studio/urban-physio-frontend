import DashboardLayout from '../../layouts/DashboardLayout';
import AdvancedPatientSearch from '../../components/search/AdvancedPatientSearch';
import { DOCTOR_NAV } from '../../constants/doctorNav';

export default function DoctorAdvancedSearchPage() {
  return (
    <DashboardLayout links={DOCTOR_NAV} variant="doctor">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Advanced Patient Search</h1>
        <p className="text-sm text-slate-500 mt-1">
          Instantly find any of your patients — by name, phone, disease, diagnosis, date, city,
          package, session number, tags or treatment status.
        </p>
      </div>
      <AdvancedPatientSearch />
    </DashboardLayout>
  );
}
