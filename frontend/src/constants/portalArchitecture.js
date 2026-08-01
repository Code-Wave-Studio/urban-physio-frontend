/**
 * Shared portal architecture helpers — categorized menus + speed dials.
 * Presentational section metadata is separate from RBAC filtering.
 */

export const SECTION_META = {
  // Patient
  explore: { label: 'Explore', icon: 'fa-compass', tone: 'sky', defaultOpen: true },
  visits: { label: 'Visits & Consults', icon: 'fa-calendar-check', tone: 'orange', defaultOpen: true },
  health: { label: 'Health Records', icon: 'fa-heart-pulse', tone: 'rose', defaultOpen: false },
  billing: { label: 'Billing & Plans', icon: 'fa-wallet', tone: 'emerald', defaultOpen: false },
  settings: { label: 'Settings', icon: 'fa-gear', tone: 'slate', defaultOpen: false },

  // Doctor
  workspace: { label: 'Workspace', icon: 'fa-briefcase-medical', tone: 'teal', defaultOpen: true },
  clinical: { label: 'Clinical Tools', icon: 'fa-stethoscope', tone: 'violet', defaultOpen: false },
  practice: { label: 'Practice & Growth', icon: 'fa-chart-line', tone: 'sky', defaultOpen: false },
  finance: { label: 'Finance', icon: 'fa-indian-rupee-sign', tone: 'emerald', defaultOpen: false },

  // Clinic
  operations: { label: 'Operations', icon: 'fa-gauge-high', tone: 'emerald', defaultOpen: true },
  clinical_hub: { label: 'Clinical Hub', icon: 'fa-notes-medical', tone: 'violet', defaultOpen: false },
  settings_team: { label: 'Settings · Team', icon: 'fa-user-group', tone: 'sky', defaultOpen: false },
  settings_clinical: { label: 'Settings · Clinical', icon: 'fa-clipboard-list', tone: 'indigo', defaultOpen: false },
  settings_admin: { label: 'Settings · Admin', icon: 'fa-sliders', tone: 'slate', defaultOpen: false },

  // Admin
  core: { label: 'Core Operations', icon: 'fa-bolt', tone: 'orange', defaultOpen: true },
  network: { label: 'Network Hub', icon: 'fa-network-wired', tone: 'sky', defaultOpen: false },
  content: { label: 'Clinical & Content', icon: 'fa-book-medical', tone: 'violet', defaultOpen: false },
  finance_promos: { label: 'Finance & Promos', icon: 'fa-tags', tone: 'emerald', defaultOpen: false },
  settings_marketing: { label: 'Settings · Marketing', icon: 'fa-bullhorn', tone: 'rose', defaultOpen: false },
  settings_system: { label: 'Settings · System', icon: 'fa-server', tone: 'slate', defaultOpen: false },

  // Legacy clinic ops/settings aliases
  ops: { label: 'Operations', icon: 'fa-gauge-high', tone: 'emerald', defaultOpen: true },
};

export const TONE_CLASSES = {
  sky: { chip: 'bg-sky-100 text-sky-700', bar: 'from-sky-500 to-blue-600', soft: 'bg-sky-50' },
  orange: { chip: 'bg-orange-100 text-orange-700', bar: 'from-orange-500 to-amber-600', soft: 'bg-orange-50' },
  rose: { chip: 'bg-rose-100 text-rose-700', bar: 'from-rose-500 to-pink-600', soft: 'bg-rose-50' },
  emerald: { chip: 'bg-emerald-100 text-emerald-700', bar: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50' },
  slate: { chip: 'bg-slate-100 text-slate-600', bar: 'from-slate-500 to-slate-700', soft: 'bg-slate-50' },
  teal: { chip: 'bg-teal-100 text-teal-700', bar: 'from-teal-500 to-emerald-600', soft: 'bg-teal-50' },
  violet: { chip: 'bg-violet-100 text-violet-700', bar: 'from-violet-500 to-purple-600', soft: 'bg-violet-50' },
  indigo: { chip: 'bg-indigo-100 text-indigo-700', bar: 'from-indigo-500 to-blue-700', soft: 'bg-indigo-50' },
  primary: { chip: 'bg-primary-100 text-primary-700', bar: 'from-primary-500 to-orange-600', soft: 'bg-primary-50' },
};

/** Group flat nav links into ordered sections for accordion rendering. */
export function groupPortalNav(links = [], sectionOrder = []) {
  const map = new Map();
  for (const link of links) {
    const key = link.section || 'settings';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(link);
  }

  const keys = sectionOrder.length
    ? sectionOrder.filter((k) => map.has(k))
    : [...map.keys()];

  // Append any unexpected sections
  for (const k of map.keys()) {
    if (!keys.includes(k)) keys.push(k);
  }

  return keys.map((id) => {
    const meta = SECTION_META[id] || { label: id, icon: 'fa-folder', tone: 'slate', defaultOpen: false };
    return {
      id,
      ...meta,
      items: map.get(id) || [],
    };
  });
}

export function isNavLinkActive(pathname, link) {
  if (!link?.to) return false;
  if (link.match === 'exact') return pathname === link.to;
  if (link.match === 'prefix') {
    return pathname === link.to || pathname.startsWith(`${link.to}/`);
  }
  // Default: exact for root-ish dashboards, prefix otherwise when trailing segments exist
  if (pathname === link.to) return true;
  if (link.to !== '/' && pathname.startsWith(`${link.to}/`)) {
    // Avoid /patient matching /patient/foo when another more specific link exists — still OK for sidebar
    return true;
  }
  return false;
}
