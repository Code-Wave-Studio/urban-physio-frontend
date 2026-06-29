import ClinicCard from '../ClinicCard';

export default function SearchClinicCard({ clinic, onTrack }) {
  return (
    <div onClick={() => onTrack?.('clinic', String(clinic.id))} role="presentation">
      <ClinicCard clinic={clinic} variant="listing" />
    </div>
  );
}
