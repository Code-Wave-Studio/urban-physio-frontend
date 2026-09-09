/** Fallback 3D-style illustrations when a CMS image has not been uploaded. */

function ConsultVisual() {
  return (
    <svg viewBox="0 0 280 220" className="enrol-fallback-svg" aria-hidden="true">
      <ellipse cx="140" cy="198" rx="78" ry="10" fill="currentColor" opacity="0.08" />
      <rect x="72" y="58" width="136" height="118" rx="14" fill="#fff" stroke="#e2e8f0" strokeWidth="3" />
      <rect x="72" y="58" width="136" height="32" rx="14" fill="#f97316" />
      <rect x="72" y="76" width="136" height="14" fill="#f97316" />
      <g fill="#fff">
        <circle cx="96" cy="74" r="5" />
        <circle cx="180" cy="74" r="5" />
      </g>
      <g fill="#e2e8f0">
        <rect x="92" y="106" width="22" height="18" rx="4" />
        <rect x="122" y="106" width="22" height="18" rx="4" />
        <rect x="152" y="106" width="22" height="18" rx="4" />
        <rect x="92" y="132" width="22" height="18" rx="4" />
        <rect x="152" y="132" width="22" height="18" rx="4" />
      </g>
      <rect x="122" y="132" width="22" height="18" rx="4" fill="#fecaca" />
      <path d="M126 136 l6 6 10-11" fill="none" stroke="#ef4444" strokeWidth="2.6" strokeLinecap="round" />
      <g transform="translate(188 118) rotate(-18)">
        <rect x="0" y="18" width="46" height="14" rx="7" fill="#ef4444" />
        <circle cx="8" cy="12" r="14" fill="#ef4444" />
        <circle cx="8" cy="12" r="7" fill="#fee2e2" />
        <rect x="28" y="8" width="12" height="22" rx="4" fill="#dc2626" />
      </g>
    </svg>
  );
}

function AllotmentVisual() {
  return (
    <svg viewBox="0 0 280 220" className="enrol-fallback-svg" aria-hidden="true">
      <ellipse cx="140" cy="198" rx="82" ry="10" fill="currentColor" opacity="0.08" />
      <rect x="58" y="128" width="164" height="22" rx="6" fill="#b45309" />
      <rect x="52" y="146" width="176" height="12" rx="4" fill="#92400e" />
      <g transform="translate(86 72)">
        <circle cx="28" cy="18" r="16" fill="#fdba74" />
        <path d="M8 58c4-22 14-30 20-30s16 8 20 30" fill="#f97316" />
        <rect x="18" y="46" width="20" height="28" rx="6" fill="#ea580c" />
      </g>
      <g transform="translate(148 88)">
        <circle cx="22" cy="16" r="14" fill="#93c5fd" />
        <path d="M4 52c3-18 12-24 18-24s15 6 18 24" fill="#3b82f6" />
        <rect x="38" y="28" width="36" height="10" rx="5" fill="#60a5fa" />
      </g>
    </svg>
  );
}

