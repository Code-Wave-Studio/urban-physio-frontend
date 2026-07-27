import { Navigate } from 'react-router-dom';

/**
 * Feature Request "Availability" maps to existing Calendar (rooms, leave, hours).
 */
export default function ClinicAvailabilityPage() {
  return <Navigate to="/clinic-portal/calendar" replace />;
}
