import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageMeta from './PageMeta';
import { seo as seoApi } from '../../services/api';

/**
 * Applies CMS-managed SEO meta for the current path when a seo_pages row exists.
 * Safe no-op if API fails or page is not configured — falls back to provided defaults.
 *
 * @param {{
 *   fallbackTitle?: string,
 *   fallbackDescription?: string,
 *   fallbackKeywords?: string,
 *   jsonLd?: object | object[] | null,
 *   pathOverride?: string,
 *   noindex?: boolean,
 *   nofollow?: boolean,
 *   canonical?: string,
 *   image?: string,
 * }} props
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

  const title = meta?.title || fallbackTitle;
  const description = meta?.description || fallbackDescription;
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
      keywords={meta?.keywords || fallbackKeywords}
      canonical={canonicalOverride || meta?.canonical || path}
      image={imageOverride || meta?.og?.image}
      ogType={meta?.og?.type || 'website'}
      ogTitle={meta?.og?.title}
      ogDescription={meta?.og?.description}
      twitterTitle={meta?.twitter?.title}
      twitterDescription={meta?.twitter?.description}
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
