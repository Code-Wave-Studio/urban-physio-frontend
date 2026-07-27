import { Navigate } from 'react-router-dom';

/**
 * Feature Request "Availability" maps to the Calendar page
 * (rooms, leave, hours, holidays).
 */
export default function ClinicAvailabilityPage() {
  return <Navigate to="/clinic-portal/calendar" replace />;
}
