import { useEffect } from 'react';

import { SITE_LOGO_FILE } from '../../constants/siteBrand';

const SITE = 'The Urban Physio';
const DEFAULT_OG = `/${SITE_LOGO_FILE}`;

function upsertMeta(attr, key, content) {
  if (content == null || content === '') return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function usePageMeta({
  title,
  description,
  keywords,
  canonical,
  image,
  ogType = 'website',
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  twitterImage,
  twitterCard = 'summary_large_image',
  twitterSite,
  jsonLd = null,
  noindex = false,
  nofollow = false,
  robots,
}) {
  useEffect(() => {
    const fullTitle = title ? (title.includes(SITE) ? title : `${title} | ${SITE}`) : SITE;
    document.title = fullTitle;

    const desc = description || 'Book verified physiotherapists for online, clinic & home visits across India. The Urban Physio.';
    upsertMeta('name', 'description', desc);
    if (keywords) upsertMeta('name', 'keywords', keywords);

    upsertMeta('property', 'og:title', ogTitle || fullTitle);
    upsertMeta('property', 'og:description', ogDescription || desc);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:site_name', SITE);

    const rawImg = image || `${window.location.origin}${DEFAULT_OG}`;
    const img = rawImg.startsWith('http')
      ? rawImg
      : `${window.location.origin}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;

    upsertMeta('property', 'og:image', img);
    upsertMeta('property', 'og:image:secure_url', img);
    upsertMeta('property', 'og:image:width', '1200');
    upsertMeta('property', 'og:image:height', '630');
    upsertMeta('property', 'og:image:alt', ogTitle || fullTitle);

    upsertMeta('name', 'twitter:card', twitterCard || 'summary_large_image');
    upsertMeta('name', 'twitter:title', twitterTitle || fullTitle);
    upsertMeta('name', 'twitter:description', twitterDescription || desc);
    upsertMeta('name', 'twitter:image', twitterImage || img);
    upsertMeta('name', 'twitter:image:alt', twitterTitle || fullTitle);
    if (twitterSite) upsertMeta('name', 'twitter:site', twitterSite);

    if (canonical) {
      const url = canonical.startsWith('http') ? canonical : `${window.location.origin}${canonical.startsWith('/') ? '' : '/'}${canonical}`;
      upsertLink('canonical', url);
      upsertMeta('property', 'og:url', url);
    } else if (typeof window !== 'undefined') {
      upsertLink('canonical', window.location.href);
      upsertMeta('property', 'og:url', window.location.href);
    }

    const robotsContent =
      robots ||
      `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;
    upsertMeta('name', 'robots', robotsContent);

    if (jsonLd) {
      upsertJsonLd('page-json-ld', jsonLd);
    }

    return () => {
      const ld = document.getElementById('page-json-ld');
      if (ld) ld.remove();
    };
  }, [
    title,
    description,
    keywords,
    canonical,
    image,
    ogType,
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
    twitterImage,
    twitterCard,
    twitterSite,
    jsonLd,
    noindex,
    nofollow,
    robots,
  ]);
}

export default function PageMeta(props) {
  usePageMeta(props);
  return null;
}

export function doctorSchema(doctor, canonicalUrl) {
  const name = `Dr. ${doctor.first_name} ${doctor.last_name}`.trim();
  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name,
    description: doctor.bio || doctor.seo?.description,
    image: doctor.avatar || undefined,
    url: canonicalUrl,
    medicalSpecialty: doctor.specialization || 'Physiotherapy',
    aggregateRating:
      Number(doctor.rating_count) > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(doctor.rating_avg) || 0,
            reviewCount: Number(doctor.rating_count),
          }
        : undefined,
    address: doctor.city_name
      ? { '@type': 'PostalAddress', addressLocality: doctor.city_name, addressCountry: 'IN' }
      : undefined,
  };
}

export function clinicSchema(clinic, canonicalUrl) {
  const reviews = (clinic.reviews || []).slice(0, 5).map((r) => ({
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: Number(r.rating) || 0,
      bestRating: 5,
    },
    author: {
      '@type': 'Person',
      name: r.patient_first_name || 'Patient',
    },
    reviewBody: r.comment || undefined,
    datePublished: r.created_at || undefined,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: clinic.name,
    description: clinic.description || clinic.seo?.description,
    image: clinic.logo || clinic.cover_image || undefined,
    url: canonicalUrl,
    telephone: clinic.phone || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinic.address,
      addressLocality: clinic.city_name,
      addressCountry: 'IN',
    },
    geo:
      clinic.latitude && clinic.longitude
        ? { '@type': 'GeoCoordinates', latitude: clinic.latitude, longitude: clinic.longitude }
        : undefined,
    aggregateRating:
      Number(clinic.rating_count) > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(clinic.rating_avg) || 0,
            reviewCount: Number(clinic.rating_count),
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review: reviews.length ? reviews : undefined,
  };
}

export function breadcrumbSchema(items, canonicalUrl) {
  if (!items?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href
        ? item.href.startsWith('http')
          ? item.href
          : `${window.location.origin}${item.href}`
        : undefined,
    })),
  };
}

/** @param {'clinics'|'doctors'} type */
export function cityListingSchema({ city, type, items, canonicalUrl }) {
  const isClinics = type === 'clinics';
  const seo = city?.seo?.[type] || {};
  const place = city?.location_label || city?.name || 'India';

  const listItems = (items || []).slice(0, 20).map((item, index) => {
    if (isClinics) {
      const url = item.slug
        ? `${window.location.origin}/clinic/${item.slug}`
        : `${window.location.origin}/clinic/id/${item.id}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url,
      };
    }
    const name = `Dr. ${item.first_name || ''} ${item.last_name || ''}`.trim();
    const url = item.slug
      ? `${window.location.origin}/doctor/${item.slug}`
      : `${window.location.origin}/doctors/${item.id}`;
    return {
      '@type': 'ListItem',
      position: index + 1,
      name,
      url,
    };
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: seo.h1 || seo.title,
        description: seo.description,
        url: canonicalUrl,
        inLanguage: 'en-IN',
        isPartOf: {
          '@type': 'WebSite',
          name: 'The Urban Physio',
          url: window.location.origin,
        },
        about: {
          '@type': 'Place',
          name: place,
          address: {
            '@type': 'PostalAddress',
            addressLocality: city?.name,
            addressRegion: city?.state_name,
            addressCountry: 'IN',
          },
        },
      },
      {
        '@type': 'ItemList',
        name: isClinics
          ? `Physiotherapy clinics in ${city?.name || 'city'}`
          : `Physiotherapists in ${city?.name || 'city'}`,
        numberOfItems: items?.length || 0,
        itemListElement: listItems,
      },
    ],
  };
}

export function medicalWebPageSchema({ name, description, canonicalUrl, about }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name,
    description: description || undefined,
    url: canonicalUrl,
    about: about || undefined,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE,
      url: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  };
}

export function itemListSchema({ name, description, canonicalUrl, items }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description: description || undefined,
    url: canonicalUrl,
    numberOfItems: items?.length || 0,
    itemListElement: (items || []).slice(0, 30).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url
        ? item.url.startsWith('http')
          ? item.url
          : `${typeof window !== 'undefined' ? window.location.origin : ''}${item.url}`
        : undefined,
    })),
  };
}

export function faqPageSchema(faqs) {
  if (!faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question || f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer || f.a,
      },
    })),
  };
}
