import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { seo as seoApi } from '../services/api';

const SeoContext = createContext({
  config: null,
  loading: true,
  refresh: () => {},
});

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

function ensureScript(id, src, attrs = {}) {
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.async = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

function ensureInlineScript(id, code) {
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.textContent = code;
  document.head.appendChild(s);
}

function applyIntegrations(config) {
  if (!config) return;

  if (config.google_search_console_code) {
    upsertMeta('name', 'google-site-verification', config.google_search_console_code);
  }
  if (config.bing_webmaster_code) {
    upsertMeta('name', 'msvalidate.01', config.bing_webmaster_code);
  }

  if (config.schema && Array.isArray(config.schema['@graph']) && config.schema['@graph'].length) {
    upsertJsonLd('global-seo-json-ld', config.schema);
  }

  const gtm = (config.google_tag_manager_id || '').trim();
  const ga = (config.google_analytics_id || '').trim();

  if (gtm) {
    ensureInlineScript(
      'seo-gtm-boot',
      `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`
    );
  } else if (ga) {
    ensureScript('seo-ga-src', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`);
    ensureInlineScript(
      'seo-ga-boot',
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`
    );
  }
}

function SeoRedirectWatcher() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname || '/';
    if (path.startsWith('/admin') || path.startsWith('/patient') || path.startsWith('/doctor')) {
      return undefined;
    }
    let cancelled = false;
    seoApi
      .resolveRedirect(path)
      .then((res) => {
        if (cancelled) return;
        const hit = res?.data?.redirect || res?.redirect;
        if (!hit?.to_url) return;
        const to = hit.to_url;
        if (/^https?:\/\//i.test(to)) {
          window.location.replace(to);
          return;
        }
        navigate(to, { replace: true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  return null;
}

export function SeoProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    seoApi
      .config()
      .then((res) => {
        const data = res.data || res;
        setConfig(data);
        applyIntegrations(data);
      })
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(() => ({ config, loading, refresh }), [config, loading]);

  return (
    <SeoContext.Provider value={value}>
      <SeoRedirectWatcher />
      {children}
    </SeoContext.Provider>
  );
}

export const useSeoConfig = () => useContext(SeoContext);
