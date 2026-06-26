/** Client-side instant matches — mirrors backend pain catalog for hero/header search. */
export const SEARCH_CATALOG = [
  { title: 'Back Pain', slug: 'back-pain', keywords: ['back', 'backpain', 'spine', 'lumbar'] },
  { title: 'Neck Pain', slug: 'neck-pain', keywords: ['cervical', 'tech neck', 'neckpain'] },
  { title: 'Knee Pain', slug: 'knee-pain', keywords: ['knee', 'acl', 'meniscus', 'kneepain'] },
  { title: 'Shoulder Pain', slug: 'shoulder-pain', keywords: ['shoulder', 'rotator cuff', 'shoulderpain'] },
  { title: 'Sports Injury', slug: 'sports-injury', keywords: ['sports', 'sport', 'injury', 'sprain', 'athlete'] },
  { title: 'Hip Pain', slug: 'hip-pain', keywords: ['hip', 'groin', 'hippain'] },
  { title: 'Ankle Pain', slug: 'ankle-pain', keywords: ['ankle', 'foot', 'anklepain'] },
];

export const QUICK_SEARCH_TAGS = ['Back pain', 'Knee pain', 'Neck pain'];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Simple Levenshtein distance */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function fuzzyScore(query, text) {
  const q = norm(query);
  const t = norm(text);
  if (!q || !t) return 0;
  if (t.includes(q)) return 0.98;
  if (q.includes(t)) return 0.92;
  if (t.startsWith(q) || q.startsWith(t)) return 0.9;

  const qParts = q.split(' ').filter(Boolean);
  const tParts = t.split(' ').filter(Boolean);
  let partBest = 0;
  for (const qp of qParts) {
    for (const tp of tParts) {
      if (tp.includes(qp) || qp.includes(tp)) partBest = Math.max(partBest, 0.85);
      const dist = levenshtein(qp, tp);
      const maxLen = Math.max(qp.length, tp.length, 1);
      const sim = 1 - dist / maxLen;
      if (sim >= 0.55) partBest = Math.max(partBest, sim * 0.82);
    }
  }
  if (partBest > 0) return partBest;

  const dist = levenshtein(q, t);
  const maxLen = Math.max(q.length, t.length, 1);
  const sim = 1 - dist / maxLen;
  return sim >= 0.5 ? sim * 0.75 : 0;
}

/** @returns {{ treatments: object[], symptoms: object[] }} */
export function localSearchMatches(query) {
  const q = norm(query);
  if (q.length < 1) return { treatments: [], symptoms: [] };

  const treatments = [];
  const symptoms = [];
  const threshold = q.length <= 3 ? 0.45 : 0.5;

  for (const item of SEARCH_CATALOG) {
    let best = fuzzyScore(q, item.title);
    for (const kw of item.keywords) {
      best = Math.max(best, fuzzyScore(q, kw));
    }
    if (best >= threshold) {
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

  treatments.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  symptoms.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

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
    packages: data.packages ?? [],
    articles: data.articles ?? [],
    exercises: data.exercises ?? [],
  };
}
