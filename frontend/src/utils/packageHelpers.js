export const PACKAGE_CATEGORIES = [
  { id: 'clinic', label: 'Clinic', emoji: '🏥', icon: 'fa-hospital' },
  { id: 'home_visit', label: 'Home Visit', emoji: '🏠', icon: 'fa-house-medical' },
  { id: 'online', label: 'Online', emoji: '💻', icon: 'fa-video' },
];

export function packageMatchesCategory(pkg, categoryId) {
  const type = pkg?.consultation_type || 'any';
  return type === 'any' || type === categoryId;
}

export function normalizePackagePricing(pkg) {
  const displayPrice = Number(pkg?.discount_price ?? pkg?.price ?? 0);
  const displayMrp = Number(pkg?.mrp_price ?? pkg?.price ?? displayPrice);
  const hasDiscount = displayMrp > displayPrice && displayMrp > 0;
  const discountPercent =
    pkg?.discount_percent ??
    (hasDiscount ? Math.round((1 - displayPrice / displayMrp) * 100) : 0);
  return { displayPrice, displayMrp, hasDiscount, discountPercent };
}

export function formatPackagePrice(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function perSessionPrice(price, sessions) {
  if (!sessions) return 0;
  return Math.round(Number(price) / Number(sessions));
}

export function parsePackageIncludes(pkg) {
  if (!pkg?.includes) {
    return [
      'Daily guided physiotherapy sessions',
      'Session-by-session progress tracking',
      'Personalised exercise prescription',
      'Dedicated physiotherapist support',
    ];
  }
  try {
    const parsed = JSON.parse(pkg.includes);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    /* plain text / bullets */
  }
  return String(pkg.includes)
    .split(/\n|•/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const CONSULTATION_OPTIONS = [
  { id: 'any', label: 'Flexible', icon: 'fa-shuffle', desc: 'Online, clinic, or home — as advised' },
  { id: 'online', label: 'Online', icon: 'fa-video', desc: 'Video sessions from home' },
  { id: 'clinic', label: 'Clinic visit', icon: 'fa-hospital', desc: 'In-clinic sessions' },
  { id: 'home_visit', label: 'Home visit', icon: 'fa-house-medical', desc: 'Physio at your doorstep' },
];

export const PACKAGE_HIGHLIGHTS = [
  { icon: 'fa-user-doctor', title: 'Expert guidance', desc: 'Licensed physiotherapists track every session' },
  { icon: 'fa-chart-line', title: 'Progress tracking', desc: 'Session-by-session completion dashboard' },
  { icon: 'fa-dumbbell', title: 'Exercise plans', desc: 'Custom rehab exercises with sets & reps' },
  { icon: 'fa-shield-heart', title: 'Structured care', desc: 'Evidence-based daily recovery roadmap' },
];
