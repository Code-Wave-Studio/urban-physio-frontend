import { useEffect } from 'react';

import { SITE_LOGO_FILE } from '../../constants/siteBrand';

const SITE = 'The Urban Physio';
const DEFAULT_OG = `/${SITE_LOGO_FILE}`;

function upsertMeta(attr, key, content) {
  if (!content) return;
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
  canonical,
  image,
  ogType = 'website',
  jsonLd = null,
  noindex = false,
}) {
  useEffect(() => {
    const fullTitle = title ? (title.includes(SITE) ? title : `${title} | ${SITE}`) : SITE;
    document.title = fullTitle;

    const desc = description || 'Book verified physiotherapists for online, clinic & home visits across India.';
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:site_name', SITE);

    const img = image || `${window.location.origin}${DEFAULT_OG}`;
    upsertMeta('property', 'og:image', img);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);

    if (canonical) {
      const url = canonical.startsWith('http') ? canonical : `${window.location.origin}${canonical}`;
      upsertLink('canonical', url);
      upsertMeta('property', 'og:url', url);
    }

    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    if (jsonLd) {
      upsertJsonLd('page-json-ld', jsonLd);
    }

    return () => {
      const ld = document.getElementById('page-json-ld');
      if (ld) ld.remove();
    };
  }, [title, description, canonical, image, ogType, jsonLd, noindex]);
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
          }
        : undefined,
  };
}
