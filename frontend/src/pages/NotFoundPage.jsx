import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { seo as seoApi } from '../services/api';
import PageMeta from '../components/seo/PageMeta';

export default function NotFoundPage() {
  const location = useLocation();

  useEffect(() => {
    seoApi
      .log404({
        path: location.pathname + (location.search || ''),
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      })
      .catch(() => {});
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <PageMeta
        title="Page not found"
        description="The page you requested could not be found on The Urban Physio."
        canonical={location.pathname}
        noindex
      />
      <div className="max-w-lg text-center">
        <p className="text-6xl font-bold text-primary-600 mb-2">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-600 text-sm mb-8">
          This URL does not exist or may have moved. Try searching for a physiotherapist or return home.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/" className="btn-primary">
            Go home
          </Link>
          <Link to="/doctors" className="btn-outline">
            Find doctors
          </Link>
          <Link to="/clinics" className="btn-outline">
            Find clinics
          </Link>
        </div>
      </div>
    </div>
  );
}
