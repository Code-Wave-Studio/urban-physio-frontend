import { useEffect } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ClinicBottomSheet from './ClinicBottomSheet';
import ClinicPreviewModal from '../preview/ClinicPreviewModal';

import { setFloatingActionsHidden } from '../../utils/floatingActionsBus';

/** Mobile: bottom sheet. Tablet & desktop (md+): centered modal like doctor cards. */
export default function ClinicPreview({ open, onClose, clinic }) {
  const isTabletOrDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (isTabletOrDesktop || !open) return undefined;
    setFloatingActionsHidden(true);
    return () => setFloatingActionsHidden(false);
  }, [open, isTabletOrDesktop]);

  if (isTabletOrDesktop) {
    return <ClinicPreviewModal clinic={clinic} open={open} onClose={onClose} />;
  }
  return <ClinicBottomSheet clinic={clinic} open={open} onClose={onClose} />;
}
