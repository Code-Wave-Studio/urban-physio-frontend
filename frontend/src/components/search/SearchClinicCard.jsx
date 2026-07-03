import ClinicCard from '../ClinicCard';

export default function SearchClinicCard({ clinic, onTrack }) {
  return (
    <ClinicCard
      clinic={clinic}
      variant="listing"
      onOpen={() => onTrack?.('clinic', String(clinic.id))}
    />
  );
}
