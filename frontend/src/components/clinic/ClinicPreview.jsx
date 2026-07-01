import { useMediaQuery } from '../../hooks/useMediaQuery';
import ClinicBottomSheet from './ClinicBottomSheet';
import ClinicPreviewModal from '../preview/ClinicPreviewModal';

/** Mobile: bottom sheet. Tablet & desktop (md+): centered modal like doctor cards. */
export default function ClinicPreview(props) {
  const isTabletOrDesktop = useMediaQuery('(min-width: 768px)');
  if (isTabletOrDesktop) {
    return <ClinicPreviewModal {...props} />;
  }
  return <ClinicBottomSheet {...props} />;
}
