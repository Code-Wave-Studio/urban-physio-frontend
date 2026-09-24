import { useState } from 'react';

const HERO_IMG = `${import.meta.env.BASE_URL}faqs.svg`;

function FaqIllustrationSvg() {
  return (
    <svg
      viewBox="0 0 320 260"
      className="relative w-full h-auto max-h-[220px] md:max-h-[260px] mx-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="160" cy="228" rx="120" ry="14" fill="#0ea5e9" fillOpacity="0.12" />
      <rect x="88" y="168" width="144" height="10" rx="4" fill="#0369a1" fillOpacity="0.15" />
      <rect x="96" y="178" width="8" height="42" rx="2" fill="#64748b" fillOpacity="0.35" />
      <rect x="216" y="178" width="8" height="42" rx="2" fill="#64748b" fillOpacity="0.35" />
      <rect x="118" y="148" width="84" height="52" rx="6" fill="#0c4a6e" fillOpacity="0.85" />
      <rect x="124" y="154" width="72" height="38" rx="4" fill="#e0f2fe" />
      <circle cx="160" cy="172" r="10" fill="#0284c7" fillOpacity="0.25" />
      <path d="M155 172h10M160 167v10" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
      <circle cx="248" cy="118" r="22" fill="#fde68a" />
      <path d="M226 142c4-18 40-18 44 0v8H226v-8z" fill="#0284c7" />
      <rect x="232" y="150" width="32" height="36" rx="8" fill="#0369a1" />
      <path d="M240 158h16M240 166h12" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
      <path d="M258 128c8 0 12 6 12 12" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="270" cy="142" r="4" fill="#0ea5e9" />
      <circle cx="72" cy="132" r="18" fill="#fcd34d" />
      <path d="M54 152c6-20 36-20 42 0v6H54v-6z" fill="#7c3aed" fillOpacity="0.85" />
      <rect x="58" y="158" width="28" height="28" rx="6" fill="#6d28d9" fillOpacity="0.9" />
      <rect x="168" y="52" width="118" height="72" rx="14" fill="white" stroke="#bae6fd" strokeWidth="2" />
      <path d="M168 108 L148 118 L168 100 Z" fill="white" stroke="#bae6fd" strokeWidth="2" strokeLinejoin="round" />
      <text x="188" y="78" fill="#0369a1" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
        FAQ
      </text>
      <rect x="188" y="86" width="78" height="6" rx="3" fill="#e0f2fe" />
      <rect x="188" y="98" width="62" height="6" rx="3" fill="#e0f2fe" />
      <circle cx="42" cy="68" r="20" fill="#0284c7" fillOpacity="0.12" stroke="#0284c7" strokeWidth="2" />
      <text x="42" y="74" textAnchor="middle" fill="#0369a1" fontSize="18" fontWeight="800" fontFamily="system-ui,sans-serif">
        ?
      </text>
      <rect x="24" y="168" width="52" height="44" rx="8" fill="white" stroke="#7dd3fc" strokeWidth="1.5" />
      <rect x="24" y="168" width="52" height="14" rx="8" fill="#0284c7" fillOpacity="0.85" />
    </svg>
  );
}

/** FAQ column illustration — hero asset + decorative fallback */
export default function FaqIllustration() {
  const [useHero, setUseHero] = useState(true);

  return (
    <div
      className="relative mt-6 rounded-2xl overflow-hidden border border-primary-100/60 bg-gradient-to-br from-primary-50/90 via-white to-orange-50/80 shadow-sm"
      aria-hidden="true"
    >
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-primary-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-300/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-3 md:p-4 flex flex-col items-center justify-end min-h-[200px] md:min-h-[240px]">
        {useHero ? (
          <img
            src={HERO_IMG}
            alt=""
            className="w-full max-w-[280px] h-auto object-contain drop-shadow-md animate-float"
            style={{ animationDuration: '5s' }}
            onError={() => setUseHero(false)}
          />
        ) : (
          <FaqIllustrationSvg />
        )}

        
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur border border-primary-100 text-primary-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          24/7 Help
        </span>
        <span className="absolute top-12 right-3 bg-primary-600 text-white text-[10px] font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md">
          ?
        </span>
        <span className="absolute bottom-14 left-6 bg-white/95 border border-orange-100 text-orange-800 text-[10px] font-semibold px-2 py-1 rounded-lg shadow-sm">
          Book · Ask · Heal
        </span>
      </div>

      <p className="relative text-center text-[11px] text-slate-500 pb-3 font-medium">
        Expert answers · Book anytime
      </p>
    </div>
  );
}
