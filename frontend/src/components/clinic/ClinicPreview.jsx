import { useMediaQuery } from '../../hooks/useMediaQuery';
import ClinicBottomSheet from './ClinicBottomSheet';
import ClinicPreviewModal from '../preview/ClinicPreviewModal';

/** Mobile: bottom sheet. Tablet & desktop (md+): centered modal like doctor cards. */
export default function ClinicPreview({ open, onClose, clinic }) {
  const isTabletOrDesktop = useMediaQuery('(min-width: 768px)');

  if (isTabletOrDesktop) {
    return <ClinicPreviewModal clinic={clinic} open={open} onClose={onClose} />;
  }
  return <ClinicBottomSheet clinic={clinic} open={open} onClose={onClose} />;
}
