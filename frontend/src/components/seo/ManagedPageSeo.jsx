import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageMeta from '../components/seo/PageMeta';
import { seo as seoApi } from '../services/api';

/**
 * Applies CMS-managed SEO meta for the current path when a seo_pages row exists.
 * Safe no-op if API fails or page is not configured.
 */
export default function ManagedPageSeo({ fallbackTitle, fallbackDescription, jsonLd = null }) {
  const location = useLocation();
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    let cancelled = false;
    seoApi
      .pageMeta(location.pathname || '/')
      .then((res) => {
        if (!cancelled) setMeta(res.data || res);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const title = meta?.title || fallbackTitle;
  const description = meta?.description || fallbackDescription;
  const robotsParts = (meta?.robots || 'index, follow').split(',').map((s) => s.trim());
  const noindex = robotsParts.includes('noindex');
  const nofollow = robotsParts.includes('nofollow');

  return (
    <PageMeta
      title={title}
      description={description}
      keywords={meta?.keywords}
      canonical={meta?.canonical || location.pathname}
      image={meta?.og?.image}
      ogType={meta?.og?.type || 'website'}
      ogTitle={meta?.og?.title}
      ogDescription={meta?.og?.description}
      twitterTitle={meta?.twitter?.title}
      twitterDescription={meta?.twitter?.description}
      twitterImage={meta?.twitter?.image}
      twitterCard={meta?.twitter?.card}
      twitterSite={meta?.twitter?.site}
      jsonLd={meta?.schema || jsonLd}
      noindex={noindex}
      nofollow={nofollow}
      robots={meta?.robots}
    />
  );
}