function AnalysisVisual() {
  return (
    <svg viewBox="0 0 280 220" className="enrol-fallback-svg" aria-hidden="true">
      <ellipse cx="140" cy="198" rx="78" ry="10" fill="currentColor" opacity="0.08" />
      <rect x="148" y="78" width="92" height="72" rx="10" fill="#fb923c" />
      <rect x="156" y="88" width="76" height="48" rx="6" fill="#1e293b" />
      <circle cx="194" cy="112" r="14" fill="#93c5fd" />
      <g transform="translate(68 70)">
        <circle cx="40" cy="36" r="28" fill="#3b82f6" />
        <circle cx="40" cy="32" r="16" fill="#93c5fd" />
        <path d="M16 88c6-28 16-38 24-38s18 10 24 38" fill="#2563eb" />
        <path d="M8 40c-10 4-14 18-8 28 8 4 18-2 22-12" fill="none" stroke="#1d4ed8" strokeWidth="8" strokeLinecap="round" />
        <path d="M72 40c10 4 14 18 8 28-8 4-18-2-22-12" fill="none" stroke="#1d4ed8" strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function PlanVisual() {
  return (
    <svg viewBox="0 0 280 220" className="enrol-fallback-svg" aria-hidden="true">
      <ellipse cx="140" cy="198" rx="78" ry="10" fill="currentColor" opacity="0.08" />
      <rect x="88" y="42" width="104" height="132" rx="12" fill="#fff" stroke="#e2e8f0" strokeWidth="3" />
      <rect x="88" y="42" width="104" height="28" rx="12" fill="#f97316" />
      <rect x="88" y="56" width="104" height="16" fill="#f97316" />
      <g fill="#e2e8f0">
        <rect x="108" y="86" width="64" height="8" rx="4" />
        <rect x="108" y="104" width="52" height="8" rx="4" />
        <rect x="108" y="122" width="64" height="8" rx="4" />
        <rect x="108" y="140" width="44" height="8" rx="4" />
      </g>
      <g transform="translate(176 108) rotate(18)">
        <rect x="0" y="0" width="14" height="78" rx="4" fill="#fb923c" />
        <polygon points="0,78 14,78 7,94" fill="#ea580c" />
        <rect x="2" y="6" width="10" height="14" rx="2" fill="#fdba74" />
      </g>
    </svg>
  );
}

function WorkoutVisual() {
  return (
    <svg viewBox="0 0 280 220" className="enrol-fallback-svg" aria-hidden="true">
      <ellipse cx="140" cy="198" rx="70" ry="10" fill="currentColor" opacity="0.08" />
      <rect x="96" y="28" width="88" height="158" rx="16" fill="#1e293b" />
      <rect x="104" y="44" width="72" height="126" rx="8" fill="#eff6ff" />
      <circle cx="140" cy="78" r="16" fill="#fb7185" />
      <path d="M118 128c6-22 14-30 22-30s16 8 22 30" fill="#3b82f6" />
      <g transform="translate(168 52)">
        <circle cx="28" cy="28" r="22" fill="#ef4444" />
        <rect x="16" y="24" width="24" height="8" rx="3" fill="#fff" />
        <circle cx="12" cy="28" r="7" fill="#fff" />
        <circle cx="44" cy="28" r="7" fill="#fff" />
      </g>
    </svg>
  );
}

function CheckinVisual() {
  return (
    <svg viewBox="0 0 280 220" className="enrol-fallback-svg" aria-hidden="true">
      <ellipse cx="140" cy="198" rx="78" ry="10" fill="currentColor" opacity="0.08" />
      <rect x="78" y="52" width="124" height="118" rx="14" fill="#fff" stroke="#e2e8f0" strokeWidth="3" />
      <rect x="78" y="52" width="124" height="32" rx="14" fill="#f97316" />
      <rect x="78" y="70" width="124" height="14" fill="#f97316" />
      <g fill="#fff">
        <circle cx="100" cy="68" r="5" />
        <circle cx="180" cy="68" r="5" />
      </g>
      <g fill="#dbeafe">
        <rect x="96" y="100" width="20" height="16" rx="3" />
        <rect x="124" y="100" width="20" height="16" rx="3" />
        <rect x="152" y="100" width="20" height="16" rx="3" />
        <rect x="96" y="124" width="20" height="16" rx="3" />
        <rect x="124" y="124" width="20" height="16" rx="3" />
        <rect x="152" y="124" width="20" height="16" rx="3" />
      </g>
      <circle cx="196" cy="148" r="28" fill="#fb923c" />
      <path d="M184 148 l8 8 16-16" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReviewVisual() {
  return (
    <svg viewBox="0 0 280 220" className="enrol-fallback-svg" aria-hidden="true">
      <ellipse cx="140" cy="198" rx="78" ry="10" fill="currentColor" opacity="0.08" />
      <rect x="78" y="40" width="112" height="140" rx="12" fill="#fff" stroke="#e2e8f0" strokeWidth="3" />
      <rect x="94" y="28" width="80" height="18" rx="6" fill="#ef4444" />
      <g fill="#fdba74">
        <rect x="96" y="64" width="18" height="14" rx="3" />
        <rect x="96" y="86" width="18" height="14" rx="3" />
        <rect x="96" y="108" width="18" height="14" rx="3" />
      </g>
      <g fill="#e2e8f0">
        <rect x="122" y="66" width="48" height="8" rx="4" />
        <rect x="122" y="88" width="48" height="8" rx="4" />
        <rect x="122" y="110" width="40" height="8" rx="4" />
      </g>
      <g transform="translate(168 118)">
        <circle cx="28" cy="28" r="24" fill="none" stroke="#60a5fa" strokeWidth="10" />
        <rect x="44" y="44" width="14" height="36" rx="7" fill="#3b82f6" transform="rotate(40 51 62)" />
      </g>
    </svg>
  );
}

const MAP = {
  consult: ConsultVisual,
  allotment: AllotmentVisual,
  analysis: AnalysisVisual,
  plan: PlanVisual,
  workout: WorkoutVisual,
  checkin: CheckinVisual,
  review: ReviewVisual,
};

export default function EnrolStepVisual({ visual = 'consult' }) {
  const Comp = MAP[visual] || ConsultVisual;
  return <Comp />;
}
