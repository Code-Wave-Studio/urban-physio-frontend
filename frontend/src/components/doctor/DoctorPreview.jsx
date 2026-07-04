import { useMediaQuery } from '../../hooks/useMediaQuery';
import DoctorBottomSheet from './DoctorBottomSheet';
import DoctorPreviewModal from '../preview/DoctorPreviewModal';

/** Mobile: bottom sheet. Tablet & desktop (md+): centered modal like clinic cards. */
export default function DoctorPreview({ open, onClose, doctor }) {
  const isTabletOrDesktop = useMediaQuery('(min-width: 768px)');

  if (isTabletOrDesktop) {
    return <DoctorPreviewModal doctor={doctor} open={open} onClose={onClose} />;
  }
  return <DoctorBottomSheet doctor={doctor} open={open} onClose={onClose} />;
}
