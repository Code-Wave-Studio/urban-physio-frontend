import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageMeta from './PageMeta';
import { seo as seoApi } from '../../services/api';

/**
 * Applies CMS seo_pages meta for the current path.
 * No-op on API failure / missing row — uses fallback props.
 */
export default function ManagedPageSeo({
  fallbackTitle,
  fallbackDescription,
  fallbackKeywords,
  jsonLd = null,
  pathOverride,
  noindex: forceNoindex = false,
  nofollow: forceNofollow = false,
  canonical: canonicalOverride,
  image: imageOverride,
  preferFallbackWhenUnmanaged = false,
}) {
  const location = useLocation();
  const path = pathOverride || location.pathname || '/';
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    let cancelled = false;
    seoApi
      .pageMeta(path)
      .then((res) => {
        if (!cancelled) setMeta(res.data || res);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  // meta.found === false means no active seo_pages row: the API returns site-wide defaults,
  // which must not outrank page-level CMS copy for pages that opt in.
  const useFallback = preferFallbackWhenUnmanaged && meta?.found === false;
  const copy = useFallback ? {} : meta || {};
  const title = (useFallback && fallbackTitle) || meta?.title || fallbackTitle;
  const description = (useFallback && fallbackDescription) || meta?.description || fallbackDescription;
  const keywords = (useFallback && fallbackKeywords) || meta?.keywords || fallbackKeywords;
  const robotsParts = (meta?.robots || 'index, follow').split(',').map((s) => s.trim());
  const noindex = forceNoindex || robotsParts.includes('noindex');
  const nofollow = forceNofollow || robotsParts.includes('nofollow');

  const schema = meta?.schema || jsonLd;
  const robots =
    forceNoindex || forceNofollow
      ? `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`
      : meta?.robots;

  return (
    <PageMeta
      title={title}
      description={description}
      keywords={keywords}
      canonical={canonicalOverride || meta?.canonical || path}
      image={imageOverride || meta?.og?.image}
      ogType={meta?.og?.type || 'website'}
      ogTitle={copy.og?.title}
      ogDescription={copy.og?.description}
      twitterTitle={copy.twitter?.title}
      twitterDescription={copy.twitter?.description}
      twitterImage={meta?.twitter?.image}
      twitterCard={meta?.twitter?.card}
      twitterSite={meta?.twitter?.site}
      jsonLd={schema}
      noindex={noindex}
      nofollow={nofollow}
      robots={robots}
    />
  );
}
