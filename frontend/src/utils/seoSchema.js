/**
 * Pure helpers for building / merging JSON-LD. No DOM access so they can be unit tested with node --test.
 */

/** Node types that should appear at most once per page; the first source to provide one wins. */
const SINGLETON_GROUPS = {
  WebPage: 'page',
  MedicalWebPage: 'page',
  CollectionPage: 'page',
  AboutPage: 'page',
  ContactPage: 'page',
  FAQPage: 'faq',
  BreadcrumbList: 'breadcrumb',
  WebSite: 'website',
  Organization: 'organization',
  MedicalOrganization: 'organization',
  ItemList: 'itemlist',
};

function typesOf(node) {
  const t = node?.['@type'];
  if (Array.isArray(t)) return t.filter((x) => typeof x === 'string');
  return typeof t === 'string' ? [t] : [];
}

function flattenNodes(source) {
  if (!source) return [];
  if (Array.isArray(source)) return source.flatMap(flattenNodes);
  if (typeof source !== 'object') return [];
  if (Array.isArray(source['@graph'])) return source['@graph'].flatMap(flattenNodes);
  const { '@context': _ctx, ...rest } = source;
  return [rest];
}

/** A FAQPage / BreadcrumbList / ItemList with nothing in it is invalid or useless structured data. */
function isEmptyNode(node) {
  const types = typesOf(node);
  if (types.includes('FAQPage')) {
    return !Array.isArray(node.mainEntity) || node.mainEntity.length === 0;
  }
  if (types.includes('BreadcrumbList')) {
    return !Array.isArray(node.itemListElement) || node.itemListElement.length < 2;
  }
  if (types.includes('ItemList')) {
    return !Array.isArray(node.itemListElement) || node.itemListElement.length === 0;
  }
  return false;
}

/**
 * Merge several JSON-LD sources into one `@graph`.
 * Earlier sources win for singleton node types (so admin/CMS-controlled data outranks the page default),
 * while page-specific types that the CMS does not provide (Service, OfferCatalog, ...) are still added.
 * Empty FAQ / breadcrumb / list nodes are dropped.
 *
 * @param {...(object|object[]|null|undefined)} sources
 * @returns {object|null}
 */
export function mergeJsonLd(...sources) {
  const taken = new Set();
  const seenExact = new Set();
  const out = [];

  sources.forEach((source) => {
    flattenNodes(source).forEach((node) => {
      if (!node || typeof node !== 'object' || typesOf(node).length === 0) return;
      if (isEmptyNode(node)) return;

      const groups = typesOf(node).map((t) => SINGLETON_GROUPS[t]).filter(Boolean);
      if (groups.length) {
        if (groups.some((g) => taken.has(g))) return;
        // Claim the group only after we know this node is kept; take all groups it covers.
        groups.forEach((g) => taken.add(g));
      }

      const exact = JSON.stringify(node);
      if (seenExact.has(exact)) return;
      seenExact.add(exact);
      out.push(node);
    });
  });

  if (!out.length) return null;
  return { '@context': 'https://schema.org', '@graph': out };
}

/**
 * "₹1,200", "Rs. 1,500 / session", "2000" -> "1200" | "1500" | "2000". Returns null when no real price is present.
 * @param {unknown} value
 */
export function parseInrPrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? String(value) : null;
  if (typeof value !== 'string') return null;
  const m = value.replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? String(n) : null;
}

/**
 * Service + OfferCatalog for plan / pricing structured data.
 * Offers without a parseable, real price are omitted, so schema never advertises a price that is not on the page.
 *
 * @param {{ name: string, serviceType?: string, description?: string, url?: string, providerName?: string,
 *   areaServed?: string[], catalogName?: string,
 *   offers?: Array<{ name?: string, price?: unknown, description?: string, url?: string }> }} cfg
 */
export function serviceOfferSchema(cfg) {
  if (!cfg?.name) return null;
  const offers = (cfg.offers || [])
    .map((o) => {
      const price = parseInrPrice(o?.price);
      if (!o?.name || !price) return null;
      return {
        '@type': 'Offer',
        name: o.name,
        price,
        priceCurrency: 'INR',
        description: o.description || undefined,
        url: o.url || undefined,
        availability: 'https://schema.org/InStock',
      };
    })
    .filter(Boolean);

  const areas = (cfg.areaServed || []).filter((a) => typeof a === 'string' && a.trim());

  return {
    '@type': 'Service',
    name: cfg.name,
    serviceType: cfg.serviceType || undefined,
    description: cfg.description || undefined,
    url: cfg.url || undefined,
    provider: { '@type': 'Organization', name: cfg.providerName || 'The Urban Physio' },
    areaServed: areas.length ? areas.map((a) => ({ '@type': 'City', name: a })) : undefined,
    hasOfferCatalog: offers.length
      ? {
          '@type': 'OfferCatalog',
          name: cfg.catalogName || `${cfg.name} pricing`,
          itemListElement: offers,
        }
      : undefined,
  };
}

/** Conservative hreflang check (BCP47-ish). Falls back to en-IN. */
export function normalizeHreflang(value, fallback = 'en-IN') {
  const v = typeof value === 'string' ? value.trim() : '';
  return /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$/.test(v) ? v : fallback;
}
