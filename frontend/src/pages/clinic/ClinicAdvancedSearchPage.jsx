import ClinicPortalShell from '../../components/clinic/ClinicPortalShell';
import AdvancedPatientSearch from '../../components/search/AdvancedPatientSearch';

export default function ClinicAdvancedSearchPage() {
  return (
    <ClinicPortalShell
      title="Advanced Patient Search"
      subtitle="Instantly find any clinic patient — by name, phone, disease, diagnosis, therapist, date, city, package, session number, tags or treatment status."
    >
      <AdvancedPatientSearch />
    </ClinicPortalShell>
  );
}
