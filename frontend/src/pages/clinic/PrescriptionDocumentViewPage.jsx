import { useSearchParams } from 'react-router-dom';
import PrescriptionDocViewer from '../../components/documents/PrescriptionDocViewer';

export default function PrescriptionDocumentViewPage() {
  const [searchParams] = useSearchParams();
  const rxNum = searchParams.get('rx') || 'RX-2026-0041';
  const patientKey = searchParams.get('patient') || 'p-13';

  return (
    <div className="min-h-screen bg-slate-950 p-2 sm:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-6xl h-[92vh]">
        <PrescriptionDocViewer rxNumber={rxNum} patientKey={patientKey} />
      </div>
    </div>
  );
}
