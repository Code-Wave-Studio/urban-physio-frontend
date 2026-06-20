/** Client-side instant matches — mirrors backend pain catalog for hero/header search. */
export const SEARCH_CATALOG = [
  { title: 'Back Pain', slug: 'back-pain', keywords: ['back', 'backpain', 'spine', 'lumbar'] },
  { title: 'Neck Pain', slug: 'neck-pain', keywords: ['neck', 'cervical', 'tech neck'] },
  { title: 'Knee Pain', slug: 'knee-pain', keywords: ['knee', 'acl', 'meniscus'] },
  { title: 'Shoulder Pain', slug: 'shoulder-pain', keywords: ['shoulder', 'rotator cuff'] },
  { title: 'Sports Injury', slug: 'sports-injury', keywords: ['sports', 'sport', 'injury', 'sprain'] },
  { title: 'Hip Pain', slug: 'hip-pain', keywords: ['hip', 'groin'] },
  { title: 'Ankle Pain', slug: 'ankle-pain', keywords: ['ankle', 'foot'] },
];

export const QUICK_SEARCH_TAGS = ['Back pain', 'Knee pain', 'Neck pain', 'Sports injury'];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function score(query, text) {
  const q = norm(query);
  const t = norm(text);
  if (!q || !t) return 0;
  if (t.includes(q) || q.includes(t)) return 0.95;
  if (t.startsWith(q) || q.startsWith(t)) return 0.88;
  return 0;
}

/** @returns {{ treatments: object[], symptoms: object[] }} */
export function localSearchMatches(query) {
  const q = norm(query);
  if (q.length < 2) return { treatments: [], symptoms: [] };

  const treatments = [];
  const symptoms = [];

  for (const item of SEARCH_CATALOG) {
    let best = score(q, item.title);
    for (const kw of item.keywords) {
      best = Math.max(best, score(q, kw));
    }
    if (best >= 0.5) {
      treatments.push({
        id: null,
        title: item.title,
        slug: item.slug,
        short_description: 'Popular physiotherapy treatment',
        source: 'catalog',
        match_score: best,
      });
      symptoms.push({
        id: `cat-${item.slug}`,
        title: item.title,
        chip_label: item.title,
        source: 'catalog',
        match_score: best,
      });
    }
  }

  return { treatments, symptoms };
}

export function mergeSearchResults(apiData, localData) {
  const data = apiData || {};
  const local = localData || { treatments: [], symptoms: [] };

  const treatments = [...(data.treatments || [])];
  const seenSlugs = new Set(treatments.map((t) => t.slug).filter(Boolean));
  for (const t of local.treatments) {
    if (t.slug && !seenSlugs.has(t.slug)) treatments.push(t);
  }

  const symptoms = [...(data.symptoms || [])];
  const seenSym = new Set(symptoms.map((s) => s.title || s.chip_label));
  for (const s of local.symptoms) {
    const key = s.title || s.chip_label;
    if (key && !seenSym.has(key)) symptoms.push(s);
  }

  return {
    doctors: data.doctors ?? [],
    clinics: data.clinics ?? [],
    conditions: data.conditions ?? [],
    treatments,
    symptoms,
    locations: data.locations ?? [],
  };
}
